import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { XsdSchemaValidator } from '@nfe/infra/schema/XsdSchemaValidator';
import { CertificateData } from '@nfe/contracts/CertificateProvider';
import { NFeProps } from '@nfe/domain/entities/NFe';
import { PagamentoProps } from '@nfe/domain/entities/Pagamento';
import { pagamentoSchema } from '@nfe/domain/schemas/pagamento-schema';
import { generateTestCertificate } from '../../helpers/generate-test-certificate';

const schemasDir = resolve(__dirname, '..', '..', '..', 'schemas');

function nfeComPagamento(pagamento: PagamentoProps, antecipados?: string[]): NFeProps {
  return {
    identificacao: {
      naturezaOperacao: 'Venda de producao do estabelecimento',
      tipoOperacao: 1,
      destinoOperacao: 1,
      finalidade: 1,
      consumidorFinal: 1,
      presencaComprador: 1,
      uf: 'MT',
      municipio: '5103403',
      serie: 1,
      numero: 1,
      dataEmissao: new Date('2026-04-28T10:00:00'),
      pagamentosAntecipados: antecipados
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
      cpf: '52998224725',
      nome: 'Raphael Serafim',
      indicadorIE: 9,
      endereco: {
        logradouro: 'Av. do CPA',
        numero: '500',
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
        descricao: 'Camiseta Algodao P',
        ncm: '61091000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 2,
        valorUnitario: 50,
        valorTotal: 100,
        icms: { origem: 0, cst: '00', baseCalculo: 100, aliquota: 17, valor: 17 },
        pis: { cst: '01', baseCalculo: 100, aliquota: 1.65, valor: 1.65 },
        cofins: { cst: '01', baseCalculo: 100, aliquota: 7.6, valor: 7.6 }
      }
    ],
    transporte: { modalidadeFrete: 9 },
    pagamento
  };
}

describe('DefaultXmlBuilder — pagamento (split payment)', () => {
  const builder = new DefaultXmlBuilder();
  const validator = new XsdSchemaValidator({ schemasDir });
  const signer = new DefaultXmlSigner();
  let cert: CertificateData;

  function validar(xml: string): void {
    const result = validator.validate(signer.sign(xml, cert));
    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  }

  before(async () => {
    const { pfx, password } = generateTestCertificate();
    cert = await new A1CertificateProvider(pfx, password).load();
  });

  it('deve emitir detPag na ordem do leiaute com os campos do split', () => {
    const xml = builder.build(
      nfeComPagamento({
        pagamentos: [
          {
            indicadorPagamento: 0,
            formaPagamento: '03',
            valor: 100,
            dataPagamento: new Date('2026-04-28T10:00:00'),
            cnpjPagador: '11222333000181',
            ufPagador: 'MT',
            tipoIntegracao: 1,
            cnpjCredenciadora: '99888777000166',
            bandeira: '01',
            autorizacao: 'A12345',
            cnpjRecebedor: '44555666000177',
            idTerminalPagamento: 'POS-0001'
          }
        ]
      })
    );

    assert.ok(
      xml.includes(
        '<detPag><indPag>0</indPag><tPag>03</tPag><vPag>100.00</vPag>' +
          '<dPag>2026-04-28</dPag><CNPJPag>11222333000181</CNPJPag><UFPag>MT</UFPag>'
      )
    );
    assert.ok(
      xml.includes(
        '<card><tpIntegra>1</tpIntegra><CNPJ>99888777000166</CNPJ><tBand>01</tBand>' +
          '<cAut>A12345</cAut><CNPJReceb>44555666000177</CNPJReceb>' +
          '<idTermPag>POS-0001</idTermPag></card>'
      )
    );
    validar(xml);
  });

  it('deve emitir xPag na descricao de outros meios de pagamento', () => {
    const xml = builder.build(
      nfeComPagamento({
        pagamentos: [{ formaPagamento: '99', valor: 100, descricao: 'Permuta de mercadorias' }]
      })
    );

    assert.ok(xml.includes('<tPag>99</tPag><xPag>Permuta de mercadorias</xPag><vPag>100.00</vPag>'));
    validar(xml);
  });

  it('deve omitir CNPJPag e UFPag quando so um dos dois vem preenchido', () => {
    const xml = builder.build(
      nfeComPagamento({
        pagamentos: [{ formaPagamento: '01', valor: 100, cnpjPagador: '11222333000181' }]
      })
    );

    assert.ok(!xml.includes('<CNPJPag>'));
    assert.ok(!xml.includes('<UFPag>'));
    validar(xml);
  });

  it('deve rejeitar no schema Zod quando CNPJPag vem sem UFPag', () => {
    const result = pagamentoSchema.safeParse({
      pagamentos: [{ formaPagamento: '01', valor: 100, cnpjPagador: '11222333000181' }]
    });

    assert.equal(result.success, false);
  });

  it('deve emitir gPagAntecipado com as chaves referenciadas', () => {
    const chave = '51260411222333000181550010000000011000000015';
    const xml = builder.build(
      nfeComPagamento({ pagamentos: [{ formaPagamento: '01', valor: 100 }] }, [chave])
    );

    assert.ok(xml.includes(`<gPagAntecipado><refNFe>${chave}</refNFe></gPagAntecipado>`));
    assert.ok(xml.indexOf('<gPagAntecipado>') < xml.indexOf('</ide>'));
    validar(xml);
  });

  it('deve manter compatibilidade com pagamento simples', () => {
    const xml = builder.build(
      nfeComPagamento({ pagamentos: [{ formaPagamento: '01', valor: 100 }], troco: 5 })
    );

    assert.ok(xml.includes('<detPag><tPag>01</tPag><vPag>100.00</vPag></detPag>'));
    assert.ok(xml.includes('<vTroco>5.00</vTroco>'));
    validar(xml);
  });
});
