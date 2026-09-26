import { UF_CODES, stripAccents } from '@brasil-fiscal/core';
import { MUNICIPIOS } from './municipios';
import { PAISES } from './paises';

export { UF_CODES } from '@brasil-fiscal/core';
export { MUNICIPIOS } from './municipios';
export { PAISES } from './paises';

/**
 * Codigo do Brasil na tabela de paises (campo cPais). Padrao para enderecos nacionais.
 */
export const CODIGO_PAIS_BRASIL = '1058';

const UF_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(UF_CODES).map(([uf, codigo]) => [codigo, uf])
);

/**
 * Normaliza um nome de municipio para comparacao: sem acentos, sem pontuacao,
 * caixa alta e espacos colapsados. 'Sao Jose dos Quatro Marcos' e
 * 'SÃO JOSÉ DOS  QUATRO MARCOS' viram a mesma chave.
 */
function normalizeNome(nome: string): string {
  return stripAccents(nome)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let nomeIndex: Map<string, string> | null = null;

/**
 * Indice `UF|NOME_NORMALIZADO` -> codigo IBGE, construido na primeira busca por
 * nome. Municipios homonimos existem entre UFs diferentes (Bom Jesus, por
 * exemplo), por isso a UF faz parte da chave.
 */
function getNomeIndex(): Map<string, string> {
  if (nomeIndex) return nomeIndex;

  const index = new Map<string, string>();
  for (const [codigo, nome] of Object.entries(MUNICIPIOS)) {
    const uf = UF_BY_CODE[codigo.slice(0, 2)];
    if (!uf) continue;
    index.set(`${uf}|${normalizeNome(nome)}`, codigo);
  }

  nomeIndex = index;
  return index;
}

/**
 * Nome do municipio a partir do codigo IBGE de 7 digitos.
 */
export function getMunicipio(codigo: string): string | undefined {
  return MUNICIPIOS[codigo];
}

/**
 * UF do municipio, derivada dos dois primeiros digitos do codigo IBGE.
 * Retorna undefined se o codigo nao existir na tabela.
 */
export function getUfDoMunicipio(codigo: string): string | undefined {
  if (!MUNICIPIOS[codigo]) return undefined;
  return UF_BY_CODE[codigo.slice(0, 2)];
}

/**
 * Codigo IBGE a partir da UF e do nome do municipio. A comparacao ignora
 * acentos, caixa e pontuacao.
 */
export function findCodigoMunicipio(uf: string, nome: string): string | undefined {
  return getNomeIndex().get(`${uf.toUpperCase()}|${normalizeNome(nome)}`);
}

/**
 * Lista os municipios de uma UF, em ordem de codigo IBGE.
 */
export function getMunicipiosDaUf(uf: string): Array<{ codigo: string; nome: string }> {
  const codigoUf = UF_CODES[uf.toUpperCase()];
  if (!codigoUf) return [];

  return Object.entries(MUNICIPIOS)
    .filter(([codigo]) => codigo.startsWith(codigoUf))
    .map(([codigo, nome]) => ({ codigo, nome }));
}

/**
 * Nome do pais a partir do codigo da tabela BACEN (campo cPais).
 */
export function getPais(codigo: string): string | undefined {
  return PAISES[codigo];
}

/**
 * Municipios do Mato Grosso.
 *
 * @deprecated Use `MUNICIPIOS` (tabela nacional completa) ou `getMunicipiosDaUf('MT')`.
 */
export const MT_MUNICIPIOS: Record<string, string> = Object.fromEntries(
  Object.entries(MUNICIPIOS).filter(([codigo]) => codigo.startsWith('51'))
);
