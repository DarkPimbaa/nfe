import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularVItem,
  calcularVNFTot,
  validarTotais
} from '@nfe/infra/xml/builders/total-groups';
import type { ProdutoProps } from '@nfe/domain/entities/Produto';
import type { NFeProps } from '@nfe/domain/entities/NFe';

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
  cofins: { cst: '01', baseCalculo: 100, aliquota: 7.6, valor: 7.6 },
  ibsCbs: {
    cst: '000',
    cClassTrib: '000001',
    ibsUf: { aliquota: 0.1 },
    ibsMun: { aliquota: 0 },
    cbs: { aliquota: 0.9 }
  },
  impostoSeletivo: {
    cst: '001',
    cClassTrib: '000001',
    baseCalculo: 100,
    aliquota: 5,
    unidadeTributavel: 'UN',
    quantidadeTributavel: 2,
    valor: 5
  }
} as unknown as ProdutoProps;

function nfeDe(produtos: unknown[], ano = 2026): NFeProps {
  return {
    identificacao: { dataEmissao: new Date(`${ano}-06-01T10:00:00`) },
    produtos
  } as unknown as NFeProps;
}

describe('Totais do valor liquido (NT 2026.008)', () => {
  it('calcularVItem em 2026 exclui IBS/CBS/IS (Excecao 1)', () => {
    assert.equal(calcularVItem(produtoBase, 2026), 100);
  });

  it('calcularVItem em 2027 soma IBS/CBS/IS', () => {
    // 100 + 0.10 (IBS UF) + 0 (IBS Mun) + 0.90 (CBS) + 5 (IS) = 106
    assert.equal(calcularVItem(produtoBase, 2027), 106);
  });

  it('calcularVItem em importacao (CFOP 3xxx) nunca soma a reforma (Excecao 2)', () => {
    const imp = { ...produtoBase, cfop: '3102' } as unknown as ProdutoProps;
    assert.equal(calcularVItem(imp, 2027), 100);
  });

  it('calcularVNFTot soma os vItem', () => {
    const nfe = nfeDe([produtoBase, { ...produtoBase, numero: 2 }], 2027);
    assert.equal(calcularVNFTot(nfe), 212);
  });

  it('validarTotais retorna vazio quando tudo fecha', () => {
    const nfe = nfeDe(
      [
        {
          ...produtoBase,
          valorItem: 106,
          valorUnitarioLiquido: 50,
          valorProdutoLiquido: 100
        }
      ],
      2027
    );
    (nfe as { valorTotalNota?: number }).valorTotalNota = 106;
    (nfe as { valorProdutoLiquidoTotal?: number }).valorProdutoLiquidoTotal = 100;
    assert.deepEqual(validarTotais(nfe), []);
  });

  it('validarTotais aponta vItem divergente (VB01-10)', () => {
    const nfe = nfeDe([{ ...produtoBase, valorItem: 999 }], 2027);
    const msgs = validarTotais(nfe);
    assert.equal(msgs.length, 1);
    assert.ok(msgs[0].includes('VB01-10'));
  });

  it('validarTotais aponta vProdLiq inconsistente (I11c-20)', () => {
    const nfe = nfeDe(
      [{ ...produtoBase, valorUnitarioLiquido: 50, valorProdutoLiquido: 999 }],
      2027
    );
    const msgs = validarTotais(nfe);
    assert.ok(msgs.some((m) => m.includes('I11c-20')));
  });

  it('validarTotais aponta vProdLiqTot inconsistente (W01a)', () => {
    const nfe = nfeDe([{ ...produtoBase, valorProdutoLiquido: 100 }], 2027);
    (nfe as { valorProdutoLiquidoTotal?: number }).valorProdutoLiquidoTotal = 50;
    const msgs = validarTotais(nfe);
    assert.ok(msgs.some((m) => m.includes('W01a')));
  });

  it('validarTotais aponta vNFTot inconsistente', () => {
    const nfe = nfeDe([produtoBase], 2027);
    (nfe as { valorTotalNota?: number }).valorTotalNota = 1;
    const msgs = validarTotais(nfe);
    assert.ok(msgs.some((m) => m.includes('vNFTot')));
  });
});
