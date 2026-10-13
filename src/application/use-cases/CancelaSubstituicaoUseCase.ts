import { CertificateProvider } from '@nfe/contracts/CertificateProvider';
import { SefazTransport } from '@nfe/contracts/SefazTransport';
import { XmlSigner } from '@nfe/contracts/XmlSigner';
import { NFeEnvironment } from '@nfe/core/types';
import { NFeError } from '@nfe/shared/errors/NFeError';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import { getEventoUrl, ibgeToUf, SefazEnvironment } from '@nfe/shared/constants/sefaz-urls';
import { extractSoapBody } from '@nfe/infra/sefaz/soap';
import { formatDate } from '@nfe/infra/xml/xml-helper';
import {
  buildCancelamentoSubstituicaoXml,
  wrapEventoSoapEnvelope,
  parseEventoResponse,
  EVENTO_SOAP_ACTION,
  EventoResult
} from '@nfe/infra/sefaz/evento-soap';

export type { EventoResult } from '@nfe/infra/sefaz/evento-soap';

type CancelaSubstituicaoDeps = {
  readonly certificate: CertificateProvider;
  readonly transport: SefazTransport;
  readonly xmlSigner: XmlSigner;
  readonly environment: NFeEnvironment;
};

type CancelaSubstituicaoInput = {
  readonly chaveAcesso: string;
  readonly cnpj: string;
  readonly protocolo: string;
  readonly justificativa: string;
  /** Chave da NFC-e substituta (modelo 65, diferente da cancelada). */
  readonly chaveSubstituta: string;
  /** UF autora do evento. Default: UF da chave cancelada. */
  readonly cOrgaoAutor?: string;
  /** Versão do aplicativo emissor. Default: '1.0.0'. */
  readonly verAplic?: string;
};

function toSefazEnv(env: NFeEnvironment): SefazEnvironment {
  return env === 'homologation' ? 'homologacao' : 'producao';
}

function modeloDaChave(chave: string): string {
  return chave.substring(20, 22);
}

/**
 * Cancelamento por substituição de NFC-e (evento 110112).
 *
 * Exclusivo do modelo 65: a NFC-e errada é cancelada referenciando a NFC-e
 * correta que a substitui. Mesmo contrato de erro dos demais eventos:
 * sucesso (cStat 135/136) → `EventoResult`; rejeição → `throw SefazRejectError`.
 */
export class CancelaSubstituicaoUseCase {
  constructor(private readonly deps: CancelaSubstituicaoDeps) {}

  async execute(input: CancelaSubstituicaoInput): Promise<EventoResult> {
    this.validate(input);

    const { certificate, transport, xmlSigner, environment } = this.deps;
    const uf = ibgeToUf(input.chaveAcesso.substring(0, 2));
    const cOrgao = input.chaveAcesso.substring(0, 2);
    const tpAmb: '1' | '2' = environment === 'production' ? '1' : '2';
    const dhEvento = formatDate(new Date());

    const eventoXml = buildCancelamentoSubstituicaoXml(
      input.chaveAcesso,
      input.cnpj,
      cOrgao,
      tpAmb,
      input.protocolo,
      input.justificativa,
      input.chaveSubstituta,
      input.cOrgaoAutor ?? cOrgao,
      input.verAplic ?? '1.0.0',
      dhEvento
    );

    const cert = await certificate.load();
    const signedXml = xmlSigner.sign(eventoXml, cert);
    const envelope = wrapEventoSoapEnvelope(signedXml);

    const sefazEnv = toSefazEnv(environment);
    const url = getEventoUrl(uf, sefazEnv, '65');

    const response = await transport.send({
      url,
      soapAction: EVENTO_SOAP_ACTION,
      xml: envelope,
      pfx: cert.pfx,
      password: cert.password
    });

    const body = extractSoapBody(response.xml);
    const result = parseEventoResponse(body);

    if (result.cStat === '135' || result.cStat === '136') {
      return result;
    }

    throw new SefazRejectError(result.cStat, result.xMotivo, uf);
  }

  private validate(input: CancelaSubstituicaoInput): void {
    if (!/^\d{44}$/.test(input.chaveAcesso)) {
      throw new NFeError('Chave de acesso invalida: deve ter 44 digitos numericos');
    }
    if (modeloDaChave(input.chaveAcesso) !== '65') {
      throw new NFeError('Cancelamento por substituicao (110112) e exclusivo de NFC-e (modelo 65)');
    }
    if (!/^\d{14}$/.test(input.cnpj)) {
      throw new NFeError('CNPJ invalido: deve ter 14 digitos numericos');
    }
    if (!input.protocolo) {
      throw new NFeError('Protocolo de autorizacao eh obrigatorio para cancelamento');
    }
    if (!input.justificativa || input.justificativa.length < 15) {
      throw new NFeError('Justificativa deve ter no minimo 15 caracteres');
    }
    if (!/^\d{44}$/.test(input.chaveSubstituta)) {
      throw new NFeError('Chave substituta invalida: deve ter 44 digitos numericos');
    }
    if (modeloDaChave(input.chaveSubstituta) !== '65') {
      throw new NFeError('Chave substituta deve ser de NFC-e (modelo 65)');
    }
    if (input.chaveSubstituta === input.chaveAcesso) {
      throw new NFeError('Chave substituta deve ser diferente da chave cancelada');
    }
    if (input.verAplic !== undefined && (input.verAplic.length < 1 || input.verAplic.length > 20)) {
      throw new NFeError('verAplic deve ter entre 1 e 20 caracteres');
    }
  }
}
