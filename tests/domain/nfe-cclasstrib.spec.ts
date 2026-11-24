import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nfeSchema } from '@nfe/domain/schemas/nfe-schema';
import {
  CST_IBS_CBS,
  infoCClassTrib,
  isCstIbsCbs,
  errosCClassTrib
} from '@nfe/domain/cclasstrib';
import type { NFeProps } from '@nfe/domain/entities/NFe';

function itemIbs(cst: string, cClassTrib: string): Record<string, unknown> {
  return {
    numero: 1,
    codigo: 'PROD001',
    descricao: 'Camiseta',
    ncm: '61091000',
    cfop: '5102',
    unidade: 'UN',
    quantidade: 1,
    valorUnitario: 100,
    valorTotal: 100,
    icms: { origem: 0, cst: '00', baseCalculo: 100, aliquota: 17, valor: 17 },
    pis: { cst: '01', baseCalculo: 100, aliquota: 1.65, valor: 1.65 },
    cofins: { cst: '01', baseCalculo: 100, aliquota: 7.6, valor: 7.6 },
    ibsCbs: { cst, cClassTrib, ibsUf: { aliquota: 0.1 }, ibsMun: { aliquota: 0 }, cbs: { aliquota: 0.9 } }
  };
}

function nfeDe(itens: unknown[], modelo: '55' | '65' = '55'): NFeProps {
  return {
    identificacao: {
      naturezaOperacao: 'Venda',
      tipoOperacao: 1,
      destinoOperacao: 1,
      finalidade: 1,
      consumidorFinal: 1,
      presencaComprador: 1,
      uf: 'MT',
      municipio: '5103403',
      serie: 1,
      numero: 1,
      modelo
    },
    emitente: {
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
    },
    produtos: itens,
    transporte: { modalidadeFrete: 9 },
    pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
  } as unknown as NFeProps;
}

describe('cClassTrib x CST x modelo (Fase 4) — tabela e regras', () => {
  it('tem os 18 CSTs oficiais', () => {
    assert.equal(CST_IBS_CBS.size, 18);
    for (const cst of ['000', '010', '011', '200', '220', '221', '222', '400', '410', '510', '515', '550', '620', '800', '810', '811', '820', '830']) {
      assert.ok(isCstIbsCbs(cst), cst);
    }
    assert.equal(isCstIbsCbs('00'), false);
    assert.equal(isCstIbsCbs('999'), false);
  });

  it('conhece 173 codigos, com 220 fora de vigencia e 410 renomeado', () => {
    assert.ok(infoCClassTrib('000001')?.vigente);
    assert.equal(infoCClassTrib('220001')?.vigente, false);
    assert.equal(infoCClassTrib('999999'), undefined);
  });

  it('item valido (000/000001, NF-e) passa', () => {
    assert.deepEqual(errosCClassTrib(nfeDe([itemIbs('000', '000001')])), []);
  });

  it('CST desconhecido falha', () => {
    const msgs = errosCClassTrib(nfeDe([itemIbs('999', '999999')]));
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('18 CSTs'));
  });

  it('codigo inexistente falha (UB14-10, Rej. 1023)', () => {
    const msgs = errosCClassTrib(nfeDe([itemIbs('200', '200999')]));
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('1023'));
  });

  it('codigo fora de vigencia falha (220001)', () => {
    const msgs = errosCClassTrib(nfeDe([itemIbs('220', '220001')]));
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('fora de vigencia'));
  });

  it('prefixo divergente falha (UB14-20, Rej. 1024)', () => {
    const msgs = errosCClassTrib(nfeDe([itemIbs('200', '000001')]));
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('1024'));
  });

  it('codigo vedado na NFC-e falha (UB14-25, Rej. 1025)', () => {
    const msgs = errosCClassTrib(nfeDe([itemIbs('000', '000003')], '65'));
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('1025'));
  });

  it('codigo vedado na NF-e falha (010001)', () => {
    const msgs = errosCClassTrib(nfeDe([itemIbs('010', '010001')]));
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('1025'));
  });
});

describe('cClassTrib x CST x modelo (Fase 4) — schemas Zod', () => {
  it('rejeita cst/cClassTrib fora do tamanho do XSD', () => {
    const r = nfeSchema.safeParse(nfeDe([itemIbs('00', '00001')]));
    assert.equal(r.success, false);
  });

  it('rejeita par incompativel no nfeSchema (UB14-20)', () => {
    const r = nfeSchema.safeParse(nfeDe([itemIbs('200', '000001')]));
    assert.equal(r.success, false);
    if (!r.success) {
      assert.ok(r.error.issues.some((i) => String(i.message).includes('1024')));
    }
  });
});
