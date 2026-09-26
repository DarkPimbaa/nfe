import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { DefaultXmlBuilder } from '@nfe/infra/xml/DefaultXmlBuilder';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { XsdSchemaValidator } from '@nfe/infra/schema/XsdSchemaValidator';
import { CertificateData } from '@nfe/contracts/CertificateProvider';
import { NFeProps } from '@nfe/domain/entities/NFe';
import { ProdutoProps } from '@nfe/domain/entities/Produto';
import { generateTestCertificate } from '../../helpers/generate-test-certificate';

const schemasDir = resolve(__dirname, '..', '..', '..', 'schemas');

const produtoBase: ProdutoProps = {
  numero: 1,
  codigo: 'PROD001',
  descricao: 'Camiseta Algodao P',
  ncm: '61091000',
  cfop: '6102',
  unidade: 'UN',
  quantidade: 2,
  valorUnitario: 50,
  valorTotal: 100,
  icms: { origem: 0, cst: '00', baseCalculo: 100, aliquota: 17, valor: 17 },
  pis: { cst: '01', baseCalculo: 100, aliquota: 1.65, valor: 1.65 },
  cofins: { cst: '01', baseCalculo: 100, aliquota: 7.6, valor: 7.6 }
};

function nfeCom(overrides: Partial<NFeProps>, produto?: ProdutoProps): NFeProps {
  return {
    identificacao: {
      naturezaOperacao: 'Venda de producao do estabelecimento',
      tipoOperacao: 1,
      destinoOperacao: 2,
      finalidade: 1,
      consumidorFinal: 1,
      presencaComprador: 1,
      uf: 'MT',
      municipio: '5103403',
      serie: 1,
      numero: 1,
      dataEmissao: new Date('2026-04-28T10:00:00'),
      ...overrides.identificacao
    },
    emitente: {
      cnpj: '11222333000181',
      razaoSocial: 'Empresa Teste Ltda',
      nomeFantasia: 'Empresa Teste',
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
        logradouro: 'Av. Paulista',
        numero: '500',
        bairro: 'Bela Vista',
        codigoMunicipio: '3550308',
        municipio: 'Sao Paulo',
        uf: 'SP',
        cep: '01310000'
      }
    },
    produtos: [produto ?? produtoBase],
    transporte: { modalidadeFrete: 9 },
    pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] },
    ...overrides
  };
}

