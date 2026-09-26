import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
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

const itemBase: ProdutoProps = {
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
  cofins: { cst: '01', baseCalculo: 100, aliquota: 7.6, valor: 7.6 }
};

function nfeCom(produto: Partial<ProdutoProps>, nfeOverrides?: Partial<NFeProps>): NFeProps {
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
    produtos: [{ ...itemBase, ...produto }],
    transporte: { modalidadeFrete: 9 },
    pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] },
    ...nfeOverrides
  };
}

describe('DefaultXmlBuilder — grupos de item', () => {
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

  describe('prod — campos complementares', () => {
    it('deve emitir cBarra, NVE, CEST com escala e cBenef', () => {
      const xml = validar(
        nfeCom({
          codigoBarras: '7891234567890',
          codigoBarrasTributavel: '7891234567890',
          nve: ['AB1234', 'CD5678'],
          cest: '2800100',
          indicadorEscala: 'N',
          cnpjFabricante: '99888777000166',
          codigoBeneficioFiscal: 'MT800001',
          extipi: '01'
        })
      );

      assert.ok(xml.includes('<cBarra>7891234567890</cBarra>'));
      assert.ok(xml.includes('<NVE>AB1234</NVE><NVE>CD5678</NVE>'));
      assert.ok(
        xml.includes('<CEST>2800100</CEST><indEscala>N</indEscala><CNPJFab>99888777000166</CNPJFab>')
      );
      assert.ok(xml.includes('<cBenef>MT800001</cBenef>'));
      assert.ok(xml.includes('<EXTIPI>01</EXTIPI>'));
    });

    it('deve emitir gCred', () => {
      const xml = validar(
        nfeCom({
          creditosPresumidos: [{ codigo: 'CRED0001', percentual: 2.5, valor: 2.5 }]
        })
      );

      assert.ok(
        xml.includes('<gCred><cCredPresumido>CRED0001</cCredPresumido><pCredPresumido>2.5000</pCredPresumido><vCredPresumido>2.50</vCredPresumido></gCred>')
      );
    });

    it('deve emitir xPed, nItemPed e nFCI', () => {
      const xml = validar(
        nfeCom({
          pedido: 'PED-2026-001',
          itemPedido: 3,
          fci: 'B01F70AF-10BF-4B1F-848C-65FF57F616FE'
        })
      );

      assert.ok(xml.includes('<xPed>PED-2026-001</xPed><nItemPed>3</nItemPed>'));
      assert.ok(xml.includes('<nFCI>B01F70AF-10BF-4B1F-848C-65FF57F616FE</nFCI>'));
    });

    it('deve emitir rastro de lote', () => {
      const xml = validar(
        nfeCom({
          rastros: [
            {
              lote: 'LOTE123',
              quantidade: 2,
              dataFabricacao: new Date('2026-01-10T00:00:00'),
              dataValidade: new Date('2027-01-10T00:00:00'),
              codigoAgregacao: 'AGR1'
            }
          ]
        })
      );

      assert.ok(
        xml.includes('<rastro><nLote>LOTE123</nLote><qLote>2.000</qLote><dFab>2026-01-10</dFab><dVal>2027-01-10</dVal><cAgreg>AGR1</cAgreg></rastro>')
      );
    });

    it('deve emitir infProdEmb e indBemMovelUsado', () => {
      const xml = validar(
        nfeCom({
          bemMovelUsado: true,
          embalagem: { identificacao: 'CX-12', volume: 1.5, unidade: 'M3' }
        })
      );

      assert.ok(xml.includes('<indBemMovelUsado>1</indBemMovelUsado>'));
      assert.ok(
        xml.includes('<infProdEmb><xEmb>CX-12</xEmb><qVolEmb>1.500</qVolEmb><uEmb>M3</uEmb></infProdEmb>')
      );
    });
  });

  describe('importacao e exportacao', () => {
    it('deve emitir DI com adicoes', () => {
      const xml = validar(
        nfeCom({
          declaracoesImportacao: [
            {
              numero: '2026/1234567',
              dataRegistro: new Date('2026-03-01T00:00:00'),
              localDesembaraco: 'Porto de Santos',
              ufDesembaraco: 'SP',
              dataDesembaraco: new Date('2026-03-05T00:00:00'),
              viaTransporte: 1,
              valorAfrmm: 150.5,
              tipoIntermediacao: 1,
              codigoExportador: 'EXP-001',
              adicoes: [{ numero: 1, sequencial: 1, codigoFabricante: 'FAB-9', desconto: 10 }]
            }
          ]
        })
      );

      assert.ok(xml.includes('<DI><nDI>2026/1234567</nDI><dDI>2026-03-01</dDI>'));
      assert.ok(xml.includes('<vAFRMM>150.50</vAFRMM>'));
      assert.ok(
        xml.includes('<adi><nAdicao>1</nAdicao><nSeqAdic>1</nSeqAdic><cFabricante>FAB-9</cFabricante><vDescDI>10.00</vDescDI></adi>')
      );
    });

    it('deve emitir detExport com exportacao indireta', () => {
      const xml = validar(
        nfeCom({
          detalhesExportacao: [
            {
              drawback: '20260000001',
              exportacaoIndireta: {
                registroExportacao: '12345678901',
                chaveAcesso: '51260411222333000181550010000000011000000015',
                quantidade: 2
              }
            }
          ]
        })
      );

      assert.ok(xml.includes('<detExport><nDraw>20260000001</nDraw><exportInd>'));
      assert.ok(xml.includes('<qExport>2.0000</qExport>'));
    });
  });

  describe('produtos com grupo proprio', () => {
    it('deve emitir veicProd', () => {
      const xml = validar(
        nfeCom({
          veiculoNovo: {
            tipoOperacao: 1,
            chassi: '9BWZZZ377VT004251',
            codigoCor: '01',
            cor: 'Branco',
            potencia: '100',
            cilindrada: '1600',
            pesoLiquido: '1000',
            pesoBruto: '1200',
            numeroSerie: '123456',
            tipoCombustivel: '01',
            numeroMotor: 'MOT123',
            capacidadeMaximaTracao: '1500',
            distanciaEixos: '2500',
            anoModelo: 2026,
            anoFabricacao: 2026,
            tipoPintura: 'U',
            tipoVeiculo: 6,
            especieVeiculo: 1,
            vin: 'N',
            condicaoVeiculo: 1,
            codigoModelo: '123456',
            codigoCorDenatran: '01',
            lotacao: 5,
            tipoRestricao: 0
          }
        })
      );

      assert.ok(xml.includes('<veicProd><tpOp>1</tpOp><chassi>9BWZZZ377VT004251</chassi>'));
      assert.ok(xml.includes('<VIN>N</VIN>'));
    });

    it('deve emitir med', () => {
      const xml = validar(
        nfeCom({
          medicamento: { codigoAnvisa: '1234567890123', precoMaximoConsumidor: 45.9 }
        })
      );

      assert.ok(
        xml.includes('<med><cProdANVISA>1234567890123</cProdANVISA><vPMC>45.90</vPMC></med>')
      );
    });

    it('deve emitir arma', () => {
      const xml = validar(
        nfeCom({
          armamentos: [
            { tipo: 0, numeroSerie: 'ARM123', numeroSerieCano: 'CANO1', descricao: 'Pistola .38' }
          ]
        })
      );

      assert.ok(
        xml.includes('<arma><tpArma>0</tpArma><nSerie>ARM123</nSerie><nCano>CANO1</nCano><descr>Pistola .38</descr></arma>')
      );
    });

    it('deve emitir comb com CIDE, encerrante e origem', () => {
      const xml = validar(
        nfeCom({
          combustivel: {
            codigoAnp: '320102001',
            descricaoAnp: 'GASOLINA C COMUM',
            ufConsumo: 'MT',
            percentualBiocombustivel: 27,
            cide: { quantidade: 100, aliquota: 0.1, valor: 10 },
            encerrante: { bico: 1, bomba: 2, tanque: 3, valorInicial: 1000, valorFinal: 1100 },
            origens: [{ indicadorImportacao: 0, uf: 'MT', percentual: 100 }]
          }
        })
      );

      assert.ok(xml.includes('<comb><cProdANP>320102001</cProdANP>'));
      assert.ok(xml.includes('<CIDE><qBCProd>100.0000</qBCProd>'));
      assert.ok(xml.includes('<encerrante><nBico>1</nBico><nBomba>2</nBomba><nTanque>3</nTanque>'));
      assert.ok(xml.includes('<origComb><indImport>0</indImport><cUFOrig>51</cUFOrig>'));
    });
  });

  describe('impostos que faltavam', () => {
    it('deve emitir II', () => {
      const xml = validar(
        nfeCom({
          ii: { baseCalculo: 100, despesasAduaneiras: 20, valor: 15, valorIof: 5 }
        })
      );

      assert.ok(
        xml.includes('<II><vBC>100.00</vBC><vDespAdu>20.00</vDespAdu><vII>15.00</vII><vIOF>5.00</vIOF></II>')
      );
      assert.ok(xml.includes('<vII>15.00</vII><vIPI>0.00</vIPI>'));
    });

    it('deve emitir ISSQN no lugar do ICMS, com IPI antes', () => {
      const xml = validar(
        nfeCom(
          {
            cfop: '5933',
            icms: { origem: 0, cst: '40' },
            issqn: {
              baseCalculo: 100,
              aliquota: 5,
              valor: 5,
              codigoMunicipioFatoGerador: '5103403',
              itemListaServicos: '01.01',
              exigibilidade: 1,
              incentivoFiscal: 2
            }
          },
          {
            totaisServico: {
              valorServicos: 100,
              baseCalculo: 100,
              valorIss: 5,
              dataCompetencia: new Date('2026-04-01T00:00:00')
            }
          }
        )
      );

      assert.ok(xml.includes('<ISSQN><vBC>100.00</vBC><vAliq>5.0000</vAliq><vISSQN>5.00</vISSQN>'));
      assert.ok(!xml.includes('<ICMS40>'));
      assert.ok(xml.includes('<ISSQNtot>'));
      assert.ok(xml.includes('<dCompet>2026-04-01</dCompet>'));
    });

    it('deve emitir PISST e COFINSST', () => {
      const xml = validar(
        nfeCom({
          pisSt: { baseCalculo: 100, aliquota: 1.65, valor: 1.65, compoeTotal: 1 },
          cofinsSt: { quantidade: 10, aliquotaPorUnidade: 0.5, valor: 5, compoeTotal: 0 }
        })
      );

      assert.ok(xml.includes('<PISST><vBC>100.00</vBC><pPIS>1.6500</pPIS><vPIS>1.65</vPIS><indSomaPISST>1</indSomaPISST></PISST>'));
      assert.ok(xml.includes('<COFINSST><qBCProd>10.0000</qBCProd><vAliqProd>0.5000</vAliqProd>'));
    });

    it('deve emitir PIS por quantidade', () => {
      const xml = validar(
        nfeCom({
          pis: { cst: '03', quantidade: 10, aliquotaPorUnidade: 0.165, valor: 1.65 }
        })
      );

      assert.ok(
        xml.includes('<PISQtde><CST>03</CST><qBCProd>10.0000</qBCProd><vAliqProd>0.1650</vAliqProd><vPIS>1.65</vPIS></PISQtde>')
      );
    });

    it('deve emitir IPI por unidade e com selo', () => {
      const xml = validar(
        nfeCom({
          ipi: {
            cst: '50',
            cEnq: '999',
            cnpjProdutor: '99888777000166',
            codigoSelo: 'SELO1',
            quantidadeSelo: 10,
            quantidade: 100,
            valorPorUnidade: 0.5,
            valor: 50
          }
        })
      );

      assert.ok(xml.includes('<IPI><CNPJProd>99888777000166</CNPJProd><cSelo>SELO1</cSelo><qSelo>10</qSelo>'));
      assert.ok(xml.includes('<qUnid>100.0000</qUnid><vUnid>0.5000</vUnid><vIPI>50.00</vIPI>'));
    });

    it('deve emitir vTotTrib no item e no total', () => {
      const xml = validar(nfeCom({ tributosAproximados: 30.5 }));

      assert.ok(xml.includes('<imposto><vTotTrib>30.50</vTotTrib>'));
      assert.ok(xml.includes('<vTotTrib>30.50</vTotTrib></ICMSTot>'));
    });
  });

  describe('ICMS — variantes que faltavam', () => {
    it('CST 02 monofasico', () => {
      const xml = validar(
        nfeCom({
          icms: {
            origem: 0,
            cst: '02',
            monofasico: { quantidade: 100, aliquotaAdRem: 1.22, valor: 122 }
          }
        })
      );

      assert.ok(
        xml.includes('<ICMS02><orig>0</orig><CST>02</CST><qBCMono>100.0000</qBCMono><adRemICMS>1.2200</adRemICMS><vICMSMono>122.00</vICMSMono></ICMS02>')
      );
      assert.ok(xml.includes('<vICMSMono>122.00</vICMSMono>'));
    });

    it('CST 15 monofasico com retencao', () => {
      const xml = validar(
        nfeCom({
          icms: {
            origem: 0,
            cst: '15',
            monofasico: {
              quantidade: 100,
              aliquotaAdRem: 1.22,
              valor: 122,
              quantidadeRetencao: 50,
              aliquotaAdRemRetencao: 1.22,
              valorRetencao: 61,
              percentualReducaoAdRem: 10,
              motivoReducaoAdRem: 1
            }
          }
        })
      );

      assert.ok(xml.includes('<ICMS15>'));
      assert.ok(xml.includes('<pRedAdRem>10.00</pRedAdRem><motRedAdRem>1</motRedAdRem>'));
    });

    it('CST 61 monofasico retido', () => {
      const xml = validar(
        nfeCom({
          icms: {
            origem: 0,
            cst: '61',
            monofasico: { quantidadeRetido: 100, aliquotaAdRemRetido: 1.22, valorRetido: 122 }
          }
        })
      );

      assert.ok(xml.includes('<ICMS61><orig>0</orig><CST>61</CST><qBCMonoRet>100.0000</qBCMonoRet>'));
    });

    it('CST 60 com ICMS efetivo', () => {
      const xml = validar(
        nfeCom({
          icms: {
            origem: 0,
            cst: '60',
            baseCalculoSTRetido: 140,
            aliquotaSTConsumidorFinal: 17,
            valorSTRetido: 23.8,
            aliquotaFcpSTRetido: 2,
            efetivo: { percentualReducaoBase: 0, baseCalculo: 100, aliquota: 17, valor: 17 }
          }
        })
      );

      assert.ok(xml.includes('<vBCFCPSTRet>140.00</vBCFCPSTRet><pFCPSTRet>2.0000</pFCPSTRet>'));
      assert.ok(xml.includes('<pRedBCEfet>0.0000</pRedBCEfet><vBCEfet>100.00</vBCEfet>'));
      assert.ok(xml.includes('<vFCPSTRet>2.80</vFCPSTRet>'));
    });

    it('ICMSPart', () => {
      const xml = validar(
        nfeCom({
          icms: {
            origem: 0,
            cst: '10',
            baseCalculo: 100,
            aliquota: 17,
            valor: 17,
            baseCalculoST: 140,
            aliquotaST: 17,
            percentualBaseOperacaoPropria: 60,
            ufSt: 'SP'
          }
        })
      );

      assert.ok(xml.includes('<ICMSPart>'));
      assert.ok(xml.includes('<pBCOp>60.0000</pBCOp><UFST>SP</UFST>'));
    });

    it('ICMSST', () => {
      const xml = validar(
        nfeCom({
          icms: {
            origem: 0,
            cst: '41',
            baseCalculoSTRetido: 140,
            aliquotaSTConsumidorFinal: 17,
            valorSTRetido: 23.8,
            baseCalculoSTDestino: 100,
            valorSTDestino: 17
          }
        })
      );

      assert.ok(xml.includes('<ICMSST>'));
      assert.ok(xml.includes('<vBCSTDest>100.00</vBCSTDest><vICMSSTDest>17.00</vICMSSTDest>'));
    });

    it('CST 20 com indDeduzDeson', () => {
      const xml = validar(
        nfeCom({
          icms: {
            origem: 0,
            cst: '20',
            baseCalculo: 60,
            aliquota: 17,
            valor: 10.2,
            percentualReducaoBase: 40,
            valorDesonerado: 6.8,
            motivoDesoneracao: 9,
            indicadorDeducaoDesoneracao: 1
          }
        })
      );

      assert.ok(xml.includes('<motDesICMS>9</motDesICMS><indDeduzDeson>1</indDeduzDeson>'));
    });

    it('CST 10 com ST desonerado', () => {
      const xml = validar(
        nfeCom({
          icms: {
            origem: 0,
            cst: '10',
            baseCalculo: 100,
            aliquota: 17,
            valor: 17,
            baseCalculoST: 140,
            aliquotaST: 17,
            valorStDesonerado: 5,
            motivoStDesoneracao: 9
          }
        })
      );

      assert.ok(xml.includes('<vICMSSTDeson>5.00</vICMSSTDeson><motDesICMSST>9</motDesICMSST>'));
    });

    it('CST 51 com cBenefRBC e FCP diferido', () => {
      const xml = validar(
        nfeCom({
          icms: {
            origem: 0,
            cst: '51',
            baseCalculo: 100,
            aliquota: 17,
            valor: 8.5,
            codigoBeneficioReducaoBase: 'MT800002',
            valorOperacao: 17,
            percentualDiferimento: 50,
            aliquotaFcp: 2,
            percentualFcpDiferido: 50,
            valorFcpDiferido: 1,
            valorFcpEfetivo: 1
          }
        })
      );

      assert.ok(xml.includes('<cBenefRBC>MT800002</cBenefRBC>'));
      assert.ok(xml.includes('<vICMSOp>17.00</vICMSOp>'));
      assert.ok(xml.includes('<pFCPDif>50.0000</pFCPDif><vFCPDif>1.00</vFCPDif><vFCPEfet>1.00</vFCPEfet>'));
    });
  });

  describe('det — grupos alem do prod e imposto', () => {
    it('deve emitir impostoDevol, infAdProd, obsItem, vItem e DFeReferenciado', () => {
      const xml = validar(
        nfeCom({
          impostoDevolvido: { percentualDevolvido: 100, valorIpiDevolvido: 5 },
          informacoesAdicionais: 'Item com garantia estendida',
          observacaoItem: {
            contribuinte: { campo: 'Origem', texto: 'Estoque loja 2' },
            fisco: { campo: 'Regime', texto: 'Especial' }
          },
          valorItem: 100,
          dfeReferenciado: {
            chaveAcesso: '51260411222333000181550010000000011000000015',
            numeroItem: 1
          }
        })
      );

      assert.ok(
        xml.includes('<impostoDevol><pDevol>100.00</pDevol><IPI><vIPIDevol>5.00</vIPIDevol></IPI></impostoDevol>')
      );
      assert.ok(xml.includes('<infAdProd>Item com garantia estendida</infAdProd>'));
      assert.ok(xml.includes('<obsItem><obsCont xCampo="Origem"><xTexto>Estoque loja 2</xTexto></obsCont>'));
      assert.ok(xml.includes('<vItem>100.00</vItem>'));
      assert.ok(xml.includes('<DFeReferenciado><chaveAcesso>'));
      // vIPIDevol tem que aparecer somado no total.
      assert.ok(xml.includes('<vIPIDevol>5.00</vIPIDevol>'));
    });
  });

  describe('reforma tributaria — IS e compra governamental', () => {
    it('deve emitir IS no item e ISTot no total', () => {
      const xml = validar(
        nfeCom({
          impostoSeletivo: {
            cst: '000',
            cClassTrib: '000001',
            baseCalculo: 100,
            aliquota: 10,
            unidadeTributavel: 'UN',
            quantidadeTributavel: 2,
            valor: 10
          }
        })
      );

      assert.ok(xml.includes('<IS><CSTIS>000</CSTIS><cClassTribIS>000001</cClassTribIS>'));
      assert.ok(xml.includes('<vIS>10.00</vIS>'));
      assert.ok(xml.includes('<ISTot><vIS>10.00</vIS></ISTot>'));
    });

    it('deve emitir gCompraGov, tpNFDebito e refNFeSig', () => {
      const xml = validar(
        nfeCom(
          {},
          {
            identificacao: {
              naturezaOperacao: 'Venda para orgao publico',
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
              compraGovernamental: { tipoEnte: 1, percentualRedutor: 30, tipoOperacao: 1 },
              notasReferenciadas: [
                {
                  tipo: 'nfeSigilosa',
                  chaveAcesso: '51260411222333000181550010000000011000000015'
                }
              ]
            }
          }
        )
      );

      assert.ok(
        xml.includes('<gCompraGov><tpEnteGov>1</tpEnteGov><pRedutor>30.0000</pRedutor><tpOperGov>1</tpOperGov></gCompraGov>')
      );
      assert.ok(xml.includes('<refNFeSig>51260411222333000181550010000000011000000015</refNFeSig>'));
    });

    it('deve emitir vNFTot', () => {
      const xml = validar(nfeCom({}, { valorTotalNota: 123.45 }));

      assert.ok(xml.includes('<vNFTot>123.45</vNFTot></total>'));
    });
  });

  describe('total — grupos que faltavam', () => {
    it('deve emitir retTrib', () => {
      const xml = validar(
        nfeCom(
          {},
          {
            retencoesTributos: {
              valorRetidoPis: 1.65,
              valorRetidoCofins: 7.6,
              valorRetidoCsll: 1,
              baseCalculoIrrf: 100,
              valorIrrf: 1.5
            }
          }
        )
      );

      assert.ok(
        xml.includes('<retTrib><vRetPIS>1.65</vRetPIS><vRetCOFINS>7.60</vRetCOFINS><vRetCSLL>1.00</vRetCSLL>')
      );
    });
  });
});
