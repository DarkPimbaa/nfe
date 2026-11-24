import { NFeProps, NFeIdentificacao } from '@nfe/domain/entities/NFe';
import { ProdutoProps } from '@nfe/domain/entities/Produto';
import { tag, tagGroup, formatNumber, formatDateOnly } from '../xml-helper';
import { totaisIbsCbsDoItem } from './ibscbs-groups';

/**
 * Bloco `total` da nota: ICMSTot, ISSQNtot, retTrib, IBSCBSTot e vNFTot.
 *
 * Os totais sao somados a partir dos itens — o caller nao precisa calcular
 * nada. Valores informados no item (`valorST`, `valorFcp`, ...) tem prioridade
 * sobre o calculo por aliquota.
 */

type Acumulado = {
  vProd: number;
  vDesc: number;
  vFrete: number;
  vSeg: number;
  vOutro: number;
  vBC: number;
  vICMS: number;
  vIPI: number;
  vPIS: number;
  vCOFINS: number;
  vBCST: number;
  vST: number;
  vFCP: number;
  vFCPST: number;
  vFCPSTRet: number;
  vICMSDeson: number;
  vFCPUFDest: number;
  vICMSUFDest: number;
  vICMSUFRemet: number;
  vII: number;
  vIPIDevol: number;
  vTotTrib: number;
  temTotTrib: boolean;
  qBCMono: number;
  vICMSMono: number;
  qBCMonoReten: number;
  vICMSMonoReten: number;
  qBCMonoRet: number;
  vICMSMonoRet: number;
  temMono: boolean;
  vIS: number;
  temIS: boolean;
  vBCIBSCBS: number;
  credPresIbs: number;
  credPresCondSusIbs: number;
  credPresCbs: number;
  credPresCondSusCbs: number;
  estornoIbs: number;
  estornoCbs: number;
  monoIbs: number;
  monoCbs: number;
  monoIbsReten: number;
  monoCbsReten: number;
  monoIbsRet: number;
  monoCbsRet: number;
  temMonoIbsCbs: boolean;
  temTribIbsCbs: boolean;
  vDifUF: number;
  vDifMun: number;
  vDifCBS: number;
  vDevUF: number;
  vDevMun: number;
  vDevCBS: number;
  vIBSUF: number;
  vIBSMun: number;
  vCBS: number;
  temIbsCbs: boolean;
  vProdLiqTot: number;
  temProdLiq: boolean;
};

