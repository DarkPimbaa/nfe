import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { XsdSchemaValidator } from '@nfe/infra/schema/XsdSchemaValidator';
import { CertificateData } from '@nfe/contracts/CertificateProvider';
import { NFeProps } from '@nfe/domain/entities/NFe';
import { nfeSchema } from '@nfe/domain/schemas/nfe-schema';
import { FORMA_PAGAMENTO } from '@nfe/shared/constants/cst';
import { generateTestCertificate } from '../../helpers/generate-test-certificate';

const schemasDir = resolve(__dirname, '..', '..', '..', 'schemas');

/**
 * Venda a prazo de R$ 900,00 em boleto, parcelada em 3x de R$ 300,00.
 *
 * No leiaute, a forma de pagamento e o parcelamento vivem em blocos diferentes:
 * `pag/detPag` diz COMO se paga (boleto, a prazo) e `cobr/dup` diz QUANDO cada
 * parcela vence.
 */
function vendaComBoletoParcelado(): NFeProps {
  return {
    identificacao: {
      naturezaOperacao: 'Venda de mercadoria',
      tipoOperacao: 1,
      destinoOperacao: 1,
      finalidade: 1,
      consumidorFinal: 0,
      presencaComprador: 1,
      uf: 'MT',
      municipio: '5103403',
      serie: 1,
      numero: 1,
      dataEmissao: new Date('2026-04-28T10:00:00')
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
    destinatario: {
      cnpj: '99888777000166',
      nome: 'Cliente Atacado Ltda',
      indicadorIE: 1,
      inscricaoEstadual: '133333333',
      endereco: {
        logradouro: 'Av. Comercial',
        numero: '900',
        bairro: 'Centro',
        codigoMunicipio: '5103403',
        municipio: 'Cuiaba',
        uf: 'MT',
        cep: '78050970'
      }
    },
    produtos: [
      {
        numero: 1,
        codigo: 'PROD001',
        descricao: 'Mercadoria para revenda',
        ncm: '61091000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 3,
        valorUnitario: 300,
        valorTotal: 900,
        icms: { origem: 0, cst: '00', baseCalculo: 900, aliquota: 17, valor: 153 },
        pis: { cst: '01', baseCalculo: 900, aliquota: 1.65, valor: 14.85 },
        cofins: { cst: '01', baseCalculo: 900, aliquota: 7.6, valor: 68.4 }
      }
    ],
    transporte: { modalidadeFrete: 9 },
    // COMO se paga: boleto (tPag 15), a prazo (indPag 1).
    pagamento: {
      pagamentos: [{ indicadorPagamento: 1, formaPagamento: '15', valor: 900 }]
    },
    // QUANDO se paga: a fatura e as 3 parcelas.
    cobranca: {
      fatura: { nFat: 'FAT-2026-001', vOrig: 900, vDesc: 0, vLiq: 900 },
      duplicatas: [
        { nDup: '001', dVenc: '2026-05-28', vDup: 300 },
        { nDup: '002', dVenc: '2026-06-28', vDup: 300 },
        { nDup: '003', dVenc: '2026-07-28', vDup: 300 }
      ]
    }
  };
}

describe('Pagamento em boleto com parcelas', () => {
  const builder = new DefaultXmlBuilder();
  const validator = new XsdSchemaValidator({ schemasDir });
  const signer = new DefaultXmlSigner();
  let cert: CertificateData;

  before(async () => {
    const { pfx, password } = generateTestCertificate();
    cert = await new A1CertificateProvider(pfx, password).load();
  });

  it('deve gerar XML valido no XSD com boleto e 3 duplicatas', () => {
    const xml = builder.build(vendaComBoletoParcelado());
    const result = validator.validate(signer.sign(xml, cert));

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  });

  it('deve marcar a forma de pagamento como boleto a prazo', () => {
    const xml = builder.build(vendaComBoletoParcelado());

    assert.ok(
      xml.includes('<detPag><indPag>1</indPag><tPag>15</tPag><vPag>900.00</vPag></detPag>')
    );
    assert.equal(FORMA_PAGAMENTO['15'], 'Boleto bancario');
  });

  it('deve emitir a fatura e as parcelas no bloco cobr', () => {
    const xml = builder.build(vendaComBoletoParcelado());

    assert.ok(
      xml.includes('<fat><nFat>FAT-2026-001</nFat><vOrig>900.00</vOrig><vDesc>0.00</vDesc><vLiq>900.00</vLiq></fat>')
    );
    assert.ok(xml.includes('<dup><nDup>001</nDup><dVenc>2026-05-28</dVenc><vDup>300.00</vDup></dup>'));
    assert.ok(xml.includes('<dup><nDup>002</nDup><dVenc>2026-06-28</dVenc><vDup>300.00</vDup></dup>'));
    assert.ok(xml.includes('<dup><nDup>003</nDup><dVenc>2026-07-28</dVenc><vDup>300.00</vDup></dup>'));
    // cobr vem antes de pag na sequencia do leiaute.
    assert.ok(xml.indexOf('<cobr>') < xml.indexOf('<pag>'));
  });

  it('deve aceitar ate 120 parcelas', () => {
    const nfe = vendaComBoletoParcelado();
    const duplicatas = Array.from({ length: 120 }, (_, i) => ({
      nDup: String(i + 1).padStart(3, '0'),
      dVenc: '2026-05-28',
      vDup: 7.5
    }));

    const xml = builder.build({ ...nfe, cobranca: { ...nfe.cobranca, duplicatas } });
    const result = validator.validate(signer.sign(xml, cert));

    assert.deepEqual(result.errors, []);
    assert.equal(xml.split('<dup>').length - 1, 120);
  });

  it('deve rejeitar mais de 120 parcelas no schema Zod', () => {
    const nfe = vendaComBoletoParcelado();
    const duplicatas = Array.from({ length: 121 }, () => ({
      nDup: '001',
      dVenc: '2026-05-28',
      vDup: 1
    }));

    const result = nfeSchema.safeParse({ ...nfe, cobranca: { duplicatas } });

    assert.equal(result.success, false);
  });

  it('deve aceitar pagamento misto: entrada em PIX e o resto em boleto', () => {
    const nfe = vendaComBoletoParcelado();
    const xml = builder.build({
      ...nfe,
      pagamento: {
        pagamentos: [
          { indicadorPagamento: 0, formaPagamento: '17', valor: 300 },
          { indicadorPagamento: 1, formaPagamento: '15', valor: 600 }
        ]
      },
      cobranca: {
        fatura: { nFat: 'FAT-2026-002', vOrig: 900, vDesc: 0, vLiq: 900 },
        duplicatas: [
          { nDup: '001', dVenc: '2026-05-28', vDup: 300 },
          { nDup: '002', dVenc: '2026-06-28', vDup: 300 }
        ]
      }
    });

    const result = validator.validate(signer.sign(xml, cert));

    assert.deepEqual(result.errors, []);
    assert.equal(xml.split('<detPag>').length - 1, 2);
    assert.ok(xml.includes('<tPag>17</tPag><vPag>300.00</vPag>'));
    assert.ok(xml.includes('<tPag>15</tPag><vPag>600.00</vPag>'));
  });
});
