import type { NFeProps } from './entities/NFe';

/**
 * CFOPs de devolucao (indDevol = 1 na Tabela de CFOP oficial, IT 2023.002).
 *
 * Entradas (1/2/3xxx): devolucao de venda. Saidas (5/6/7xxx): devolucao de
 * compra. A regra I08-140 (Rej. 327, NT 2026.009) so aceita estes CFOPs em
 * NF-e de devolucao (finNFe = 4) e em notas de credito de retorno (motivos
 * 03 e 06) — com as excecoes abaixo.
 */
const CFOP_DEVOLUCAO_ENTRADA = [
  '1201', '1202', '1203', '1204', '1208', '1209', '1212', '1213', '1214', '1215', '1216',
  '1410', '1411',
  '1503', '1504', '1505', '1506', '1553',
  '1660', '1661', '1662',
  '1918', '1919',
  '2201', '2202', '2203', '2204', '2208', '2209', '2212', '2213', '2214', '2215', '2216',
  '2410', '2411',
  '2503', '2504', '2505', '2506', '2553',
  '2660', '2661', '2662',
  '2918', '2919',
  '3201', '3202', '3211', '3212', '3503', '3553'
];

const CFOP_DEVOLUCAO_SAIDA = [
  '5201', '5202', '5208', '5209', '5210', '5213', '5214', '5215', '5216',
  '5410', '5411', '5412', '5413',
  '5503', '5553', '5555', '5556',
  '5660', '5661', '5662',
  '5918', '5919', '5921',
  '6201', '6202', '6208', '6209', '6210', '6213', '6214', '6215', '6216',
  '6410', '6411', '6412', '6413',
  '6503', '6553', '6555', '6556',
  '6660', '6661', '6662',
  '6918', '6919', '6921',
  '7201', '7202', '7210', '7211', '7212', '7553', '7556'
];

/** Todos os CFOPs com indDevol = 1 (entradas + saidas). */
export const CFOP_DEVOLUCAO: ReadonlySet<string> = new Set([
  ...CFOP_DEVOLUCAO_ENTRADA,
  ...CFOP_DEVOLUCAO_SAIDA
]);

export function isCFOPDevolucao(cfop: string): boolean {
  return CFOP_DEVOLUCAO.has(cfop);
}

/**
 * Outra entrada nao especificada (NT 2026.009): 1949/2949 sao aceitos em
 * todas as situacoes da I08-140, pois nem todo CFOP de saida tem par de
 * devolucao correspondente.
 */
export const CFOP_ENTRADA_NAO_ESPECIFICADA: readonly string[] = ['1949', '2949'];

/**
 * Devolucao de embalagens (VC02-14, NT 2025.002 v1.53): com estes CFOPs, a
 * devolucao nao precisa referenciar documento (nem no cabecalho, nem no item),
 * pois nao ha operacao de venda correspondente.
 */
export const CFOP_EMBALAGEM_SEM_REF: readonly string[] = ['5921', '6921'];

/** NCM do gas natural (excecao 2 da NT 2026.009 para 5949/6949). */
export const NCM_GAS_NATURAL = '27112100';

/** CFOPs da devolucao simbolica de gas natural (so com o NCM acima). */
export const CFOP_DEVOLUCAO_SIMBOLICA_GAS: readonly string[] = ['5949', '6949'];

function cfopAceitoNaDevolucao(cfop: string, ncm?: string): boolean {
  if (isCFOPDevolucao(cfop)) return true;
  if (CFOP_ENTRADA_NAO_ESPECIFICADA.includes(cfop)) return true;
  if (CFOP_DEVOLUCAO_SIMBOLICA_GAS.includes(cfop) && ncm === NCM_GAS_NATURAL) return true;
  return false;
}

/**
 * I08-140 (Rej. 327, NT 2026.009): devolucao (finNFe = 4) e notas de credito
 * de retorno (tpNFCredito 03 e 06) so aceitam CFOP de devolucao.
 */
export function errosI08_140(nfe: NFeProps): string[] {
  const id = nfe.identificacao;
  if (!id) return [];
  const ehRetorno =
    id.finalidade === 4 ||
    (id.finalidade === 5 && (id.tipoNotaCredito === '03' || id.tipoNotaCredito === '06'));
  if (!ehRetorno) return [];

  const erros: string[] = [];
  (nfe.produtos ?? []).forEach((prod, i) => {
    if (!cfopAceitoNaDevolucao(prod.cfop, prod.ncm)) {
      erros.push(
        `Item ${prod.numero ?? i + 1}: CFOP ${prod.cfop} invalido para devolucao/retorno (I08-140, Rej. 327)`
      );
    }
  });
  return erros;
}

/**
 * B25-40 (Rej. 255): complementar (finNFe = 2), devolucao (finNFe = 4) e
 * notas de credito 01/03/04 referenciam no maximo UMA NF-e no cabecalho.
 */
export function errosB25_40(nfe: NFeProps): string[] {
  const id = nfe.identificacao;
  if (!id) return [];
  const exigeRefUnica =
    id.finalidade === 2 ||
    id.finalidade === 4 ||
    (id.finalidade === 5 &&
      (id.tipoNotaCredito === '01' ||
        id.tipoNotaCredito === '03' ||
        id.tipoNotaCredito === '04'));
  if (!exigeRefUnica) return [];

  const refs = (id.notasReferenciadas ?? []).filter(
    (r) => r.tipo === 'nfe' || r.tipo === 'nfeSigilosa'
  );
  if (refs.length > 1) {
    return [
      `Devolucao/complementar/credito referencia ${refs.length} NF-e no cabecalho, maximo 1 (B25-40, Rej. 255)`
    ];
  }
  return [];
}

/**
 * VC02-14 (Rej. 321) e VC02-05 (Rej. 1010), NT 2025.002 v1.53: na devolucao, a
 * chave vai no cabecalho (refNFe) OU no item (DFeReferenciado) — nunca nos
 * dois. Embalagens (5921/6921) dispensam a referencia.
 */
export function errosVC02_14(nfe: NFeProps): string[] {
  const id = nfe.identificacao;
  if (!id || id.finalidade !== 4) return [];

  const temRefCabecalho = (id.notasReferenciadas ?? []).some(
    (r) => r.tipo === 'nfe' || r.tipo === 'nfeSigilosa'
  );
  const temRefItem = (nfe.produtos ?? []).some((p) => p?.dfeReferenciado !== undefined);
  const soEmbalagem =
    (nfe.produtos ?? []).length > 0 &&
    (nfe.produtos ?? []).every((p) => CFOP_EMBALAGEM_SEM_REF.includes(p.cfop));

  if (temRefCabecalho && temRefItem) {
    return [
      'Referencia no cabecalho (refNFe) e no item (DFeReferenciado) ao mesmo tempo (VC02-05, Rej. 1010)'
    ];
  }
  if (!temRefCabecalho && !temRefItem && !soEmbalagem) {
    return [
      'Devolucao sem documento referenciado no cabecalho (refNFe) nem no item (DFeReferenciado) (VC02-14, Rej. 321)'
    ];
  }
  return [];
}

/** Todas as regras de devolucao/referenciamento (Fase 5). Vazio = tudo certo. */
export function errosDevolucao(nfe: NFeProps): string[] {
  return [...errosI08_140(nfe), ...errosB25_40(nfe), ...errosVC02_14(nfe)];
}