function acumular(nfe: NFeProps): Acumulado {
  const a: Acumulado = {
    vProd: 0,
    vDesc: 0,
    vFrete: 0,
    vSeg: 0,
    vOutro: 0,
    vBC: 0,
    vICMS: 0,
    vIPI: 0,
    vPIS: 0,
    vCOFINS: 0,
    vBCST: 0,
    vST: 0,
    vFCP: 0,
    vFCPST: 0,
    vFCPSTRet: 0,
    vICMSDeson: 0,
    vFCPUFDest: 0,
    vICMSUFDest: 0,
    vICMSUFRemet: 0,
    vII: 0,
    vIPIDevol: 0,
    vTotTrib: 0,
    temTotTrib: false,
    qBCMono: 0,
    vICMSMono: 0,
    qBCMonoReten: 0,
    vICMSMonoReten: 0,
    qBCMonoRet: 0,
    vICMSMonoRet: 0,
    temMono: false,
    vIS: 0,
    temIS: false,
    vBCIBSCBS: 0,
    credPresIbs: 0,
    credPresCondSusIbs: 0,
    credPresCbs: 0,
    credPresCondSusCbs: 0,
    estornoIbs: 0,
    estornoCbs: 0,
    monoIbs: 0,
    monoCbs: 0,
    monoIbsReten: 0,
    monoCbsReten: 0,
    monoIbsRet: 0,
    monoCbsRet: 0,
    temMonoIbsCbs: false,
    temTribIbsCbs: false,
    vDifUF: 0,
    vDifMun: 0,
    vDifCBS: 0,
    vDevUF: 0,
    vDevMun: 0,
    vDevCBS: 0,
    vIBSUF: 0,
    vIBSMun: 0,
    vCBS: 0,
    temIbsCbs: false,
    vProdLiqTot: 0,
    temProdLiq: false
  };

  for (const prod of nfe.produtos) {
    const icms = prod.icms;

    a.vProd += prod.valorTotal;
    a.vDesc += prod.valorDesconto || 0;
    a.vFrete += prod.valorFrete || 0;
    a.vSeg += prod.valorSeguro || 0;
    a.vOutro += prod.outrasDespesas || 0;
    a.vBC += icms.baseCalculo || 0;
    a.vICMS += icms.valor || 0;
    a.vIPI += prod.ipi?.valor || 0;
    a.vPIS += prod.pis.valor || 0;
    a.vCOFINS += prod.cofins.valor || 0;
    a.vII += prod.ii?.valor || 0;
    a.vIPIDevol += prod.impostoDevolvido?.valorIpiDevolvido || 0;

    if (prod.tributosAproximados !== undefined) {
      a.vTotTrib += prod.tributosAproximados;
      a.temTotTrib = true;
    }

    const baseST = icms.baseCalculoST ?? 0;
    a.vBCST += baseST;
    a.vST += icms.valorST ?? (baseST * (icms.aliquotaST ?? 0)) / 100;
    a.vICMSDeson += icms.valorDesonerado ?? 0;

    if (icms.aliquotaFcp !== undefined) {
      const base = icms.baseCalculoFcp ?? icms.baseCalculo ?? 0;
      a.vFCP += icms.valorFcp ?? (base * icms.aliquotaFcp) / 100;
    }
    if (icms.aliquotaFcpST !== undefined) {
      const base = icms.baseCalculoFcpST ?? baseST;
      a.vFCPST += icms.valorFcpST ?? (base * icms.aliquotaFcpST) / 100;
    }
    if (icms.aliquotaFcpSTRetido !== undefined) {
      const base = icms.baseCalculoFcpSTRetido ?? icms.baseCalculoSTRetido ?? 0;
      a.vFCPSTRet += icms.valorFcpSTRetido ?? (base * icms.aliquotaFcpSTRetido) / 100;
    }

    const mono = icms.monofasico;
    if (mono) {
      a.temMono = true;
      a.qBCMono += mono.quantidade ?? 0;
      a.vICMSMono += mono.valor ?? 0;
      a.qBCMonoReten += mono.quantidadeRetencao ?? 0;
      a.vICMSMonoReten += mono.valorRetencao ?? 0;
      a.qBCMonoRet += mono.quantidadeRetido ?? 0;
      a.vICMSMonoRet += mono.valorRetido ?? 0;
    }

    const dest = prod.icmsUfDest;
    if (dest) {
      const base = dest.baseCalculo ?? prod.valorTotal;
      const partilha = dest.percentualPartilha ?? 100;
      const diferencial = (base * (dest.aliquotaInterna - dest.aliquotaInterestadual)) / 100;

      a.vICMSUFDest += (diferencial * partilha) / 100;
      a.vICMSUFRemet += diferencial - (diferencial * partilha) / 100;

      if (dest.aliquotaFcp !== undefined) {
        a.vFCPUFDest += ((dest.baseCalculoFcp ?? base) * dest.aliquotaFcp) / 100;
      }
    }

    if (prod.valorProdutoLiquido !== undefined) {
      a.temProdLiq = true;
      a.vProdLiqTot += prod.valorProdutoLiquido;
    }

    if (prod.impostoSeletivo) {
      a.temIS = true;
      a.vIS += prod.impostoSeletivo.valor;
    }

    const ibsCbs = totaisIbsCbsDoItem(prod);
    if (ibsCbs) {
      a.temIbsCbs = true;
      a.vBCIBSCBS += ibsCbs.base;
      a.vIBSUF += ibsCbs.ibsUf;
      a.vIBSMun += ibsCbs.ibsMun;
      a.vCBS += ibsCbs.cbs;
      a.vDifUF += ibsCbs.difUf;
      a.vDifMun += ibsCbs.difMun;
      a.vDifCBS += ibsCbs.difCbs;
      a.vDevUF += ibsCbs.devUf;
      a.vDevMun += ibsCbs.devMun;
      a.vDevCBS += ibsCbs.devCbs;
      a.credPresIbs += ibsCbs.credPresIbs;
      a.credPresCondSusIbs += ibsCbs.credPresCondSusIbs;
      a.credPresCbs += ibsCbs.credPresCbs;
      a.credPresCondSusCbs += ibsCbs.credPresCondSusCbs;
      a.estornoIbs += ibsCbs.estornoIbs;
      a.estornoCbs += ibsCbs.estornoCbs;
      a.monoIbs += ibsCbs.monoIbs;
      a.monoCbs += ibsCbs.monoCbs;
      a.monoIbsReten += ibsCbs.monoIbsReten;
      a.monoCbsReten += ibsCbs.monoCbsReten;
      a.monoIbsRet += ibsCbs.monoIbsRet;
      a.monoCbsRet += ibsCbs.monoCbsRet;
      a.temMonoIbsCbs = a.temMonoIbsCbs || ibsCbs.temMono;
      a.temTribIbsCbs = a.temTribIbsCbs || ibsCbs.temTributacao;
    }
  }

  return a;
}

