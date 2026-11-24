import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import type { NFeProps } from '@nfe/domain/entities/NFe';

function base(identificacao: Record<string, unknown>, produtos: unknown[]): NFeProps {
  return {
    identificacao: {
      naturezaOperacao: 'Multa e juros',
      tipoOperacao: 1,
      destinoOperacao: 1,
      finalidade: 1,
      consumidorFinal: 1,
      presencaComprador: 1,
      uf: 'MT',
      municipio: '5103403',
      serie: 1,
      numero: 1,
      ...identificacao
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
    pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
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

const CHAVE = '51240412345678000195550010000000011234567890';

describe('DefaultXmlBuilder — nota de credito/debito (finNFe 5/6)', () => {
  const builder = new DefaultXmlBuilder();

  it('emite tpNFCredito para finNFe 5', () => {
    const xml = builder.build(
      base({ finalidade: 5, tipoNotaCredito: '03' }, [produtoBase])
    );
    assert.ok(xml.includes('<finNFe>5</finNFe>'));
    assert.ok(xml.includes('<tpNFCredito>03</tpNFCredito>'));
  });

  it('emite tpNFDebito para finNFe 6', () => {
    const xml = builder.build(
      base({ finalidade: 6, tipoNotaDebito: '04' }, [produtoBase])
    );
    assert.ok(xml.includes('<finNFe>6</finNFe>'));
    assert.ok(xml.includes('<tpNFDebito>04</tpNFDebito>'));
  });

  it('emite DFeReferenciado no item com chave e nItem', () => {
    const xml = builder.build(
      base({ finalidade: 5, tipoNotaCredito: '06' }, [
        { ...produtoBase, dfeReferenciado: { chaveAcesso: CHAVE, numeroItem: 2 } }
      ])
    );
    assert.ok(xml.includes(`<chaveAcesso>${CHAVE}</chaveAcesso>`));
    assert.ok(xml.includes('<nItem>2</nItem>'));
  });

  it('nao emite tpNFCredito/tpNFDebito na nota normal', () => {
    const xml = builder.build(base({ finalidade: 1 }, [produtoBase]));
    assert.ok(!xml.includes('<tpNFCredito>'));
    assert.ok(!xml.includes('<tpNFDebito>'));
  });
});
