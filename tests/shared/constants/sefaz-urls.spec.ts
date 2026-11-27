import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getEventoUrl,
  getSefazUrl,
  ibgeToUf,
  UF_AUTORIZADOR
} from '@nfe/shared/constants/sefaz-urls';

describe('sefaz-urls', () => {
  describe('UF_AUTORIZADOR', () => {
    it('deve mapear todas as 27 UFs para um autorizador', () => {
      const ufs = [
        'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
        'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
        'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
      ];

      for (const uf of ufs) {
        assert.ok(
          UF_AUTORIZADOR[uf],
          `UF ${uf} deve ter autorizador mapeado`
        );
      }
    });

    it('MT deve usar autorizador MT', () => {
      assert.equal(UF_AUTORIZADOR['MT'], 'MT');
    });

    it('RJ deve usar autorizador SVRS', () => {
      assert.equal(UF_AUTORIZADOR['RJ'], 'SVRS');
    });

    it('MA deve usar autorizador SVAN', () => {
      assert.equal(UF_AUTORIZADOR['MA'], 'SVAN');
    });
  });

  describe('getEventoUrl', () => {
    it('NFC-e (65) de UF via SVRS usa o RecepcaoEvento da NFC-e, não o da NF-e', () => {
      // Regressão: sem NFCeRecepcaoEvento no SVRS, o cancelamento da NFC-e
      // caía no webservice da NF-e 55 e a SEFAZ rejeitava com cStat 450.
      assert.equal(
        getEventoUrl('AL', 'homologacao', '65'),
        'https://nfce-homologacao.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx'
      );
      assert.equal(
        getEventoUrl('AL', 'producao', '65'),
        'https://nfce.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx'
      );
    });

    it('NF-e (55) continua no RecepcaoEvento da NF-e', () => {
      assert.equal(
        getEventoUrl('AL', 'homologacao', '55'),
        'https://nfe-homologacao.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx'
      );
    });

    it('NFC-e (65) de GO usa o evento próprio de GO', () => {
      assert.equal(
        getEventoUrl('GO', 'homologacao', '65'),
        'https://homolog.sefaz.go.gov.br/nfe/services/NFeRecepcaoEvento4'
      );
    });
  });

  describe('getSefazUrl', () => {
    it('deve retornar URL de NFeAutorizacao para MT homologacao', () => {
      const url = getSefazUrl('MT', 'homologacao', 'NFeAutorizacao');
      assert.equal(
        url,
        'https://homologacao.sefaz.mt.gov.br/nfews/v2/services/NfeAutorizacao4'
      );
    });

    it('deve retornar URL de NFeConsultaProtocolo para MT producao', () => {
      const url = getSefazUrl('MT', 'producao', 'NFeConsultaProtocolo');
      assert.equal(
        url,
        'https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeConsulta4'
      );
    });

    it('deve retornar URL de NFeStatusServico para MT homologacao', () => {
      const url = getSefazUrl('MT', 'homologacao', 'NFeStatusServico');
      assert.equal(
        url,
        'https://homologacao.sefaz.mt.gov.br/nfews/v2/services/NfeStatusServico4'
      );
    });

    it('deve retornar URL de NFeAutorizacao para SP homologacao', () => {
      const url = getSefazUrl('SP', 'homologacao', 'NFeAutorizacao');
      assert.equal(
        url,
        'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx'
      );
    });

    it('deve retornar URL via SVRS para RJ (que usa SVRS)', () => {
      const url = getSefazUrl('RJ', 'producao', 'NFeAutorizacao');
      assert.ok(url.includes('svrs.rs.gov.br'));
    });

    it('deve retornar URL via SVAN para MA (que usa SVAN)', () => {
      const url = getSefazUrl('MA', 'producao', 'NFeAutorizacao');
      assert.ok(url.includes('sefazvirtual.fazenda.gov.br'));
    });

    it('deve lancar erro para UF desconhecida', () => {
      assert.throws(
        () => getSefazUrl('XX', 'homologacao', 'NFeAutorizacao'),
        { message: /UF desconhecida: XX/ }
      );
    });
  });

  describe('ibgeToUf', () => {
    it('deve converter codigo IBGE 51 para MT', () => {
      assert.equal(ibgeToUf('51'), 'MT');
    });

    it('deve converter codigo IBGE 35 para SP', () => {
      assert.equal(ibgeToUf('35'), 'SP');
    });

    it('deve lancar erro para codigo IBGE invalido', () => {
      assert.throws(
        () => ibgeToUf('99'),
        { message: /Codigo IBGE de UF desconhecido: 99/ }
      );
    });
  });
});
