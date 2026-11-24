import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nfeSchema } from '@nfe/domain/schemas/nfe-schema';
import { errosNFCe } from '@nfe/domain/nfce-regras';
import type { NFeProps } from '@nfe/domain/entities/NFe';

const CHAVE = '51240412345678000195550010000000011234567890';

function produtoBase(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    numero: 1,
    codigo: 'PROD001',
    descricao: 'Refrigerante',
    ncm: '22021000',
    cfop: '5102',
    unidade: 'UN',
    quantidade: 1,
    valorUnitario: 10,
    valorTotal: 10,
    icms: { origem: 0, cst: '00', baseCalculo: 10, aliquota: 17, valor: 1.7 },
    pis: { cst: '01', baseCalculo: 10, aliquota: 1.65, valor: 0.17 },
    cofins: { cst: '01', baseCalculo: 10, aliquota: 7.6, valor: 0.76 },
    ...extra
  };
}

function nfce(extraId: Record<string, unknown> = {}, produtos: unknown[] = [produtoBase()]): NFeProps {
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
      modelo: '65',
      ...extraId
    },
    emitente: {
      cnpj: '11222333000181',
      razaoSocial: 'Loja Varejo Ltda',
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
    produtos,
    transporte: { modalidadeFrete: 9 },
    pagamento: { pagamentos: [{ formaPagamento: '01', valor: 10 }] }
  } as unknown as NFeProps;
}

describe('Vedacoes da NFC-e (Fase 6) — regras puras', () => {
  it('NFC-e presencial valida passa', () => {
    assert.deepEqual(errosNFCe(nfce()), []);
  });

  it('NF-e (modelo 55) nao e afetada', () => {
    const nfe = nfce();
    (nfe.identificacao as { modelo?: string }).modelo = '55';
    assert.deepEqual(errosNFCe(nfe), []);
  });

  it('DFeReferenciado no item falha (VC02-04, Rej. 708)', () => {
    const n = nfce({}, [produtoBase({ dfeReferenciado: { chaveAcesso: CHAVE } })]);
    const msgs = errosNFCe(n);
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('708'));
  });

  it('dPrevEntrega falha (Rej. 1153)', () => {
    const msgs = errosNFCe(nfce({ dataPrevistaEntrega: new Date('2026-12-01T10:00:00') }));
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('1153'));
  });

  it('tpCredPresIBSZFM falha (Rej. 1165)', () => {
    const n = nfce({}, [produtoBase({ tipoCreditoPresumidoIbsZfm: '01' })]);
    assert.ok(errosNFCe(n).some((m) => m.includes('1165')));
  });

  it('gDevTrib da CBS falha (UB62-10, Rej. 1187); do IBS passa', () => {
    const cbs = {
      cst: '000',
      cClassTrib: '000001',
      ibsUf: { aliquota: 0.1 },
      ibsMun: { aliquota: 0 },
      cbs: { aliquota: 0.9, tributoDevolvido: 0.5 }
    };
    assert.ok(errosNFCe(nfce({}, [produtoBase({ ibsCbs: cbs })])).some((m) => m.includes('1187')));
    const ibs = {
      cst: '000',
      cClassTrib: '000001',
      ibsUf: { aliquota: 0.1, tributoDevolvido: 0.1 },
      ibsMun: { aliquota: 0 },
      cbs: { aliquota: 0.9 }
    };
    assert.deepEqual(errosNFCe(nfce({}, [produtoBase({ ibsCbs: ibs })])), []);
  });

  it('pagamento antecipado referenciado falha (Rej. 1146)', () => {
    const msgs = errosNFCe(nfce({ pagamentosAntecipados: [CHAVE] }));
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('1146'));
  });

  it('credito presumido falha (Rej. 1049)', () => {
    const cbs = {
      cst: '200',
      cClassTrib: '200001',
      ibsUf: { aliquota: 0.1 },
      ibsMun: { aliquota: 0 },
      cbs: { aliquota: 0.9 },
      creditoPresumido: { baseCalculo: 100, codigo: '01', cbs: { percentual: 5, valor: 1 } }
    };
    assert.ok(errosNFCe(nfce({}, [produtoBase({ ibsCbs: cbs })])).some((m) => m.includes('1049')));
  });

  it('indPres fora de 1/4/5 falha (B25b-20, Rej. 717)', () => {
    for (const indPres of [0, 2, 3, 9]) {
      const msgs = errosNFCe(nfce({ presencaComprador: indPres }));
      assert.equal(msgs.length, 1, `indPres ${indPres}`);
      assert.ok(msgs[0].includes('717'));
    }
    for (const indPres of [1, 4, 5]) {
      assert.deepEqual(errosNFCe(nfce({ presencaComprador: indPres })), [], `indPres ${indPres}`);
    }
  });
});

describe('Vedacoes da NFC-e (Fase 6) — schemas Zod', () => {
  it('NFC-e valida passa no nfeSchema', () => {
    assert.equal(nfeSchema.safeParse(nfce()).success, true);
  });

  it('NFC-e com DFeReferenciado falha no nfeSchema', () => {
    const r = nfeSchema.safeParse(
      nfce({}, [produtoBase({ dfeReferenciado: { chaveAcesso: CHAVE } })])
    );
    assert.equal(r.success, false);
    if (!r.success) {
      assert.ok(r.error.issues.some((i) => String(i.message).includes('708')));
    }
  });
});
