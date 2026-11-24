import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import type { NFeProps } from '@nfe/domain/entities/NFe';

function base(produtos: unknown[], totais: Record<string, unknown> = {}): NFeProps {
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
      dataEmissao: new Date('2026-11-24T10:00:00')
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
    produtos: produtos as NFeProps['produtos'],
    transporte: { modalidadeFrete: 9 },
    pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] },
    ...totais
  } as unknown as NFeProps;
}

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

describe('DefaultXmlBuilder — valor liquido (NT 2026.008)', () => {
  const builder = new DefaultXmlBuilder();

  it('emite vUnComLiq e vProdLiq apos o vProd', () => {
    const xml = builder.build(
      base([{ ...produtoBase, valorUnitarioLiquido: 45, valorProdutoLiquido: 90 }])
    );
    assert.ok(xml.includes('<vUnComLiq>45.0000000000</vUnComLiq>'));
    assert.ok(xml.includes('<vProdLiq>90.00</vProdLiq>'));
    assert.ok(xml.indexOf('<vProd>') < xml.indexOf('<vUnComLiq>'));
    assert.ok(xml.indexOf('<vProdLiq>') < xml.indexOf('<cEANTrib>'));
  });

  it('emite vProdLiqTot no total antes do ICMSTot', () => {
    const xml = builder.build(
      base([{ ...produtoBase, valorProdutoLiquido: 90 }], {
        valorProdutoLiquidoTotal: 90
      })
    );
    assert.ok(xml.includes('<vProdLiqTot>90.00</vProdLiqTot>'));
    assert.ok(xml.indexOf('<vProdLiqTot>') < xml.indexOf('<ICMSTot>'));
  });

  it('emite ICMSPrevistoPagtoAntecip no lugar do grupo do CST', () => {
    const xml = builder.build(
      base([
        {
          ...produtoBase,
          icms: { origem: 0, cst: '00', pagamentoAntecipado: { valorPrevisto: 12.5 } }
        }
      ])
    );
    assert.ok(
      xml.includes(
        '<ICMS><ICMSPrevistoPagtoAntecip><vICMSPrevisto>12.50</vICMSPrevisto></ICMSPrevistoPagtoAntecip></ICMS>'
      )
    );
  });

  it('omite os campos novos quando ausentes', () => {
    const xml = builder.build(base([produtoBase]));
    assert.ok(!xml.includes('<vUnComLiq>'));
    assert.ok(!xml.includes('<vProdLiq>'));
    assert.ok(!xml.includes('<vProdLiqTot>'));
    assert.ok(!xml.includes('<ICMSPrevistoPagtoAntecip>'));
  });
});
