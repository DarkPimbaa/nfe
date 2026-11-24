import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nfeSchema, nfeIdentificacaoSchema } from '@nfe/domain/schemas/nfe-schema';

const identificacaoBase = {
  naturezaOperacao: 'Multa e juros',
  tipoOperacao: 1,
  destinoOperacao: 1,
  finalidade: 5,
  consumidorFinal: 1,
  presencaComprador: 1,
  uf: 'MT',
  municipio: '5103403',
  serie: 1,
  numero: 1
};

const emitenteBase = {
  cnpj: '11222333000181',
  razaoSocial: 'Empresa Teste Ltda',
  inscricaoEstadual: '111111111111',
  regimeTributario: 3,
  endereco: {
    logradouro: 'Rua Teste',
    numero: '100',
    bairro: 'Centro',
    codigoMunicipio: '5103403',
    municipio: 'Cuiaba',
    uf: 'MT',
    cep: '78005000'
  }
};

const produtoBase = {
  numero: 1,
  codigo: 'PROD001',
  descricao: 'Camiseta',
  ncm: '61091000',
  cfop: '5102',
  unidade: 'UN',
  quantidade: 2,
  valorUnitario: 50,
  valorTotal: 100,
  icms: { origem: 0, cst: '00', baseCalculo: 100, aliquota: 17, valor: 17 },
  pis: { cst: '01', baseCalculo: 100, aliquota: 1.65, valor: 1.65 },
  cofins: { cst: '01', baseCalculo: 100, aliquota: 7.6, valor: 7.6 }
};

const nfeBase = {
  identificacao: identificacaoBase,
  emitente: emitenteBase,
  produtos: [produtoBase],
  transporte: { modalidadeFrete: 9 },
  pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
};

const REF = {
  chaveAcesso: '51240412345678000195550010000000011234567890'
};

describe('NFe credito/debito (finNFe 5/6) — schemas', () => {
  it('aceita finalidade 5 com tipoNotaCredito', () => {
    const r = nfeIdentificacaoSchema.safeParse({
      ...identificacaoBase,
      finalidade: 5,
      tipoNotaCredito: '03'
    });
    assert.equal(r.success, true);
  });

  it('aceita finalidade 6 com tipoNotaDebito', () => {
    const r = nfeIdentificacaoSchema.safeParse({
      ...identificacaoBase,
      finalidade: 6,
      tipoNotaDebito: '04'
    });
    assert.equal(r.success, true);
  });

  it('rejeita finalidade 5 sem tipoNotaCredito', () => {
    const r = nfeIdentificacaoSchema.safeParse({ ...identificacaoBase, finalidade: 5 });
    assert.equal(r.success, false);
  });

  it('rejeita finalidade 6 sem tipoNotaDebito', () => {
    const r = nfeIdentificacaoSchema.safeParse({ ...identificacaoBase, finalidade: 6 });
    assert.equal(r.success, false);
  });

  it('rejeita motivo fora da lista (tpNFCredito 07, tpNFDebito 09)', () => {
    assert.equal(
      nfeIdentificacaoSchema.safeParse({
        ...identificacaoBase,
        finalidade: 5,
        tipoNotaCredito: '07'
      }).success,
      false
    );
    assert.equal(
      nfeIdentificacaoSchema.safeParse({
        ...identificacaoBase,
        finalidade: 6,
        tipoNotaDebito: '09'
      }).success,
      false
    );
  });

  it('credito 03 sem referencia no item passa nas regras de item (ref. de cabecalho e regra futura)', () => {
    const r = nfeSchema.safeParse({
      ...nfeBase,
      identificacao: { ...identificacaoBase, finalidade: 5, tipoNotaCredito: '03' },
      produtos: [{ ...produtoBase, cfop: '1202' }]
    });
    assert.equal(r.success, true);
  });

  it('credito 03 com DFeReferenciado no item falha (VC02-07: so o 06 referencia por item)', () => {
    const r = nfeSchema.safeParse({
      ...nfeBase,
      identificacao: { ...identificacaoBase, finalidade: 5, tipoNotaCredito: '03' },
      produtos: [{ ...produtoBase, dfeReferenciado: REF }]
    });
    assert.equal(r.success, false);
  });

  it('credito 06 com DFeReferenciado no item passa (excecao VC02-07)', () => {
    const r = nfeSchema.safeParse({
      ...nfeBase,
      identificacao: { ...identificacaoBase, finalidade: 5, tipoNotaCredito: '06' },
      produtos: [{ ...produtoBase, cfop: '1202', dfeReferenciado: REF }]
    });
    assert.equal(r.success, true);
  });

  it('credito 04 com DFeReferenciado no item falha (VC02-07)', () => {
    const r = nfeSchema.safeParse({
      ...nfeBase,
      identificacao: { ...identificacaoBase, finalidade: 5, tipoNotaCredito: '04' },
      produtos: [{ ...produtoBase, dfeReferenciado: REF }]
    });
    assert.equal(r.success, false);
  });

  it('debito 03 sem DFeReferenciado no item falha (VC02-10)', () => {
    const r = nfeSchema.safeParse({
      ...nfeBase,
      identificacao: { ...identificacaoBase, finalidade: 6, tipoNotaDebito: '03' }
    });
    assert.equal(r.success, false);
  });

  it('debito 03 com DFeReferenciado no item passa', () => {
    const r = nfeSchema.safeParse({
      ...nfeBase,
      identificacao: { ...identificacaoBase, finalidade: 6, tipoNotaDebito: '03' },
      produtos: [{ ...produtoBase, dfeReferenciado: REF }]
    });
    assert.equal(r.success, true);
  });

  it('nota normal (finNFe 1) sem referencia continua valida', () => {
    const r = nfeSchema.safeParse({
      ...nfeBase,
      identificacao: { ...identificacaoBase, finalidade: 1 }
    });
    assert.equal(r.success, true);
  });
});