describe('DefaultXmlBuilder — grupos novos', () => {
  const builder = new DefaultXmlBuilder();
  const validator = new XsdSchemaValidator({ schemasDir });
  const signer = new DefaultXmlSigner();
  let cert: CertificateData;

  /** Assina e valida contra o XSD oficial da NFe. */
  function validar(xml: string): void {
    const result = validator.validate(signer.sign(xml, cert));
    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
  }

  before(async () => {
    const { pfx, password } = generateTestCertificate();
    cert = await new A1CertificateProvider(pfx, password).load();
  });

  describe('NFref — documentos referenciados', () => {
    it('deve emitir refNFe no fim do ide', () => {
      const chave = '51260411222333000181550010000000011000000015';
      const xml = builder.build(
        nfeCom({
          identificacao: {
            ...nfeCom({}).identificacao,
            finalidade: 4,
            notasReferenciadas: [{ tipo: 'nfe', chaveAcesso: chave }]
          }
        })
      );

      assert.ok(xml.includes(`<NFref><refNFe>${chave}</refNFe></NFref>`));
      assert.ok(xml.indexOf('<NFref>') > xml.indexOf('<verProc>'));
      assert.ok(xml.indexOf('<NFref>') < xml.indexOf('</ide>'));
      validar(xml);
    });

    it('deve emitir refNF de nota em papel com cUF numerico', () => {
      const xml = builder.build(
        nfeCom({
          identificacao: {
            ...nfeCom({}).identificacao,
            notasReferenciadas: [
              {
                tipo: 'nf',
                uf: 'MT',
                anoMes: '2604',
                cnpj: '11222333000181',
                modelo: '01',
                serie: 1,
                numero: 55
              }
            ]
          }
        })
      );

      assert.ok(xml.includes('<refNF><cUF>51</cUF><AAMM>2604</AAMM>'));
      validar(xml);
    });

    it('deve emitir refECF e refCTe', () => {
      const xml = builder.build(
        nfeCom({
          identificacao: {
            ...nfeCom({}).identificacao,
            notasReferenciadas: [
              { tipo: 'cte', chaveAcesso: '51260411222333000181570010000000011000000012' },
              { tipo: 'ecf', modelo: '2B', numeroEcf: '001', numeroContadorOrdem: '123456' }
            ]
          }
        })
      );

      assert.ok(xml.includes('<refCTe>'));
      assert.ok(xml.includes('<refECF><mod>2B</mod><nECF>001</nECF><nCOO>123456</nCOO></refECF>'));
      validar(xml);
    });
  });

  describe('autXML — autorizados a baixar o XML', () => {
    it('deve emitir autXML com CNPJ e CPF depois do dest', () => {
      const xml = builder.build(
        nfeCom({ autorizadosXml: [{ cnpj: '11222333000181' }, { cpf: '52998224725' }] })
      );

      assert.ok(xml.includes('<autXML><CNPJ>11222333000181</CNPJ></autXML>'));
      assert.ok(xml.includes('<autXML><CPF>52998224725</CPF></autXML>'));
      assert.ok(xml.indexOf('<autXML>') > xml.indexOf('</dest>'));
      assert.ok(xml.indexOf('<autXML>') < xml.indexOf('<det '));
      validar(xml);
    });

    it('deve limitar a 10 autorizados', () => {
      const autorizados = Array.from({ length: 15 }, () => ({ cnpj: '11222333000181' }));
      const xml = builder.build(nfeCom({ autorizadosXml: autorizados }));

      assert.equal(xml.split('<autXML>').length - 1, 10);
      validar(xml);
    });
  });

  describe('infRespTec — responsavel tecnico', () => {
    it('deve emitir infRespTec no fim do infNFe', () => {
      const xml = builder.build(
        nfeCom({
          responsavelTecnico: {
            cnpj: '11222333000181',
            contato: 'Raphael Serafim',
            email: 'suporte@empresa.com.br',
            telefone: '6533334444'
          }
        })
      );

      assert.ok(xml.includes('<infRespTec><CNPJ>11222333000181</CNPJ>'));
      assert.ok(xml.includes('<xContato>Raphael Serafim</xContato>'));
      assert.ok(xml.indexOf('<infRespTec>') > xml.indexOf('</pag>'));
      assert.ok(!xml.includes('<hashCSRT>'));
      validar(xml);
    });

    it('deve calcular hashCSRT como SHA-1 de CSRT + chave, em base64', () => {
      const xml = builder.build(
        nfeCom({
          responsavelTecnico: {
            cnpj: '11222333000181',
            contato: 'Raphael Serafim',
            email: 'suporte@empresa.com.br',
            telefone: '6533334444',
            idCSRT: '01',
            csrt: 'G8063VRTNDMPM4TG4B8ZI4GZ5XY8CQ'
          }
        })
      );

      const chave = xml.match(/Id="NFe(\d{44})"/)?.[1];
      assert.ok(chave);

      const esperado = createHash('sha1')
        .update('G8063VRTNDMPM4TG4B8ZI4GZ5XY8CQ' + chave, 'utf8')
        .digest('base64');

      assert.ok(xml.includes(`<idCSRT>01</idCSRT><hashCSRT>${esperado}</hashCSRT>`));
      validar(xml);
    });
  });

  describe('ICMSUFDest — DIFAL da EC 87/2015', () => {
    it('deve calcular o diferencial e mandar 100% para o destino', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icmsUfDest: { aliquotaInterna: 18, aliquotaInterestadual: 12 }
          }
        )
      );

      // (100 x 18%) - (100 x 12%) = 6.00, tudo para a UF de destino.
      assert.ok(xml.includes('<vBCUFDest>100.00</vBCUFDest>'));
      assert.ok(xml.includes('<pICMSInterPart>100.0000</pICMSInterPart>'));
      assert.ok(xml.includes('<vICMSUFDest>6.00</vICMSUFDest>'));
      assert.ok(xml.includes('<vICMSUFRemet>0.00</vICMSUFRemet>'));
      validar(xml);
    });

    it('deve repartir entre destino e remetente quando a partilha nao e 100', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icmsUfDest: {
              aliquotaInterna: 18,
              aliquotaInterestadual: 12,
              percentualPartilha: 60
            }
          }
        )
      );

      assert.ok(xml.includes('<vICMSUFDest>3.60</vICMSUFDest>'));
      assert.ok(xml.includes('<vICMSUFRemet>2.40</vICMSUFRemet>'));
      validar(xml);
    });

    it('deve emitir o FCP da UF de destino e somar nos totais', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icmsUfDest: { aliquotaInterna: 18, aliquotaInterestadual: 12, aliquotaFcp: 2 }
          }
        )
      );

      assert.ok(xml.includes('<vFCPUFDest>2.00</vFCPUFDest>'));
      assert.ok(xml.includes('<vFCPUFDest>2.00</vFCPUFDest><vICMSUFDest>6.00</vICMSUFDest>'));
      validar(xml);
    });

    it('deve sair depois do COFINS dentro do imposto', () => {
      const xml = builder.build(
        nfeCom(
          {},
          { ...produtoBase, icmsUfDest: { aliquotaInterna: 18, aliquotaInterestadual: 12 } }
        )
      );

      assert.ok(xml.indexOf('<ICMSUFDest>') > xml.indexOf('</COFINS>'));
    });
  });

  describe('ICMS por CST', () => {
    it('CST 00 com FCP deve emitir pFCP e vFCP', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icms: { origem: 0, cst: '00', baseCalculo: 100, aliquota: 17, valor: 17, aliquotaFcp: 2 }
          }
        )
      );

      assert.ok(xml.includes('<pFCP>2.0000</pFCP><vFCP>2.00</vFCP>'));
      validar(xml);
    });

    it('CST 10 deve emitir o grupo de ST completo', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icms: {
              origem: 0,
              cst: '10',
              baseCalculo: 100,
              aliquota: 17,
              valor: 17,
              percentualMva: 40,
              baseCalculoST: 140,
              aliquotaST: 17
            }
          }
        )
      );

      assert.ok(xml.includes('<ICMS10>'));
      assert.ok(xml.includes('<modBCST>4</modBCST><pMVAST>40.0000</pMVAST>'));
      assert.ok(xml.includes('<vBCST>140.00</vBCST><pICMSST>17.0000</pICMSST><vICMSST>23.80</vICMSST>'));
      // ST entra no total da nota.
      assert.ok(xml.includes('<vBCST>140.00</vBCST><vST>23.80</vST>'));
      assert.ok(xml.includes('<vNF>123.80</vNF>'));
      validar(xml);
    });

    it('CST 20 deve emitir reducao de base e desoneracao', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icms: {
              origem: 0,
              cst: '20',
              baseCalculo: 60,
              aliquota: 17,
              valor: 10.2,
              percentualReducaoBase: 40,
              valorDesonerado: 6.8,
              motivoDesoneracao: 9
            }
          }
        )
      );

      assert.ok(xml.includes('<pRedBC>40.0000</pRedBC>'));
      assert.ok(xml.includes('<vICMSDeson>6.80</vICMSDeson><motDesICMS>9</motDesICMS>'));
      validar(xml);
    });

    it('CST 60 deve emitir pST junto com os valores retidos', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icms: {
              origem: 0,
              cst: '60',
              baseCalculoSTRetido: 140,
              aliquotaSTConsumidorFinal: 17,
              valorSTRetido: 23.8
            }
          }
        )
      );

      assert.ok(
        xml.includes('<vBCSTRet>140.00</vBCSTRet><pST>17.0000</pST><vICMSSTRet>23.80</vICMSSTRet>')
      );
      validar(xml);
    });

    it('CST 51 deve emitir o diferimento', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icms: {
              origem: 0,
              cst: '51',
              baseCalculo: 100,
              aliquota: 17,
              valor: 8.5,
              percentualDiferimento: 50
            }
          }
        )
      );

      assert.ok(xml.includes('<pDif>50.0000</pDif><vICMSDif>8.50</vICMSDif>'));
      validar(xml);
    });

    it('CST 40 sem desoneracao deve continuar so com orig e CST', () => {
      const xml = builder.build(
        nfeCom({}, { ...produtoBase, icms: { origem: 0, cst: '40' } })
      );

      assert.ok(xml.includes('<ICMS40><orig>0</orig><CST>40</CST></ICMS40>'));
      validar(xml);
    });
  });

  describe('ICMS do Simples Nacional', () => {
    it('CSOSN 101 deve emitir o credito do Simples', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icms: { origem: 0, csosn: '101', baseCalculo: 100, aliquotaCreditoSN: 2.5 }
          }
        )
      );

      assert.ok(xml.includes('<pCredSN>2.5000</pCredSN><vCredICMSSN>2.50</vCredICMSSN>'));
      validar(xml);
    });

    it('CSOSN 500 deve emitir os valores retidos com pST', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icms: {
              origem: 0,
              csosn: '500',
              baseCalculoSTRetido: 140,
              aliquotaSTConsumidorFinal: 17,
              valorSTRetido: 23.8
            }
          }
        )
      );

      assert.ok(xml.includes('<ICMSSN500>'));
      assert.ok(xml.includes('<vBCSTRet>140.00</vBCSTRet><pST>17.0000</pST>'));
      validar(xml);
    });

    it('CSOSN 102 deve continuar so com orig e CSOSN', () => {
      const xml = builder.build(
        nfeCom({}, { ...produtoBase, icms: { origem: 0, csosn: '102' } })
      );

      assert.ok(xml.includes('<ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102>'));
      validar(xml);
    });

    it('CSOSN 202 deve emitir o grupo de ST', () => {
      const xml = builder.build(
        nfeCom(
          {},
          {
            ...produtoBase,
            icms: {
              origem: 0,
              csosn: '202',
              baseCalculoST: 140,
              aliquotaST: 17,
              percentualMva: 40
            }
          }
        )
      );

      assert.ok(xml.includes('<ICMSSN202>'));
      assert.ok(xml.includes('<vICMSST>23.80</vICMSST>'));
      validar(xml);
    });
  });
});
