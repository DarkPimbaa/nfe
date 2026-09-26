import { ProdutoProps } from '@nfe/domain/entities/Produto';
import {
  IBSCBSProps,
  EnteTributanteProps,
  CreditoPresumidoEnteProps
} from '@nfe/domain/entities/IbsCbs';
import { tag, tagGroup, formatNumber } from '../xml-helper';

/**
 * Grupo IBSCBS do item (NT 2025.002) com os regimes especiais.
 */

/**
 * Normaliza a forma antiga (`pIBSUF`/`pIBSMun`/`pCBS`) para os entes
 * tributantes, para nao quebrar quem ja usa a API anterior.
 */
function entes(ibs: IBSCBSProps): {
  ibsUf: EnteTributanteProps;
  ibsMun: EnteTributanteProps;
  cbs: EnteTributanteProps;
} {
  return {
    ibsUf: ibs.ibsUf ?? { aliquota: ibs.pIBSUF ?? 0 },
    ibsMun: ibs.ibsMun ?? { aliquota: ibs.pIBSMun ?? 0 },
    cbs: ibs.cbs ?? { aliquota: ibs.pCBS ?? 0 }
  };
}

/**
 * Subgrupos comuns a UF, municipio e CBS: diferimento, devolucao e reducao.
 * A ordem no XSD e gDif, gDevTrib, gRed — sempre entre a aliquota e o valor.
 */
function regimesDoEnte(ente: EnteTributanteProps): string {
  const dif = ente.diferimento
    ? tagGroup(
        'gDif',
        tag('pDif', formatNumber(ente.diferimento.percentual, 4)) +
          tag('vDif', formatNumber(ente.diferimento.valor, 2))
      )
    : '';

  const devTrib =
    ente.tributoDevolvido !== undefined
      ? tagGroup('gDevTrib', tag('vDevTrib', formatNumber(ente.tributoDevolvido, 2)))
      : '';

  const red = ente.reducao
    ? tagGroup(
        'gRed',
        tag('pRedAliq', formatNumber(ente.reducao.percentualReducao, 4)) +
          tag('pAliqEfet', formatNumber(ente.reducao.aliquotaEfetiva, 4))
      )
    : '';

  return dif + devTrib + red;
}

/**
 * Valor do tributo do ente: o informado, ou base x aliquota efetiva (quando ha
 * reducao) ou base x aliquota.
 */
function valorDoEnte(ente: EnteTributanteProps, base: number): number {
  if (ente.valor !== undefined) return ente.valor;

  const aliquota = ente.reducao?.aliquotaEfetiva ?? ente.aliquota;

  return (aliquota / 100) * base;
}

/** gIBSUF, gIBSMun ou gCBS. */
function grupoEnte(
  nome: 'gIBSUF' | 'gIBSMun' | 'gCBS',
  tagAliquota: 'pIBSUF' | 'pIBSMun' | 'pCBS',
  tagValor: 'vIBSUF' | 'vIBSMun' | 'vCBS',
  ente: EnteTributanteProps,
  base: number
): string {
  return tagGroup(
    nome,
    tag(tagAliquota, formatNumber(ente.aliquota, 4)) +
      regimesDoEnte(ente) +
      tag(tagValor, formatNumber(valorDoEnte(ente, base), 2))
  );
}

/** gIBSCredPres / gCBSCredPres. */
function creditoPresumidoEnte(
  nome: 'gIBSCredPres' | 'gCBSCredPres',
  credito?: CreditoPresumidoEnteProps
): string {
  if (!credito) return '';

  // vCredPres e vCredPresCondSus sao exclusivos no XSD.
  const valor =
    credito.valorCondicaoSuspensiva !== undefined
      ? tag('vCredPresCondSus', formatNumber(credito.valorCondicaoSuspensiva, 2))
      : tag('vCredPres', formatNumber(credito.valor ?? 0, 2));

  return tagGroup(nome, tag('pCredPres', formatNumber(credito.percentual, 4)) + valor);
}