/** ISSQNtot — totais do ISS, quando a nota tem servico. */
function buildISSQNtot(nfe: NFeProps): string {
  const tot = nfe.totaisServico;
  if (!tot) return '';

  const opcional = (v?: number): string | undefined =>
    v !== undefined ? formatNumber(v, 2) : undefined;

  return tagGroup(
    'ISSQNtot',
    tag('vServ', opcional(tot.valorServicos)) +
      tag('vBC', opcional(tot.baseCalculo)) +
      tag('vISS', opcional(tot.valorIss)) +
      tag('vPIS', opcional(tot.valorPis)) +
      tag('vCOFINS', opcional(tot.valorCofins)) +
      tag('dCompet', formatDateOnly(tot.dataCompetencia)) +
      tag('vDeducao', opcional(tot.valorDeducao)) +
      tag('vOutro', opcional(tot.outrasRetencoes)) +
      tag('vDescIncond', opcional(tot.descontoIncondicionado)) +
      tag('vDescCond', opcional(tot.descontoCondicionado)) +
      tag('vISSRet', opcional(tot.valorIssRetido)) +
      tag('cRegTrib', tot.regimeTributacao !== undefined ? String(tot.regimeTributacao) : undefined)
  );
}

/** retTrib — retencoes de tributos federais. */
function buildRetTrib(nfe: NFeProps): string {
  const ret = nfe.retencoesTributos;
  if (!ret) return '';

  const opcional = (v?: number): string | undefined =>
    v !== undefined ? formatNumber(v, 2) : undefined;

  const conteudo =
    tag('vRetPIS', opcional(ret.valorRetidoPis)) +
    tag('vRetCOFINS', opcional(ret.valorRetidoCofins)) +
    tag('vRetCSLL', opcional(ret.valorRetidoCsll)) +
    tag('vBCIRRF', opcional(ret.baseCalculoIrrf)) +
    tag('vIRRF', opcional(ret.valorIrrf)) +
    tag('vBCRetPrev', opcional(ret.baseCalculoRetencaoPrevidencia)) +
    tag('vRetPrev', opcional(ret.valorRetencaoPrevidencia));

  return conteudo ? tagGroup('retTrib', conteudo) : '';
}

/**
 * Bloco `total` completo.
 */
