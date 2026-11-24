import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nfeSchema } from '@nfe/domain/schemas/nfe-schema';
import {
  errosDevolucao,
  errosI08_140,
  errosB25_40,
  errosVC02_14,
  isCFOPDevolucao
} from '@nfe/domain/devolucao-regras';
import type { NFeProps } from '@nfe/domain/entities/NFe';

const identificacaoBase = {
  naturezaOperacao: 'Devolucao de venda',
  tipoOperacao: 1,
  destinoOperacao: 1,
  finalidade: 4,
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

function produtoBase(cfop: string, ncm = '61091000'): Record<string, unknown> {
  return {
    numero: 1,
    codigo: 'PROD001',
    descricao: 'Camiseta',
    ncm,
    cfop,
    unidade: 'UN',
    quantidade: 2,
    valorUnitario: 50,
    valorTotal: 100,
    icms: { origem: 0, cst: '00', baseCalculo: 100, aliquota: 17, valor: 17 },
    pis: { cst: '01', baseCalculo: 100, aliquota: 1.65, valor: 1.65 },
    cofins: { cst: '01', baseCalculo: 100, aliquota: 7.6, valor: 7.6 }
  };
}

function nfe(extra: Record<string, unknown> = {}, cfop = '1202'): NFeProps {
  return {
    identificacao: { ...identificacaoBase, ...extra },
    emitente: emitenteBase,
    produtos: [produtoBase(cfop)],
    transporte: { modalidadeFrete: 9 },
    pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
  } as unknown as NFeProps;
}

const CHAVE = '51240412345678000195550010000000011234567890';

describe('Devolucao e CFOP (Fase 5) — regras puras', () => {
  it('reconhece CFOPs de devolucao de entrada, saida e exterior', () => {
    for (const cfop of ['1201', '1202', '1410', '1553', '1661', '1918', '2202', '3201', '5202', '5410', '5921', '6202', '7202']) {
      assert.equal(isCFOPDevolucao(cfop), true, cfop);
    }
    for (const cfop of ['5102', '6102', '1949', '5949']) {
      assert.equal(isCFOPDevolucao(cfop), false, cfop);
    }
  });

  it('I08-140: devolucao com CFOP de venda falha', () => {
    assert.equal(errosI08_140(nfe({}, '5102')).length, 1);
  });

  it('I08-140: devolucao com CFOP 1202 passa; 1949 passa (NT 2026.009)', () => {
    assert.deepEqual(errosI08_140(nfe({}, '1202')), []);
    assert.deepEqual(errosI08_140(nfe({}, '1949')), []);
  });

  it('I08-140: 5949 so passa com NCM do gas natural', () => {
    assert.equal(errosI08_140(nfe({}, '5949')).length, 1);
    const comGas = nfe({}, '5949');
    (comGas.produtos[0] as { ncm: string }).ncm = '27112100';
    assert.deepEqual(errosI08_140(comGas), []);
  });

  it('I08-140: credito 03/06 com CFOP de venda falha; nota normal passa', () => {
    const credito = (motivo: string): NFeProps =>
      nfe({ finalidade: 5, tipoNotaCredito: motivo }, '5102');
    assert.equal(errosI08_140(credito('03')).length, 1);
    assert.equal(errosI08_140(credito('06')).length, 1);
    assert.deepEqual(errosI08_140(nfe({ finalidade: 1 }, '5102')), []);
  });

  it('B25-40: duas refs no cabecalho da devolucao falha (mesmo de tipos distintos); uma passa', () => {
    const duas = nfe({ notasReferenciadas: [{ tipo: 'nfe', chaveAcesso: CHAVE }, { tipo: 'cte', chaveAcesso: CHAVE }] });
    assert.equal(errosB25_40(duas).length, 1);
    const uma = nfe({ notasReferenciadas: [{ tipo: 'nfe', chaveAcesso: CHAVE }] });
    assert.deepEqual(errosB25_40(uma), []);
  });

  it('VC02-14: devolucao sem referencia falha; com refNFe ou item passa', () => {
    assert.equal(errosVC02_14(nfe()).length, 1);
    assert.deepEqual(
      errosVC02_14(nfe({ notasReferenciadas: [{ tipo: 'nfe', chaveAcesso: CHAVE }] })),
      []
    );
    const item = nfe();
    (item.produtos[0] as { dfeReferenciado: object }).dfeReferenciado = { chaveAcesso: CHAVE };
    assert.deepEqual(errosVC02_14(item), []);
  });

  it('VC02-14: embalagem 5921 dispensa referencia; cabecalho+item falha (VC02-05)', () => {
    assert.deepEqual(errosVC02_14(nfe({}, '5921')), []);
    const ambos = nfe({ notasReferenciadas: [{ tipo: 'nfe', chaveAcesso: CHAVE }] }, '1202');
    (ambos.produtos[0] as { dfeReferenciado: object }).dfeReferenciado = { chaveAcesso: CHAVE };
    const msgs = errosVC02_14(ambos);
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('VC02-05'));
  });

  it('errosDevolucao agrega as tres regras', () => {
    assert.deepEqual(errosDevolucao(nfe({ finalidade: 1 }, '5102')), []);
    assert.ok(errosDevolucao(nfe({}, '5102')).length >= 2);
  });
});

describe('Devolucao e CFOP (Fase 5) — schemas Zod', () => {
  it('devolucao valida (1202 + refNFe) passa no nfeSchema', () => {
    const r = nfeSchema.safeParse({
      identificacao: {
        ...identificacaoBase,
        notasReferenciadas: [{ tipo: 'nfe', chaveAcesso: CHAVE }]
      },
      emitente: emitenteBase,
      produtos: [produtoBase('1202')],
      transporte: { modalidadeFrete: 9 },
      pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
    });
    assert.equal(r.success, true);
  });

  it('devolucao com CFOP 5102 falha no nfeSchema (I08-140)', () => {
    const r = nfeSchema.safeParse({
      identificacao: { ...identificacaoBase, notasReferenciadas: [{ tipo: 'nfe', chaveAcesso: CHAVE }] },
      emitente: emitenteBase,
      produtos: [produtoBase('5102')],
      transporte: { modalidadeFrete: 9 },
      pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
    });
    assert.equal(r.success, false);
    if (!r.success) {
      assert.ok(r.error.issues.some((i) => String(i.message).includes('I08-140')));
    }
  });

  it('devolucao sem referencia falha no nfeSchema (VC02-14)', () => {
    const r = nfeSchema.safeParse({
      identificacao: identificacaoBase,
      emitente: emitenteBase,
      produtos: [produtoBase('1202')],
      transporte: { modalidadeFrete: 9 },
      pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
    });
    assert.equal(r.success, false);
    if (!r.success) {
      assert.ok(r.error.issues.some((i) => String(i.message).includes('VC02-14')));
    }
  });

  it('devolucao com duas NF ref falha no nfeSchema (B25-40)', () => {
    const r = nfeSchema.safeParse({
      identificacao: {
        ...identificacaoBase,
        notasReferenciadas: [
          { tipo: 'nfe', chaveAcesso: CHAVE },
          { tipo: 'nfe', chaveAcesso: CHAVE }
        ]
      },
      emitente: emitenteBase,
      produtos: [produtoBase('1202')],
      transporte: { modalidadeFrete: 9 },
      pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
    });
    assert.equal(r.success, false);
    if (!r.success) {
      assert.ok(r.error.issues.some((i) => String(i.message).includes('B25-40')));
    }
  });
});
