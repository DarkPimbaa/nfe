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
import { formatDate } from '@nfe/infra/xml/xml-helper';
import { generateTestCertificate } from '../../helpers/generate-test-certificate';

const schemasDir = resolve(__dirname, '..', '..', '..', 'schemas');

const base: NFeProps = {
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
  pagamento: { pagamentos: [{ formaPagamento: '01', valor: 100 }] }
};

function com(overrides: Partial<NFeProps>): NFeProps {
  return {
    ...base,
    ...overrides,
    identificacao: { ...base.identificacao, ...overrides.identificacao }
  };
}

describe('DefaultXmlBuilder — grupos de nota', () => {
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

  describe('ide', () => {
    it('deve emitir dhSaiEnt e dPrevEntrega', () => {
      const xml = validar(
        com({
          identificacao: {
            ...base.identificacao,
            dataSaidaEntrada: new Date('2026-04-28T15:30:00'),
            dataPrevistaEntrega: new Date('2026-05-02T00:00:00')
          }
        })
      );

      const saida = new Date('2026-04-28T15:30:00');
      assert.ok(xml.includes(`<dhSaiEnt>${formatDate(saida)}</dhSaiEnt>`));
      assert.ok(xml.includes('<dPrevEntrega>2026-05-02</dPrevEntrega>'));
    });

    it('deve emitir dhCont e xJust em contingencia', () => {
      const xml = validar(
        com({
          identificacao: {
            ...base.identificacao,
            tipoEmissao: 9,
            dataHoraContingencia: new Date('2026-04-28T10:00:00'),
            justificativaContingencia: 'SEFAZ indisponivel por mais de 30 minutos'
          }
        })
      );

      assert.ok(xml.includes(`<dhCont>${formatDate(new Date('2026-04-28T10:00:00'))}</dhCont>`));
      assert.ok(xml.includes('<xJust>SEFAZ indisponivel por mais de 30 minutos</xJust>'));
      assert.ok(xml.indexOf('<dhCont>') > xml.indexOf('<verProc>'));
    });

    it('deve omitir a contingencia quando so um dos dois campos vem', () => {
      const xml = validar(
        com({
          identificacao: { ...base.identificacao, dataHoraContingencia: new Date() }
        })
      );

      assert.ok(!xml.includes('<dhCont>'));
    });

    it('deve emitir indIntermed e cMunFGIBS', () => {
      const xml = validar(
        com({
          identificacao: {
            ...base.identificacao,
            indicadorIntermediador: 1,
            municipioFatoGeradorIbs: '5103403'
          },
          intermediador: { cnpj: '99888777000166', identificadorVendedor: 'loja-123' }
        })
      );

      assert.ok(xml.includes('<indIntermed>1</indIntermed>'));
      assert.ok(xml.includes('<cMunFGIBS>5103403</cMunFGIBS>'));
      assert.ok(
        xml.includes('<infIntermed><CNPJ>99888777000166</CNPJ><idCadIntTran>loja-123</idCadIntTran></infIntermed>')
      );
    });
  });

  describe('emitente e destinatario', () => {
    it('deve emitir IEST do emitente', () => {
      const xml = validar(
        com({ emitente: { ...base.emitente, inscricaoEstadualST: '222222222222' } })
      );

      assert.ok(xml.includes('<IEST>222222222222</IEST>'));
    });

    it('deve emitir idEstrangeiro, ISUF e IM do destinatario', () => {
      const xml = validar(
        com({
          identificacao: { ...base.identificacao, ambiente: 1 },
          destinatario: {
            idEstrangeiro: 'PASSPORT123',
            nome: 'John Doe',
            indicadorIE: 9,
            inscricaoSuframa: '12345678',
            inscricaoMunicipal: '9988',
            endereco: base.destinatario!.endereco
          }
        })
      );

      assert.ok(xml.includes('<idEstrangeiro>PASSPORT123</idEstrangeiro>'));
      assert.ok(xml.includes('<ISUF>12345678</ISUF>'));
    });
  });

  describe('retirada e entrega', () => {
    it('deve emitir os dois locais na posicao correta', () => {
      const local = {
        cnpj: '11222333000181',
        nome: 'Deposito Central',
        logradouro: 'Rua do Deposito',
        numero: '900',
        bairro: 'Industrial',
        codigoMunicipio: '5103403',
        municipio: 'Cuiaba',
        uf: 'MT',
        cep: '78000000'
      };

      const xml = validar(com({ retirada: local, entrega: { ...local, nome: 'Obra 7' } }));

      assert.ok(xml.includes('<retirada><CNPJ>11222333000181</CNPJ><xNome>Deposito Central</xNome>'));
      assert.ok(xml.includes('<entrega>'));
      assert.ok(xml.indexOf('<retirada>') > xml.indexOf('</dest>'));
      assert.ok(xml.indexOf('<entrega>') > xml.indexOf('</retirada>'));
      assert.ok(xml.indexOf('<entrega>') < xml.indexOf('<det '));
    });

    it('deve aceitar CPF no local de entrega', () => {
      const xml = validar(
        com({
          entrega: {
            cpf: '52998224725',
            logradouro: 'Rua A',
            numero: '1',
            bairro: 'Centro',
            codigoMunicipio: '5103403',
            municipio: 'Cuiaba',
            uf: 'MT'
          }
        })
      );

      assert.ok(xml.includes('<entrega><CPF>52998224725</CPF>'));
    });
  });

  describe('transporte completo', () => {
    it('deve emitir retTransp, reboques e lacres', () => {
      const xml = validar(
        com({
          transporte: {
            modalidadeFrete: 0,
            cnpjTransportadora: '99888777000166',
            nomeTransportadora: 'Transportes Rapidos',
            uf: 'MT',
            retencao: {
              valorServico: 200,
              baseCalculoRetencao: 200,
              aliquotaRetencao: 12,
              valorRetencao: 24,
              cfop: '5352',
              codigoMunicipio: '5103403'
            },
            veiculo: { placa: 'ABC1D23', uf: 'MT', rntc: '123456' },
            reboques: [{ placa: 'XYZ9W87', uf: 'MT' }],
            volumes: [
              {
                quantidade: 2,
                especie: 'Caixa',
                pesoLiquido: 10.5,
                pesoBruto: 11,
                lacres: ['LAC001', 'LAC002']
              }
            ]
          }
        })
      );

      assert.ok(xml.includes('<retTransp><vServ>200.00</vServ><vBCRet>200.00</vBCRet>'));
      assert.ok(xml.includes('<reboque><placa>XYZ9W87</placa><UF>MT</UF></reboque>'));
      assert.ok(xml.includes('<lacres><nLacre>LAC001</nLacre></lacres>'));
      assert.ok(xml.includes('<lacres><nLacre>LAC002</nLacre></lacres>'));
    });

    it('deve emitir vagao no lugar do veiculo rodoviario', () => {
      const xml = validar(
        com({ transporte: { modalidadeFrete: 2, vagao: 'VG-1234' } })
      );

      assert.ok(xml.includes('<vagao>VG-1234</vagao>'));
      assert.ok(!xml.includes('<veicTransp>'));
    });

    it('deve emitir balsa', () => {
      const xml = validar(com({ transporte: { modalidadeFrete: 2, balsa: 'BALSA-7' } }));

      assert.ok(xml.includes('<balsa>BALSA-7</balsa>'));
    });

    it('deve aceitar CPF de transportador autonomo', () => {
      const xml = validar(
        com({
          transporte: {
            modalidadeFrete: 1,
            cpfTransportadora: '52998224725',
            nomeTransportadora: 'Jose Motorista'
          }
        })
      );

      assert.ok(xml.includes('<transporta><CPF>52998224725</CPF>'));
    });
  });

  describe('informacoes adicionais', () => {
    it('deve emitir obsCont, obsFisco e procRef', () => {
      const xml = validar(
        com({
          informacoesComplementares: 'Pedido 123',
          observacoesContribuinte: [{ campo: 'Vendedor', texto: 'Joao' }],
          observacoesFisco: [{ campo: 'Regime', texto: 'Especial 45' }],
          processosReferenciados: [{ numero: '0001234-55.2026', origem: 1, tipoAto: '10' }]
        })
      );

      assert.ok(xml.includes('<obsCont xCampo="Vendedor"><xTexto>Joao</xTexto></obsCont>'));
      assert.ok(xml.includes('<obsFisco xCampo="Regime"><xTexto>Especial 45</xTexto></obsFisco>'));
      assert.ok(xml.includes('<procRef><nProc>0001234-55.2026</nProc><indProc>1</indProc>'));
    });

    it('deve omitir infAdic quando nao ha nada', () => {
      const xml = validar(com({}));

      assert.ok(!xml.includes('<infAdic>'));
    });
  });

  describe('exporta, compra e cana', () => {
    it('deve emitir exporta e compra', () => {
      const xml = validar(
        com({
          exportacao: { ufSaida: 'SP', localExportacao: 'Porto de Santos' },
          compra: { notaEmpenho: 'NE-2026-1', pedido: 'PED-9' }
        })
      );

      assert.ok(xml.includes('<exporta><UFSaidaPais>SP</UFSaidaPais>'));
      assert.ok(xml.includes('<compra><xNEmp>NE-2026-1</xNEmp><xPed>PED-9</xPed></compra>'));
      assert.ok(xml.indexOf('<exporta>') > xml.indexOf('</pag>'));
    });

    it('deve emitir o grupo cana com fornecimentos e deducoes', () => {
      const xml = validar(
        com({
          cana: {
            safra: '2025/2026',
            referencia: '04/2026',
            fornecimentosDiarios: [
              { dia: 1, quantidade: 1000 },
              { dia: 2, quantidade: 1500 }
            ],
            totalMes: 2500,
            totalAnterior: 0,
            totalGeral: 2500,
            deducoes: [{ descricao: 'Frete', valor: 300 }],
            valorFornecimento: 5000,
            valorTotalDeducao: 300,
            valorLiquido: 4700
          }
        })
      );

      assert.ok(xml.includes('<forDia dia="1"><qtde>1000.0000000000</qtde></forDia>'));
      assert.ok(xml.includes('<deduc><xDed>Frete</xDed><vDed>300.00</vDed></deduc>'));
      assert.ok(xml.includes('<vLiqFor>4700.00</vLiqFor>'));
    });
  });

  describe('agropecuario e NFF', () => {
    it('deve emitir defensivos', () => {
      const xml = validar(
        com({
          agropecuario: {
            defensivos: [{ receituario: 'REC-001', cpfResponsavelTecnico: '52998224725' }]
          }
        })
      );

      assert.ok(
        xml.includes('<defensivo><nReceituario>REC-001</nReceituario><CPFRespTec>52998224725</CPFRespTec></defensivo>')
      );
    });

    it('deve emitir guia de transito', () => {
      const xml = validar(
        com({ agropecuario: { guiaTransito: { tipo: 1, uf: 'MT', serie: 'A', numero: '99' } } })
      );

      assert.ok(xml.includes('<guiaTransito><tpGuia>1</tpGuia><UFGuia>MT</UFGuia><serieGuia>A</serieGuia><nGuia>99</nGuia></guiaTransito>'));
    });

    it('deve emitir infSolicNFF', () => {
      const xml = validar(com({ solicitacaoNFF: 'Solicitacao do contribuinte via NFF' }));

      assert.ok(xml.includes('<infSolicNFF><xSolic>Solicitacao do contribuinte via NFF</xSolic></infSolicNFF>'));
    });
  });

  describe('avulsa', () => {
    it('deve emitir o grupo avulsa depois do emit', () => {
      const xml = validar(
        com({
          avulsa: {
            cnpj: '11222333000181',
            orgao: 'SEFAZ-MT',
            matricula: '12345',
            agente: 'Fiscal Responsavel',
            uf: 'MT',
            reparticaoEmitente: 'Agencia Fazendaria Cuiaba',
            numeroDar: 'DAR-1',
            valorDar: 100,
            dataEmissaoDar: new Date('2026-04-28T00:00:00')
          }
        })
      );

      assert.ok(xml.includes('<avulsa><CNPJ>11222333000181</CNPJ><xOrgao>SEFAZ-MT</xOrgao>'));
      assert.ok(xml.includes('<dEmi>2026-04-28</dEmi>'));
      assert.ok(xml.indexOf('<avulsa>') > xml.indexOf('</emit>'));
      assert.ok(xml.indexOf('<avulsa>') < xml.indexOf('<dest>'));
    });
  });

  describe('validacao Zod', () => {
    it('deve rejeitar local sem CNPJ nem CPF', () => {
      const result = nfeSchema.safeParse({
        ...base,
        entrega: {
          logradouro: 'Rua A',
          numero: '1',
          bairro: 'Centro',
          codigoMunicipio: '5103403',
          municipio: 'Cuiaba',
          uf: 'MT'
        }
      });

      assert.equal(result.success, false);
    });

    it('deve rejeitar transporte com vagao e balsa juntos', () => {
      const result = nfeSchema.safeParse({
        ...base,
        transporte: { modalidadeFrete: 2, vagao: 'VG-1', balsa: 'BL-1' }
      });

      assert.equal(result.success, false);
    });
  });
});