export function buildTotais(nfe: NFeProps): string {
  const a = acumular(nfe);

  // O ST e o FCP entram no total da nota; a desoneracao e deduzida.
  const vNF =
    a.vProd -
    a.vDesc +
    a.vFrete +
    a.vSeg +
    a.vIPI +
    a.vOutro +
    a.vST +
    a.vFCP +
    a.vFCPST +
    a.vII -
    a.vICMSDeson;

  const monofasico = !a.temMono
    ? ''
    : tag('qBCMono', formatNumber(a.qBCMono, 2)) +
      tag('vICMSMono', formatNumber(a.vICMSMono, 2)) +
      tag('qBCMonoReten', formatNumber(a.qBCMonoReten, 2)) +
      tag('vICMSMonoReten', formatNumber(a.vICMSMonoReten, 2)) +
      tag('qBCMonoRet', formatNumber(a.qBCMonoRet, 2)) +
      tag('vICMSMonoRet', formatNumber(a.vICMSMonoRet, 2));

  const icmsTot = tagGroup(
    'ICMSTot',
    tag('vBC', formatNumber(a.vBC, 2)) +
      tag('vICMS', formatNumber(a.vICMS, 2)) +
      tag('vICMSDeson', formatNumber(a.vICMSDeson, 2)) +
      tag('vFCPUFDest', formatNumber(a.vFCPUFDest, 2)) +
      tag('vICMSUFDest', formatNumber(a.vICMSUFDest, 2)) +
      tag('vICMSUFRemet', formatNumber(a.vICMSUFRemet, 2)) +
      tag('vFCP', formatNumber(a.vFCP, 2)) +
      tag('vBCST', formatNumber(a.vBCST, 2)) +
      tag('vST', formatNumber(a.vST, 2)) +
      tag('vFCPST', formatNumber(a.vFCPST, 2)) +
      tag('vFCPSTRet', formatNumber(a.vFCPSTRet, 2)) +
      monofasico +
      tag('vProd', formatNumber(a.vProd, 2)) +
      tag('vFrete', formatNumber(a.vFrete, 2)) +
      tag('vSeg', formatNumber(a.vSeg, 2)) +
      tag('vDesc', formatNumber(a.vDesc, 2)) +
      tag('vII', formatNumber(a.vII, 2)) +
      tag('vIPI', formatNumber(a.vIPI, 2)) +
      tag('vIPIDevol', formatNumber(a.vIPIDevol, 2)) +
      tag('vPIS', formatNumber(a.vPIS, 2)) +
      tag('vCOFINS', formatNumber(a.vCOFINS, 2)) +
      tag('vOutro', formatNumber(a.vOutro, 2)) +
      tag('vNF', formatNumber(vNF, 2)) +
      (a.temTotTrib ? tag('vTotTrib', formatNumber(a.vTotTrib, 2)) : '')
  );

  // IBSCBSTot: gIBS e gCBS so aparecem quando ha item tributado pelo gIBSCBS;
  // gMono quando ha monofasia; gEstornoCred quando ha estorno.
  const gIBS = !a.temTribIbsCbs
    ? ''
    : tagGroup(
        'gIBS',
        tagGroup(
          'gIBSUF',
          tag('vDif', formatNumber(a.vDifUF, 2)) +
            tag('vDevTrib', formatNumber(a.vDevUF, 2)) +
            tag('vIBSUF', formatNumber(a.vIBSUF, 2))
        ) +
          tagGroup(
            'gIBSMun',
            tag('vDif', formatNumber(a.vDifMun, 2)) +
              tag('vDevTrib', formatNumber(a.vDevMun, 2)) +
              tag('vIBSMun', formatNumber(a.vIBSMun, 2))
          ) +
          tag('vIBS', formatNumber(a.vIBSUF + a.vIBSMun, 2)) +
          tag('vCredPres', formatNumber(a.credPresIbs, 2)) +
          tag('vCredPresCondSus', formatNumber(a.credPresCondSusIbs, 2))
      );

  const gCBS = !a.temTribIbsCbs
    ? ''
    : tagGroup(
        'gCBS',
        tag('vDif', formatNumber(a.vDifCBS, 2)) +
          tag('vDevTrib', formatNumber(a.vDevCBS, 2)) +
          tag('vCBS', formatNumber(a.vCBS, 2)) +
          tag('vCredPres', formatNumber(a.credPresCbs, 2)) +
          tag('vCredPresCondSus', formatNumber(a.credPresCondSusCbs, 2))
      );

  const gMono = !a.temMonoIbsCbs
    ? ''
    : tagGroup(
        'gMono',
        tag('vIBSMono', formatNumber(a.monoIbs, 2)) +
          tag('vCBSMono', formatNumber(a.monoCbs, 2)) +
          tag('vIBSMonoReten', formatNumber(a.monoIbsReten, 2)) +
          tag('vCBSMonoReten', formatNumber(a.monoCbsReten, 2)) +
          tag('vIBSMonoRet', formatNumber(a.monoIbsRet, 2)) +
          tag('vCBSMonoRet', formatNumber(a.monoCbsRet, 2))
      );

  const gEstorno =
    a.estornoIbs === 0 && a.estornoCbs === 0
      ? ''
      : tagGroup(
          'gEstornoCred',
          tag('vIBSEstCred', formatNumber(a.estornoIbs, 2)) +
            tag('vCBSEstCred', formatNumber(a.estornoCbs, 2))
        );

  const ibsCbsTot = !a.temIbsCbs
    ? ''
    : tagGroup(
        'IBSCBSTot',
        tag('vBCIBSCBS', formatNumber(a.vBCIBSCBS, 2)) + gIBS + gCBS + gMono + gEstorno
      );

  const isTot = a.temIS ? tagGroup('ISTot', tag('vIS', formatNumber(a.vIS, 2))) : '';
  const vNFTot =
    nfe.valorTotalNota !== undefined ? tag('vNFTot', formatNumber(nfe.valorTotalNota, 2)) : '';
  const vProdLiqTot = a.temProdLiq
    ? tag('vProdLiqTot', formatNumber(a.vProdLiqTot, 2))
    : '';

  return tagGroup(
    'total',
    vProdLiqTot + icmsTot + buildISSQNtot(nfe) + buildRetTrib(nfe) + isTot + ibsCbsTot + vNFTot
  );
}

