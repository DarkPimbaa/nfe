import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { XsdSchemaValidator } from '@nfe/infra/schema/XsdSchemaValidator';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { CertificateData } from '@nfe/contracts/CertificateProvider';
import {
  buildCancelamentoXml,
  buildCancelamentoSubstituicaoXml,
  buildCartaCorrecaoXml,
  buildInutilizacaoXml
} from '@nfe/infra/sefaz/evento-soap';
import { buildManifestacaoXml } from '@nfe/infra/sefaz/manifestacao-soap';
import { generateTestCertificate } from '../../helpers/generate-test-certificate';

const schemasDir = resolve(__dirname, '..', '..', '..', 'schemas');
const NFE_NS = 'http://www.portalfiscal.inf.br/nfe';
const CHAVE = '51260411222333000181550010000000011000000015';
const CNPJ = '11222333000181';
const DH_EVENTO = '2026-04-28T10:00:00-04:00';

/**
 * A SEFAZ recebe o evento dentro de um lote `envEvento`, que e o elemento raiz
 * dos XSDs de evento. Os builders da lib devolvem so o `<evento>` — o lote e
 * montado junto com o envelope SOAP.
 */
function wrapEnvEvento(signedEventoXml: string): string {
  return (
    `<envEvento versao="1.00" xmlns="${NFE_NS}">` +
    '<idLote>1</idLote>' +
    signedEventoXml.replace(/<\?xml[^?]*\?>\s*/g, '') +
    '</envEvento>'
  );
}

describe('XsdSchemaValidator — eventos e inutilizacao', () => {
  const validator = new XsdSchemaValidator({ schemasDir });
  const signer = new DefaultXmlSigner();
  let cert: CertificateData;

  before(async () => {
    const { pfx, password } = generateTestCertificate();
    cert = await new A1CertificateProvider(pfx, password).load();
  });

  it('deve validar evento de cancelamento contra o XSD oficial', () => {
    const xml = buildCancelamentoXml(
      CHAVE,
      CNPJ,
      '51',
      '2',
      '151260000000001',
      'Cancelamento por erro na emissao do documento fiscal',
      DH_EVENTO
    );

    const result = validator.validate(wrapEnvEvento(signer.sign(xml, cert)), 'cancelamento');

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve validar carta de correcao contra o XSD oficial', () => {
    const xml = buildCartaCorrecaoXml(
      CHAVE,
      CNPJ,
      '51',
      '2',
      'Correcao da descricao do produto do item 1',
      1,
      DH_EVENTO
    );

    const result = validator.validate(wrapEnvEvento(signer.sign(xml, cert)), 'cartaCorrecao');

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve validar manifestacao do destinatario contra o XSD oficial', () => {
    const xml = buildManifestacaoXml('confirmacao', CHAVE, CNPJ, '91', '2', DH_EVENTO);

    const result = validator.validate(wrapEnvEvento(signer.sign(xml, cert)), 'manifestacao');

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve validar pedido de inutilizacao contra o XSD oficial', () => {
    const xml = buildInutilizacaoXml(CNPJ, '51', '2', '26', '1', '10', '15', 'Erro de sistema');

    const result = validator.validate(signer.sign(xml, cert), 'inutilizacao');

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve validar cancelamento por substituicao (110112) contra o XSD oficial', () => {
    const chaveNfce = '51260411222333000181650010000000011000000015';
    const chaveRef = '51260411222333000181650010000000021000000015';
    const xml = buildCancelamentoSubstituicaoXml(
      chaveNfce,
      CNPJ,
      '51',
      '2',
      '151260000000001',
      'Cancelamento por erro na emissao do documento fiscal',
      chaveRef,
      '51',
      '1.0.0',
      DH_EVENTO
    );

    const result = validator.validate(wrapEnvEvento(signer.sign(xml, cert)), 'cancelamentoSubstituicao');

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve reprovar substituicao sem chave referenciada', () => {
    const chaveNfce = '51260411222333000181650010000000011000000015';
    const xml = buildCancelamentoSubstituicaoXml(
      chaveNfce,
      CNPJ,
      '51',
      '2',
      '151260000000001',
      'Cancelamento por erro na emissao do documento fiscal',
      '51260411222333000181650010000000021000000015',
      '51',
      '1.0.0',
      DH_EVENTO
    ).replace(/<chNFeRef>[^<]*<\/chNFeRef>/, '');

    const result = validator.validate(wrapEnvEvento(signer.sign(xml, cert)), 'cancelamentoSubstituicao');

    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('deve reprovar evento com justificativa curta demais', () => {
    const xml = buildCancelamentoXml(CHAVE, CNPJ, '51', '2', '151260000000001', 'erro', DH_EVENTO);

    const result = validator.validate(wrapEnvEvento(signer.sign(xml, cert)), 'cancelamento');

    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('deve resolver o schema de cada tipo de documento', () => {
    assert.ok(validator.schemaPathFor('epec').endsWith('envEPEC_v1.00.xsd'));
    assert.ok(validator.schemaPathFor('consultaGTIN').endsWith('consGTIN_v1.00.xsd'));
    assert.ok(validator.schemaPathFor('distribuicaoDFe').endsWith('distDFeInt_v1.01.xsd'));
    assert.ok(validator.schemaPathFor('comprovanteEntrega').endsWith('envEventoEntregaNFe_v1.00.xsd'));
  });

  it('deve aceitar diretorio de schemas como string (retrocompat)', () => {
    const legacy = new XsdSchemaValidator(schemasDir);
    assert.ok(legacy.schemaPathFor('nfe').endsWith('nfe_v4.00.xsd'));
  });
});