/** gIBSCBSMono — tributacao monofasica. */
function monofasia(ibs: IBSCBSProps): string {
  const mono = ibs.monofasia;
  if (!mono) return '';

  const padrao = mono.padrao
    ? tagGroup(
        'gMonoPadrao',
        tag('qBCMono', formatNumber(mono.padrao.quantidade, 4)) +
          tag('adRemIBS', formatNumber(mono.padrao.aliquotaIbs, 4)) +
          tag('adRemCBS', formatNumber(mono.padrao.aliquotaCbs, 4)) +
          tag('vIBSMono', formatNumber(mono.padrao.valorIbs, 2)) +
          tag('vCBSMono', formatNumber(mono.padrao.valorCbs, 2))
      )
    : '';

  const reten = mono.retencao
    ? tagGroup(
        'gMonoReten',
        tag('qBCMonoReten', formatNumber(mono.retencao.quantidade, 4)) +
          tag('adRemIBSReten', formatNumber(mono.retencao.aliquotaIbs, 4)) +
          tag('vIBSMonoReten', formatNumber(mono.retencao.valorIbs, 2)) +
          tag('adRemCBSReten', formatNumber(mono.retencao.aliquotaCbs, 4)) +
          tag('vCBSMonoReten', formatNumber(mono.retencao.valorCbs, 2))
      )
    : '';

  const ret = mono.retidoAnteriormente
    ? tagGroup(
        'gMonoRet',
        tag('qBCMonoRet', formatNumber(mono.retidoAnteriormente.quantidade, 4)) +
          tag('adRemIBSRet', formatNumber(mono.retidoAnteriormente.aliquotaIbs, 4)) +
          tag('vIBSMonoRet', formatNumber(mono.retidoAnteriormente.valorIbs, 2)) +
          tag('adRemCBSRet', formatNumber(mono.retidoAnteriormente.aliquotaCbs, 4)) +
          tag('vCBSMonoRet', formatNumber(mono.retidoAnteriormente.valorCbs, 2))
      )
    : '';

  const dif = mono.diferimento
    ? tagGroup(
        'gMonoDif',
        tag('pDifIBS', formatNumber(mono.diferimento.percentualIbs, 4)) +
          tag('vIBSMonoDif', formatNumber(mono.diferimento.valorIbs, 2)) +
          tag('pDifCBS', formatNumber(mono.diferimento.percentualCbs, 4)) +
          tag('vCBSMonoDif', formatNumber(mono.diferimento.valorCbs, 2))
      )
    : '';

  return tagGroup(
    'gIBSCBSMono',
    padrao +
      reten +
      ret +
      dif +
      tag('vTotIBSMonoItem', formatNumber(mono.totalIbs, 2)) +
      tag('vTotCBSMonoItem', formatNumber(mono.totalCbs, 2))
  );
}

/**
 * Grupo `IBSCBS` do item.
 */
export function buildIBSCBS(prod: ProdutoProps): string {
  const ibs = prod.ibsCbs;
  if (!ibs) return '';

  const base = ibs.baseCalculo ?? prod.valorTotal;
  const { ibsUf, ibsMun, cbs } = entes(ibs);

  // gIBSCBS, gIBSCBSMono, gTransfCred e gAjusteCompet sao alternativos.
  let principal: string;

  if (ibs.monofasia) {
    principal = monofasia(ibs);
  } else if (ibs.transferenciaCredito) {
    principal = tagGroup(
      'gTransfCred',
      tag('vIBS', formatNumber(ibs.transferenciaCredito.valorIbs, 2)) +
        tag('vCBS', formatNumber(ibs.transferenciaCredito.valorCbs, 2))
    );
  } else if (ibs.ajusteCompetencia) {
    principal = tagGroup(
      'gAjusteCompet',
      tag('competApur', ibs.ajusteCompetencia.competencia) +
        tag('vIBS', formatNumber(ibs.ajusteCompetencia.valorIbs, 2)) +
        tag('vCBS', formatNumber(ibs.ajusteCompetencia.valorCbs, 2))
    );
  } else {
    const vIbsUf = valorDoEnte(ibsUf, base);
    const vIbsMun = valorDoEnte(ibsMun, base);

    const tribRegular = ibs.tributacaoRegular
      ? tagGroup(
          'gTribRegular',
          tag('CSTReg', ibs.tributacaoRegular.cst) +
            tag('cClassTribReg', ibs.tributacaoRegular.cClassTrib) +
            tag('pAliqEfetRegIBSUF', formatNumber(ibs.tributacaoRegular.aliquotaEfetivaIbsUf, 4)) +
            tag('vTribRegIBSUF', formatNumber(ibs.tributacaoRegular.valorIbsUf, 2)) +
            tag(
              'pAliqEfetRegIBSMun',
              formatNumber(ibs.tributacaoRegular.aliquotaEfetivaIbsMun, 4)
            ) +
            tag('vTribRegIBSMun', formatNumber(ibs.tributacaoRegular.valorIbsMun, 2)) +
            tag('pAliqEfetRegCBS', formatNumber(ibs.tributacaoRegular.aliquotaEfetivaCbs, 4)) +
            tag('vTribRegCBS', formatNumber(ibs.tributacaoRegular.valorCbs, 2))
        )
      : '';

    const tribCompraGov = ibs.tributacaoCompraGov
      ? tagGroup(
          'gTribCompraGov',
          tag('pAliqIBSUF', formatNumber(ibs.tributacaoCompraGov.aliquotaIbsUf, 4)) +
            tag('vTribIBSUF', formatNumber(ibs.tributacaoCompraGov.valorIbsUf, 2)) +
            tag('pAliqIBSMun', formatNumber(ibs.tributacaoCompraGov.aliquotaIbsMun, 4)) +
            tag('vTribIBSMun', formatNumber(ibs.tributacaoCompraGov.valorIbsMun, 2)) +
            tag('pAliqCBS', formatNumber(ibs.tributacaoCompraGov.aliquotaCbs, 4)) +
            tag('vTribCBS', formatNumber(ibs.tributacaoCompraGov.valorCbs, 2))
        )
      : '';

    principal = tagGroup(
      'gIBSCBS',
      tag('vBC', formatNumber(base, 2)) +
        grupoEnte('gIBSUF', 'pIBSUF', 'vIBSUF', ibsUf, base) +
        grupoEnte('gIBSMun', 'pIBSMun', 'vIBSMun', ibsMun, base) +
        tag('vIBS', formatNumber(vIbsUf + vIbsMun, 2)) +
        grupoEnte('gCBS', 'pCBS', 'vCBS', cbs, base) +
        tribRegular +
        tribCompraGov
    );
  }

  const estorno = ibs.estornoCredito
    ? tagGroup(
        'gEstornoCred',
        tag('vIBSEstCred', formatNumber(ibs.estornoCredito.valorIbs, 2)) +
          tag('vCBSEstCred', formatNumber(ibs.estornoCredito.valorCbs, 2))
      )
    : '';

  // gCredPresOper e gCredPresIBSZFM sao alternativos.
  const credito = ibs.creditoPresumido
    ? tagGroup(
        'gCredPresOper',
        tag('vBCCredPres', formatNumber(ibs.creditoPresumido.baseCalculo, 2)) +
          tag('cCredPres', ibs.creditoPresumido.codigo) +
          creditoPresumidoEnte('gIBSCredPres', ibs.creditoPresumido.ibs) +
          creditoPresumidoEnte('gCBSCredPres', ibs.creditoPresumido.cbs)
      )
    : ibs.creditoPresumidoZfm
      ? tagGroup(
          'gCredPresIBSZFM',
          tag('competApur', ibs.creditoPresumidoZfm.competencia) +
            tag('tpCredPresIBSZFM', ibs.creditoPresumidoZfm.tipo) +
            tag('vCredPresIBSZFM', formatNumber(ibs.creditoPresumidoZfm.valor, 2))
        )
      : '';

  return tagGroup(
    'IBSCBS',
    tag('CST', ibs.cst) +
      tag('cClassTrib', ibs.cClassTrib) +
      tag('indDoacao', ibs.doacao ? '1' : undefined) +
      principal +
      estorno +
      credito
  );
}

