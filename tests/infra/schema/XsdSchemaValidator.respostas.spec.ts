import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { XsdSchemaValidator } from '@nfe/infra/schema/XsdSchemaValidator';

const schemasDir = resolve(__dirname, '..', '..', '..', 'schemas');
const NFE_NS = 'http://www.portalfiscal.inf.br/nfe';
const DH_RESP = '2026-04-28T10:00:00-04:00';

function retDistDFeInt(verAplic: string, xMotivo: string, ultNSU?: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<retDistDFeInt versao="1.01" xmlns="${NFE_NS}">` +
    '<tpAmb>2</tpAmb>' +
    `<verAplic>${verAplic}</verAplic>` +
    '<cStat>138</cStat>' +
    `<xMotivo>${xMotivo}</xMotivo>` +
    `<dhResp>${DH_RESP}</dhResp>` +
    `<ultNSU>${ultNSU ?? '000000000000001'}</ultNSU>` +
    '<maxNSU>000000000000001</maxNSU>' +
    '</retDistDFeInt>'
  );
}

function retConsGTIN(verAplic: string, xMotivo: string, cStat?: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<retConsGTIN versao="1.00" xmlns="${NFE_NS}">` +
    `<verAplic>${verAplic}</verAplic>` +
    `<cStat>${cStat ?? '100'}</cStat>` +
    `<xMotivo>${xMotivo}</xMotivo>` +
    `<dhResp>${DH_RESP}</dhResp>` +
    '</retConsGTIN>'
  );
}

describe('XsdSchemaValidator — respostas da SEFAZ', () => {
  const validator = new XsdSchemaValidator({ schemasDir });

  it('deve validar resposta da distribuicao DFe com textos realistas', () => {
    const xml = retDistDFeInt('SVAN_4.00', 'Documento(s) localizado(s)');
    const result = validator.validate(xml, 'retDistDFeInt');

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve aceitar verAplic/xMotivo curtos (mas legais) na distribuicao DFe', () => {
    // Regressao: o pattern TString com `{0,}` quebrava no xmllint antigo para
    // valores de exatamente 2 caracteres (exige `{0,}` ~= zero repeticoes).
    const xml = retDistDFeInt('OK', 'OK');
    const result = validator.validate(xml, 'retDistDFeInt');

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve reprovar resposta da distribuicao DFe com NSU invalido', () => {
    const xml = retDistDFeInt('SVAN_4.00', 'Documento(s) localizado(s)', 'ABC');
    const result = validator.validate(xml, 'retDistDFeInt');

    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.some((e) => e.field === 'ultNSU'));
  });

  it('deve validar resposta da consulta GTIN com textos realistas', () => {
    const xml = retConsGTIN('CCG_PL_009_V1', 'Consulta efetuada com sucesso');
    const result = validator.validate(xml, 'retConsGTIN');

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve aceitar verAplic/xMotivo curtos (mas legais) na consulta GTIN', () => {
    // Regressao: alem do mesmo `{0,}`, o schema nem compilava no xmllint
    // antigo (o enumeration `12` do TTpGTIN caia no pattern quebrado).
    const xml = retConsGTIN('OK', 'OK');
    const result = validator.validate(xml, 'retConsGTIN');

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve reprovar resposta da consulta GTIN com cStat invalido', () => {
    const xml = retConsGTIN('CCG_PL_009_V1', 'Consulta efetuada com sucesso', 'ABC');
    const result = validator.validate(xml, 'retConsGTIN');

    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.some((e) => e.field === 'cStat'));
  });

  it('deve resolver o schema dos documentos de resposta', () => {
    assert.ok(validator.schemaPathFor('retDistDFeInt').endsWith('retDistDFeInt_v1.01.xsd'));
    assert.ok(validator.schemaPathFor('retConsGTIN').endsWith('retConsGTIN_v1.00.xsd'));
  });
});
