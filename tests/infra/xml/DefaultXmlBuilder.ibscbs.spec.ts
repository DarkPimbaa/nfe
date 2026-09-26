import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { XsdSchemaValidator } from '@nfe/infra/schema/XsdSchemaValidator';
import { CertificateData } from '@nfe/contracts/CertificateProvider';
import { NFeProps } from '@nfe/domain/entities/NFe';
import { IBSCBSProps } from '@nfe/domain/entities/IbsCbs';
import { generateTestCertificate } from '../../helpers/generate-test-certificate';

const schemasDir = resolve(__dirname, '..', '..', '..', 'schemas');

function nfeComIbsCbs(ibsCbs: IBSCBSProps): NFeProps {
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
        descricao: 'Produto Teste',
        ncm: '61091000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 2,
        valorUnitario: 50,
        valorTotal: 100,
        icms: { origem: 0, cst: '00', baseCalculo: 100, aliquota: 17, valor: 17 },
        pis: { cst: '01', baseCalculo: 100, aliquota: 1.65, valor: 1.65 },
        cofins: { cst: '01', baseCalculo: 100, aliquota: 7.6, valor: 7.6 },
        ibsCbs
      }
    ],
    transporte: { modalidadeFrete: 9 },
    pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
  };
}

describe('DefaultXmlBuilder — IBS/CBS e regimes da reforma', () => {
  const builder = new DefaultXmlBuilder();
  const validator = new XsdSchemaValidator({ schemasDir });
  const signer = new DefaultXmlSigner();
  let cert: CertificateData;

  function validar(nfe: NFeProps): string {
    const xml = builder.build(nfe);
    const result = validator.validate(signer.sign(xml, cert));

    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);

    return xml;
  }

  before(async () => {
    const { pfx, password } = generateTestCertificate();
    cert = await new A1CertificateProvider(pfx, password).load();
  });

  it('deve manter a API antiga (pIBSUF/pIBSMun/pCBS) funcionando', () => {
    const xml = validar(
      nfeComIbsCbs({ cst: '000', cClassTrib: '000001', pIBSUF: 0.1, pIBSMun: 0.05, pCBS: 0.9 })
    );

    assert.ok(xml.includes('<gIBSUF><pIBSUF>0.1000</pIBSUF><vIBSUF>0.10</vIBSUF></gIBSUF>'));
    assert.ok(xml.includes('<gCBS><pCBS>0.9000</pCBS><vCBS>0.90</vCBS></gCBS>'));
    assert.ok(xml.includes('<vIBS>0.15</vIBS>'));
  });

  it('deve emitir gDif (diferimento) por ente', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '550',
        cClassTrib: '000001',
        ibsUf: { aliquota: 0.1, diferimento: { percentual: 50, valor: 0.05 } },
        ibsMun: { aliquota: 0.05 },
        cbs: { aliquota: 0.9, diferimento: { percentual: 50, valor: 0.45 } }
      })
    );

    assert.ok(xml.includes('<gDif><pDif>50.0000</pDif><vDif>0.05</vDif></gDif>'));
    assert.ok(xml.includes('<gDif><pDif>50.0000</pDif><vDif>0.45</vDif></gDif>'));
    // O diferimento tambem soma no total.
    assert.ok(xml.includes('<vDif>0.05</vDif><vDevTrib>0.00</vDevTrib>'));
  });

  it('deve emitir gRed (reducao de aliquota) e usar a aliquota efetiva no valor', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '200',
        cClassTrib: '000002',
        ibsUf: { aliquota: 1, reducao: { percentualReducao: 60, aliquotaEfetiva: 0.4 } },
        ibsMun: { aliquota: 0 },
        cbs: { aliquota: 0 }
      })
    );

    assert.ok(xml.includes('<gRed><pRedAliq>60.0000</pRedAliq><pAliqEfet>0.4000</pAliqEfet></gRed>'));
    // 100 x 0,4% = 0,40 (aliquota efetiva, nao a cheia).
    assert.ok(xml.includes('<vIBSUF>0.40</vIBSUF>'));
  });

  it('deve emitir gDevTrib', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '000',
        cClassTrib: '000001',
        ibsUf: { aliquota: 0.1, tributoDevolvido: 0.02 },
        ibsMun: { aliquota: 0.05 },
        cbs: { aliquota: 0.9 }
      })
    );

    assert.ok(xml.includes('<gDevTrib><vDevTrib>0.02</vDevTrib></gDevTrib>'));
    assert.ok(xml.includes('<vDevTrib>0.02</vDevTrib><vIBSUF>'));
  });

  it('deve emitir gTribRegular', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '200',
        cClassTrib: '000002',
        ibsUf: { aliquota: 0.1 },
        ibsMun: { aliquota: 0.05 },
        cbs: { aliquota: 0.9 },
        tributacaoRegular: {
          cst: '000',
          cClassTrib: '000001',
          aliquotaEfetivaIbsUf: 0.1,
          valorIbsUf: 0.1,
          aliquotaEfetivaIbsMun: 0.05,
          valorIbsMun: 0.05,
          aliquotaEfetivaCbs: 0.9,
          valorCbs: 0.9
        }
      })
    );

    assert.ok(xml.includes('<gTribRegular><CSTReg>000</CSTReg><cClassTribReg>000001</cClassTribReg>'));
    assert.ok(xml.includes('<pAliqEfetRegCBS>0.9000</pAliqEfetRegCBS><vTribRegCBS>0.90</vTribRegCBS>'));
  });

  it('deve emitir gTribCompraGov', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '000',
        cClassTrib: '000001',
        ibsUf: { aliquota: 0.1 },
        ibsMun: { aliquota: 0.05 },
        cbs: { aliquota: 0.9 },
        tributacaoCompraGov: {
          aliquotaIbsUf: 0.1,
          valorIbsUf: 0.1,
          aliquotaIbsMun: 0.05,
          valorIbsMun: 0.05,
          aliquotaCbs: 0.9,
          valorCbs: 0.9
        }
      })
    );

    assert.ok(xml.includes('<gTribCompraGov><pAliqIBSUF>0.1000</pAliqIBSUF>'));
  });

  it('deve emitir gIBSCBSMono no lugar do gIBSCBS', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '620',
        cClassTrib: '000003',
        monofasia: {
          padrao: {
            quantidade: 100,
            aliquotaIbs: 0.01,
            aliquotaCbs: 0.09,
            valorIbs: 1,
            valorCbs: 9
          },
          diferimento: { percentualIbs: 50, valorIbs: 0.5, percentualCbs: 50, valorCbs: 4.5 },
          totalIbs: 1,
          totalCbs: 9
        }
      })
    );

    assert.ok(xml.includes('<gIBSCBSMono><gMonoPadrao><qBCMono>100.0000</qBCMono>'));
    assert.ok(xml.includes('<gMonoDif><pDifIBS>50.0000</pDifIBS>'));
    assert.ok(xml.includes('<vTotIBSMonoItem>1.00</vTotIBSMonoItem>'));
    assert.ok(!xml.includes('<gIBSCBS>'));
  });

  it('deve emitir gTransfCred', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '000',
        cClassTrib: '000001',
        transferenciaCredito: { valorIbs: 10, valorCbs: 90 }
      })
    );

    assert.ok(xml.includes('<gTransfCred><vIBS>10.00</vIBS><vCBS>90.00</vCBS></gTransfCred>'));
  });

  it('deve emitir gAjusteCompet', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '000',
        cClassTrib: '000001',
        ajusteCompetencia: { competencia: '2026-04', valorIbs: 5, valorCbs: 45 }
      })
    );

    assert.ok(xml.includes('<gAjusteCompet><competApur>2026-04</competApur>'));
  });

  it('deve emitir gEstornoCred', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '000',
        cClassTrib: '000001',
        ibsUf: { aliquota: 0.1 },
        ibsMun: { aliquota: 0.05 },
        cbs: { aliquota: 0.9 },
        estornoCredito: { valorIbs: 1, valorCbs: 9 }
      })
    );

    assert.ok(xml.includes('<gEstornoCred><vIBSEstCred>1.00</vIBSEstCred><vCBSEstCred>9.00</vCBSEstCred></gEstornoCred>'));
  });

  it('deve emitir gCredPresOper com credito sob condicao suspensiva', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '000',
        cClassTrib: '000001',
        ibsUf: { aliquota: 0.1 },
        ibsMun: { aliquota: 0.05 },
        cbs: { aliquota: 0.9 },
        creditoPresumido: {
          baseCalculo: 100,
          codigo: '01',
          ibs: { percentual: 10, valor: 0.02 },
          cbs: { percentual: 10, valorCondicaoSuspensiva: 0.09 }
        }
      })
    );

    assert.ok(xml.includes('<gCredPresOper><vBCCredPres>100.00</vBCCredPres><cCredPres>01</cCredPres>'));
    assert.ok(xml.includes('<gIBSCredPres><pCredPres>10.0000</pCredPres><vCredPres>0.02</vCredPres></gIBSCredPres>'));
    assert.ok(xml.includes('<gCBSCredPres><pCredPres>10.0000</pCredPres><vCredPresCondSus>0.09</vCredPresCondSus></gCBSCredPres>'));
  });

  it('deve emitir gCredPresIBSZFM', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '000',
        cClassTrib: '000001',
        ibsUf: { aliquota: 0.1 },
        ibsMun: { aliquota: 0.05 },
        cbs: { aliquota: 0.9 },
        creditoPresumidoZfm: { competencia: '2026-04', tipo: '1', valor: 5 }
      })
    );

    assert.ok(xml.includes('<gCredPresIBSZFM><competApur>2026-04</competApur><tpCredPresIBSZFM>1</tpCredPresIBSZFM>'));
  });

  it('deve emitir indDoacao', () => {
    const xml = validar(
      nfeComIbsCbs({
        cst: '000',
        cClassTrib: '000001',
        doacao: true,
        ibsUf: { aliquota: 0.1 },
        ibsMun: { aliquota: 0.05 },
        cbs: { aliquota: 0.9 }
      })
    );

    assert.ok(xml.includes('<cClassTrib>000001</cClassTrib><indDoacao>1</indDoacao>'));
  });
});