/**
 * Numeros de IBS/CBS de um item, para compor o `IBSCBSTot` da nota.
 */
export type TotaisIbsCbsItem = {
  base: number;
  ibsUf: number;
  ibsMun: number;
  cbs: number;
  difUf: number;
  difMun: number;
  difCbs: number;
  devUf: number;
  devMun: number;
  devCbs: number;
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
  temMono: boolean;
  /** O grupo gIBS/gCBS do total so existe quando o item usa o gIBSCBS. */
  temTributacao: boolean;
};

export function totaisIbsCbsDoItem(prod: ProdutoProps): TotaisIbsCbsItem | null {
  const ibs = prod.ibsCbs;
  if (!ibs) return null;

  const base = ibs.baseCalculo ?? prod.valorTotal;
  const { ibsUf, ibsMun, cbs } = entes(ibs);
  const mono = ibs.monofasia;
  const cred = ibs.creditoPresumido;

  // gTransfCred e gAjusteCompet nao entram nos totais de tributacao.
  const temTributacao = !mono && !ibs.transferenciaCredito && !ibs.ajusteCompetencia;

  return {
    base: temTributacao ? base : 0,
    ibsUf: temTributacao ? valorDoEnte(ibsUf, base) : 0,
    ibsMun: temTributacao ? valorDoEnte(ibsMun, base) : 0,
    cbs: temTributacao ? valorDoEnte(cbs, base) : 0,
    difUf: temTributacao ? (ibsUf.diferimento?.valor ?? 0) : 0,
    difMun: temTributacao ? (ibsMun.diferimento?.valor ?? 0) : 0,
    difCbs: temTributacao ? (cbs.diferimento?.valor ?? 0) : 0,
    devUf: temTributacao ? (ibsUf.tributoDevolvido ?? 0) : 0,
    devMun: temTributacao ? (ibsMun.tributoDevolvido ?? 0) : 0,
    devCbs: temTributacao ? (cbs.tributoDevolvido ?? 0) : 0,
    credPresIbs: cred?.ibs?.valor ?? 0,
    credPresCondSusIbs: cred?.ibs?.valorCondicaoSuspensiva ?? 0,
    credPresCbs: cred?.cbs?.valor ?? 0,
    credPresCondSusCbs: cred?.cbs?.valorCondicaoSuspensiva ?? 0,
    estornoIbs: ibs.estornoCredito?.valorIbs ?? 0,
    estornoCbs: ibs.estornoCredito?.valorCbs ?? 0,
    monoIbs: mono?.padrao?.valorIbs ?? 0,
    monoCbs: mono?.padrao?.valorCbs ?? 0,
    monoIbsReten: mono?.retencao?.valorIbs ?? 0,
    monoCbsReten: mono?.retencao?.valorCbs ?? 0,
    monoIbsRet: mono?.retidoAnteriormente?.valorIbs ?? 0,
    monoCbsRet: mono?.retidoAnteriormente?.valorCbs ?? 0,
    temMono: Boolean(mono),
    temTributacao
  };
}
