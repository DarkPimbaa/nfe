import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MUNICIPIOS,
  PAISES,
  MT_MUNICIPIOS,
  CODIGO_PAIS_BRASIL,
  getMunicipio,
  getUfDoMunicipio,
  findCodigoMunicipio,
  getMunicipiosDaUf,
  getPais
} from '@nfe/shared/constants/ibge-codes';
import { UF_CODES } from '@brasil-fiscal/core';

describe('ibge-codes', () => {
  describe('MUNICIPIOS', () => {
    it('deve cobrir todos os municipios do pais', () => {
      assert.equal(Object.keys(MUNICIPIOS).length, 5571);
    });

    it('deve ter apenas codigos de 7 digitos', () => {
      const invalidos = Object.keys(MUNICIPIOS).filter((c) => !/^\d{7}$/.test(c));
      assert.deepEqual(invalidos, []);
    });

    it('deve ter todos os codigos com prefixo de UF valido', () => {
      const prefixosValidos = new Set(Object.values(UF_CODES));
      const orfaos = Object.keys(MUNICIPIOS).filter((c) => !prefixosValidos.has(c.slice(0, 2)));
      assert.deepEqual(orfaos, []);
    });
  });

  describe('getMunicipio', () => {
    it('deve retornar o nome do municipio pelo codigo IBGE', () => {
      assert.equal(getMunicipio('5103403'), 'Cuiabá');
      assert.equal(getMunicipio('3550308'), 'São Paulo');
      assert.equal(getMunicipio('3304557'), 'Rio de Janeiro');
    });

    it('deve retornar undefined para codigo inexistente', () => {
      assert.equal(getMunicipio('9999999'), undefined);
    });

    it('deve corrigir os codigos de MT que a tabela antiga trocava', () => {
      // A tabela manual anterior mapeava 5108907 -> 'Terra Nova do Norte',
      // 5107958 -> 'Sao Felix do Araguaia' e 5108956 -> 'Uniao do Sul'.
      assert.equal(getMunicipio('5108907'), 'Nova Maringá');
      assert.equal(getMunicipio('5107958'), 'Tangará da Serra');
      assert.equal(getMunicipio('5108956'), 'Nova Monte Verde');
      assert.equal(getMunicipio('5108055'), 'Terra Nova do Norte');
    });

    it('deve incluir municipio criado recentemente em MT', () => {
      assert.equal(getMunicipio('5101837'), 'Boa Esperança do Norte');
    });
  });

  describe('getUfDoMunicipio', () => {
    it('deve derivar a UF do codigo do municipio', () => {
      assert.equal(getUfDoMunicipio('5103403'), 'MT');
      assert.equal(getUfDoMunicipio('3550308'), 'SP');
      assert.equal(getUfDoMunicipio('5300108'), 'DF');
    });

    it('deve retornar undefined para codigo inexistente', () => {
      assert.equal(getUfDoMunicipio('9999999'), undefined);
    });
  });

  describe('findCodigoMunicipio', () => {
    it('deve encontrar o codigo pelo nome exato', () => {
      assert.equal(findCodigoMunicipio('MT', 'Cuiabá'), '5103403');
    });

    it('deve ignorar acentos e caixa', () => {
      assert.equal(findCodigoMunicipio('SP', 'sao paulo'), '3550308');
      assert.equal(findCodigoMunicipio('sp', 'SÃO PAULO'), '3550308');
    });

    it('deve ignorar pontuacao', () => {
      assert.equal(findCodigoMunicipio('RO', "Alta Floresta D'Oeste"), '1100015');
      assert.equal(findCodigoMunicipio('RO', 'Alta Floresta DOeste'), '1100015');
    });

    it('deve distinguir municipios homonimos pela UF', () => {
      const pi = findCodigoMunicipio('PI', 'Bom Jesus');
      const rs = findCodigoMunicipio('RS', 'Bom Jesus');
      assert.ok(pi);
      assert.ok(rs);
      assert.notEqual(pi, rs);
    });

    it('deve retornar undefined para municipio inexistente na UF', () => {
      assert.equal(findCodigoMunicipio('MT', 'Sao Paulo'), undefined);
      assert.equal(findCodigoMunicipio('XX', 'Cuiaba'), undefined);
    });
  });

  describe('getMunicipiosDaUf', () => {
    it('deve listar os municipios de MT', () => {
      const mt = getMunicipiosDaUf('MT');
      assert.equal(mt.length, 142);
      assert.ok(mt.every((m) => m.codigo.startsWith('51')));
    });

    it('deve aceitar UF em caixa baixa', () => {
      assert.equal(getMunicipiosDaUf('mt').length, getMunicipiosDaUf('MT').length);
    });

    it('deve retornar lista vazia para UF invalida', () => {
      assert.deepEqual(getMunicipiosDaUf('XX'), []);
    });
  });

  describe('PAISES', () => {
    it('deve ter o Brasil no codigo 1058', () => {
      assert.equal(getPais(CODIGO_PAIS_BRASIL), 'BRASIL');
    });

    it('deve ter a Albania com codigo numerico (bug da tabela de origem)', () => {
      assert.equal(getPais('175'), 'ALBANIA, REPUBLICA DA');
      assert.equal(PAISES['undefined'], undefined);
    });

    it('deve ter apenas codigos numericos', () => {
      const invalidos = Object.keys(PAISES).filter((c) => !/^\d+$/.test(c));
      assert.deepEqual(invalidos, []);
    });

    it('deve retornar undefined para codigo inexistente', () => {
      assert.equal(getPais('9999'), undefined);
    });
  });

  describe('MT_MUNICIPIOS (deprecado)', () => {
    it('deve continuar exportando apenas municipios de MT', () => {
      assert.ok(Object.keys(MT_MUNICIPIOS).length > 0);
      assert.ok(Object.keys(MT_MUNICIPIOS).every((c) => c.startsWith('51')));
      assert.equal(MT_MUNICIPIOS['5103403'], 'Cuiabá');
    });
  });
});