/** Tolerancia monetaria das comparacoes de totais (R$ 0,01). */
const TOLERANCIA_TOTAL = 0.01;

function difere(informado: number, calculado: number): boolean {
  return Math.abs(informado - calculado) > TOLERANCIA_TOTAL;
}

/**
 * Valor total do item (`vItem`, NT 2026.008): o valor do produto com todos os
 * tributos. IBS, CBS, IS (e a monofasia propria) so somam a partir de 2027,
 * por causa da Excecao 1 da VB01-10 (em 2025/2026 ficam de fora), e nunca em
 * importacao (CFOP iniciado por "3", Excecao 2).
 *
 * Arredonda para centavos, como a SEFAZ compara.
 */
export function calcularVItem(prod: ProdutoProps, ano: number): number {
  const icms = prod.icms;
  const somarReforma = ano >= 2027 && !prod.cfop.startsWith('3');

  let v =
    prod.valorTotal -
    (prod.valorDesconto ?? 0) +
    (prod.valorFrete ?? 0) +
    (prod.valorSeguro ?? 0) +
    (prod.outrasDespesas ?? 0) +
    (prod.ipi?.valor ?? 0) +
    (prod.ii?.valor ?? 0);

  const baseST = icms.baseCalculoST ?? 0;
  v += icms.valorST ?? (baseST * (icms.aliquotaST ?? 0)) / 100;

  if (icms.aliquotaFcp !== undefined) {
    const base = icms.baseCalculoFcp ?? icms.baseCalculo ?? 0;
    v += icms.valorFcp ?? (base * icms.aliquotaFcp) / 100;
  }
  if (icms.aliquotaFcpST !== undefined) {
    const base = icms.baseCalculoFcpST ?? baseST;
    v += icms.valorFcpST ?? (base * icms.aliquotaFcpST) / 100;
  }

  if (somarReforma) {
    const t = totaisIbsCbsDoItem(prod);
    if (t) v += t.ibsUf + t.ibsMun + t.cbs + t.monoIbs + t.monoCbs;
    if (prod.impostoSeletivo) v += prod.impostoSeletivo.valor;
  }

  return Math.round(v * 100) / 100;
}

