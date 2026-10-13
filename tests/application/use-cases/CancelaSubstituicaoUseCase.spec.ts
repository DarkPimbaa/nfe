import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CancelaSubstituicaoUseCase } from '@nfe/application/use-cases/CancelaSubstituicaoUseCase';
import { SefazRejectError } from '@nfe/shared/errors/SefazRejectError';
import { NFeError } from '@nfe/shared/errors/NFeError';
import type { CertificateData } from '@nfe/contracts/CertificateProvider';
import type { SefazRequest, SefazResponse } from '@nfe/contracts/SefazTransport';

const fakeCert: CertificateData = {
  pfx: Buffer.from('fake-pfx'),
  password: 'test',
  notAfter: new Date('2030-01-01'),
  privateKey: 'fake-key',
  certPem: 'fake-cert'
};

// MT (51), modelo 65 nas posições 20-21.
const CHAVE_CANCELADA = '51240412345678000195650010000000011234567890';
const CHAVE_SUBSTITUTA = '51240412345678000195650010000000021234567890';
const CHAVE_MOD55 = '51240412345678000195550010000000011234567890';

const INPUT_OK = {
  chaveAcesso: CHAVE_CANCELADA,
  cnpj: '12345678000195',
  protocolo: '151240000012345',
  justificativa: 'Erro na emissao da nota fiscal eletronica',
  chaveSubstituta: CHAVE_SUBSTITUTA
};

function buildSoapEventoResponse(cStat: string, xMotivo: string, nProt?: string): string {
  return [
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">',
    '<soap12:Body>',
    '<retEnvEvento><retEvento versao="1.00"><infEvento>',
    `<cStat>${cStat}</cStat>`,
    `<xMotivo>${xMotivo}</xMotivo>`,
    nProt ? `<nProt>${nProt}</nProt>` : '',
    '<tpEvento>110112</tpEvento>',
    '</infEvento></retEvento></retEnvEvento>',
    '</soap12:Body>',
    '</soap12:Envelope>'
  ].join('');
}

function createUseCase(
  soapResponse: string,
  capture?: { url?: string; xml?: string }
): CancelaSubstituicaoUseCase {
  return new CancelaSubstituicaoUseCase({
    certificate: { load: async (): Promise<CertificateData> => fakeCert },
    transport: {
      send: async (req: SefazRequest): Promise<SefazResponse> => {
        if (capture) capture.url = req.url;
        return { xml: soapResponse, statusCode: 200 };
      }
    },
    xmlSigner: {
      sign: (xml: string): string => {
        if (capture) capture.xml = xml;
        return xml;
      }
    },
    environment: 'homologation'
  });
}

describe('CancelaSubstituicaoUseCase (110112)', () => {
  it('deve retornar EventoResult quando cStat 135', async () => {
    const useCase = createUseCase(buildSoapEventoResponse('135', 'Evento registrado', '151240000012345'));

    const result = await useCase.execute(INPUT_OK);

    assert.equal(result.cStat, '135');
    assert.equal(result.nProt, '151240000012345');
  });

  it('deve retornar EventoResult quando cStat 136', async () => {
    const useCase = createUseCase(buildSoapEventoResponse('136', 'Evento registrado', '151240000012345'));

    const result = await useCase.execute(INPUT_OK);

    assert.equal(result.cStat, '136');
  });

  it('deve lancar SefazRejectError quando cStat diferente de 135/136', async () => {
    const useCase = createUseCase(buildSoapEventoResponse('573', 'Duplicidade de evento'));

    await assert.rejects(() => useCase.execute(INPUT_OK), (err: unknown) => {
      assert.ok(err instanceof SefazRejectError);
      assert.equal(err.cStat, '573');
      return true;
    });
  });

  it('deve enviar para o endpoint NFC-e (nfcews)', async () => {
    const capture: { url?: string; xml?: string } = {};
    const useCase = createUseCase(buildSoapEventoResponse('135', 'Evento registrado', '151240000012345'), capture);

    await useCase.execute(INPUT_OK);

    assert.ok(capture.url?.includes('nfcews'), `esperava endpoint NFC-e, veio: ${capture.url}`);
  });

  it('deve montar XML 110112 com chNFeRef e defaults cOrgaoAutor/verAplic', async () => {
    const capture: { url?: string; xml?: string } = {};
    const useCase = createUseCase(buildSoapEventoResponse('135', 'Evento registrado', '151240000012345'), capture);

    await useCase.execute(INPUT_OK);

    assert.ok(capture.xml?.includes('<tpEvento>110112</tpEvento>'));
    assert.ok(capture.xml?.includes('<descEvento>Cancelamento por substituicao</descEvento>'));
    assert.ok(capture.xml?.includes(`<chNFeRef>${CHAVE_SUBSTITUTA}</chNFeRef>`));
    assert.ok(capture.xml?.includes('<cOrgaoAutor>51</cOrgaoAutor>'));
    assert.ok(capture.xml?.includes('<verAplic>1.0.0</verAplic>'));
    assert.ok(capture.xml?.includes(`ID110112${CHAVE_CANCELADA}01`));
  });

  it('deve respeitar cOrgaoAutor/verAplic informados', async () => {
    const capture: { url?: string; xml?: string } = {};
    const useCase = createUseCase(buildSoapEventoResponse('135', 'Evento registrado', '151240000012345'), capture);

    await useCase.execute({ ...INPUT_OK, cOrgaoAutor: '51', verAplic: '3.2.1' });

    assert.ok(capture.xml?.includes('<verAplic>3.2.1</verAplic>'));
  });

  it('deve rejeitar chave modelo 55 (exclusivo NFC-e)', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute({ ...INPUT_OK, chaveAcesso: CHAVE_MOD55 }),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        assert.match(err.message, /modelo 65/);
        return true;
      }
    );
  });

  it('deve rejeitar chave substituta modelo 55', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute({ ...INPUT_OK, chaveSubstituta: CHAVE_MOD55 }),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        assert.match(err.message, /substituta.*modelo 65/);
        return true;
      }
    );
  });

  it('deve rejeitar chave substituta igual a cancelada', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute({ ...INPUT_OK, chaveSubstituta: CHAVE_CANCELADA }),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        assert.match(err.message, /diferente/);
        return true;
      }
    );
  });

  it('deve rejeitar chave substituta invalida', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute({ ...INPUT_OK, chaveSubstituta: '123' }),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        return true;
      }
    );
  });

  it('deve lancar NFeError para justificativa curta', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute({ ...INPUT_OK, justificativa: 'curta' }),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        assert.ok(err.message.includes('15 caracteres'));
        return true;
      }
    );
  });

  it('deve lancar NFeError para chave invalida', async () => {
    const useCase = createUseCase('');

    await assert.rejects(
      () => useCase.execute({ ...INPUT_OK, chaveAcesso: '123' }),
      (err: unknown) => {
        assert.ok(err instanceof NFeError);
        return true;
      }
    );
  });
});