/**
 * Soma dos `vItem` (`vNFTot`, NT 2026.008). Usa a data de emissao da nota
 * para aplicar a Excecao 1 (2025/2026) da VB01-10.
 */
export function calcularVNFTot(nfe: NFeProps): number {
  const ano = nfe.identificacao.dataEmissao?.getFullYear() ?? new Date().getFullYear();
  const soma = nfe.produtos.reduce((acc, prod) => acc + calcularVItem(prod, ano), 0);
  return Math.round(soma * 100) / 100;
}

/**
 * Confere os totais informados contra o calculado e devolve a lista de
 * divergencias (vazia = tudo certo). Espelha as regras da SEFAZ sem bloquear
 * a emissao — quem chama decide se avisa ou rejeita:
 *
 * - VB01-10 (Rej. 1105): `vItem` x calculado (com Excecoes 1 e 2);
 * - I11c-20 (Rej. 1279): `vProdLiq` = `vUnComLiq` x `qCom`;
 * - W01a (Rej. 1282/1283): `vProdLiqTot` = soma dos `vProdLiq`;
 * - `vNFTot` (`valorTotalNota`) = soma dos `vItem`.
 */
export function validarTotais(nfe: NFeProps): string[] {
  const divergencias: string[] = [];
  const id: NFeIdentificacao = nfe.identificacao;
  const ano = id.dataEmissao?.getFullYear() ?? new Date().getFullYear();

  nfe.produtos.forEach((prod, i) => {
    const rotulo = `Item ${prod.numero ?? i + 1}`;

    if (prod.valorItem !== undefined) {
      const calculado = calcularVItem(prod, ano);
      if (difere(prod.valorItem, calculado)) {
        divergencias.push(
          `${rotulo}: vItem ${formatNumber(prod.valorItem, 2)} diverge do calculado ${formatNumber(calculado, 2)} (VB01-10)`
        );
      }
    }

    if (prod.valorProdutoLiquido !== undefined && prod.valorUnitarioLiquido !== undefined) {
      const calculado = Math.round(prod.valorUnitarioLiquido * prod.quantidade * 100) / 100;
      if (difere(prod.valorProdutoLiquido, calculado)) {
        divergencias.push(
          `${rotulo}: vProdLiq ${formatNumber(prod.valorProdutoLiquido, 2)} diverge de vUnComLiq x qCom (${formatNumber(calculado, 2)}) (I11c-20)`
        );
      }
    }
  });

  const somaLiq = nfe.produtos.reduce((acc, prod) => acc + (prod.valorProdutoLiquido ?? 0), 0);
  const temLiq = nfe.produtos.some((prod) => prod.valorProdutoLiquido !== undefined);
  if (nfe.valorProdutoLiquidoTotal !== undefined && temLiq) {
    if (difere(nfe.valorProdutoLiquidoTotal, Math.round(somaLiq * 100) / 100)) {
      divergencias.push(
        `vProdLiqTot ${formatNumber(nfe.valorProdutoLiquidoTotal, 2)} diverge da soma dos vProdLiq (${formatNumber(somaLiq, 2)}) (W01a)`
      );
    }
  }

  if (nfe.valorTotalNota !== undefined) {
    const calculado = calcularVNFTot(nfe);
    if (difere(nfe.valorTotalNota, calculado)) {
      divergencias.push(
        `vNFTot ${formatNumber(nfe.valorTotalNota, 2)} diverge da soma dos vItem (${formatNumber(calculado, 2)})`
      );
    }
  }

  return divergencias;
}
