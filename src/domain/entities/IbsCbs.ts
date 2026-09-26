/**
 * Grupo IBS/CBS do item (tipo TTribNFe), da reforma tributaria do consumo
 * (EC 132/2023, LC 214/2025, NT 2025.002).
 *
 * A tributacao normal usa `gIBSCBS`. Os regimes especiais entram como
 * subgrupos: diferimento (`gDif`), reducao de aliquota (`gRed`), devolucao de
 * tributo (`gDevTrib`), tributacao regular de comparacao (`gTribRegular`) e
 * compra governamental (`gTribCompraGov`).
 *
 * Alternativas ao `gIBSCBS`, mutuamente exclusivas: monofasia
 * (`gIBSCBSMono`), transferencia de credito (`gTransfCred`) e ajuste de
 * competencia (`gAjusteCompet`).
 */

/** gDif — diferimento do tributo. */
export type DiferimentoIbsCbsProps = {
  /** pDif — percentual diferido. */
  readonly percentual: number;
  /** vDif — valor diferido. */
  readonly valor: number;
};

/** gRed — reducao de aliquota. */
export type ReducaoIbsCbsProps = {
  /** pRedAliq — percentual de reducao. */
  readonly percentualReducao: number;
  /** pAliqEfet — aliquota efetiva depois da reducao. */
  readonly aliquotaEfetiva: number;
};

/**
 * Um ente tributante do IBS/CBS (UF, municipio ou CBS) com seus regimes.
 */
export type EnteTributanteProps = {
  /** Aliquota do ente (pIBSUF, pIBSMun ou pCBS). */
  readonly aliquota: number;
  readonly diferimento?: DiferimentoIbsCbsProps;
  /** gDevTrib — vDevTrib, valor do tributo devolvido. */
  readonly tributoDevolvido?: number;
  readonly reducao?: ReducaoIbsCbsProps;
  /** Valor do tributo. Calculado a partir da base e da aliquota quando ausente. */
  readonly valor?: number;
};

/** gTribRegular — tributacao que seria devida no regime regular. */
export type TributacaoRegularProps = {
  /** CSTReg */
  readonly cst: string;
  /** cClassTribReg */
  readonly cClassTrib: string;
  readonly aliquotaEfetivaIbsUf: number;
  readonly valorIbsUf: number;
  readonly aliquotaEfetivaIbsMun: number;
  readonly valorIbsMun: number;
  readonly aliquotaEfetivaCbs: number;
  readonly valorCbs: number;
};

/** gTribCompraGov — tributacao na compra governamental. */
export type TributacaoCompraGovProps = {
  readonly aliquotaIbsUf: number;
  readonly valorIbsUf: number;
  readonly aliquotaIbsMun: number;
  readonly valorIbsMun: number;
  readonly aliquotaCbs: number;
  readonly valorCbs: number;
};

/** gMonoPadrao — monofasia padrao. */
export type MonofasiaPadraoProps = {
  /** qBCMono — quantidade tributada. */
  readonly quantidade: number;
  /** adRemIBS — aliquota ad rem do IBS. */
  readonly aliquotaIbs: number;
  /** adRemCBS — aliquota ad rem da CBS. */
  readonly aliquotaCbs: number;
  readonly valorIbs: number;
  readonly valorCbs: number;
};

/** gMonoReten — monofasia com retencao. */
export type MonofasiaRetencaoProps = {
  readonly quantidade: number;
  readonly aliquotaIbs: number;
  readonly valorIbs: number;
  readonly aliquotaCbs: number;
  readonly valorCbs: number;
};

/** gMonoDif — monofasia com diferimento. */
export type MonofasiaDiferimentoProps = {
  readonly percentualIbs: number;
  readonly valorIbs: number;
  readonly percentualCbs: number;
  readonly valorCbs: number;
};

/** gIBSCBSMono — tributacao monofasica de IBS/CBS. */
export type MonofasiaIbsCbsProps = {
  readonly padrao?: MonofasiaPadraoProps;
  readonly retencao?: MonofasiaRetencaoProps;
  /** gMonoRet — imposto retido anteriormente. */
  readonly retidoAnteriormente?: MonofasiaRetencaoProps;
  readonly diferimento?: MonofasiaDiferimentoProps;
  /** vTotIBSMonoItem — total do IBS monofasico do item. */
  readonly totalIbs: number;
  /** vTotCBSMonoItem — total da CBS monofasica do item. */
  readonly totalCbs: number;
};

/** gTransfCred — transferencia de credito. */
export type TransferenciaCreditoProps = {
  readonly valorIbs: number;
  readonly valorCbs: number;
};

/** gAjusteCompet — ajuste de competencia. */
export type AjusteCompetenciaProps = {
  /** competApur — competencia de apuracao, no formato AAAA-MM. */
  readonly competencia: string;
  readonly valorIbs: number;
  readonly valorCbs: number;
};

/** gEstornoCred — estorno de credito. */
export type EstornoCreditoProps = {
  readonly valorIbs: number;
  readonly valorCbs: number;
};

/** gIBSCredPres / gCBSCredPres — credito presumido de um ente. */
export type CreditoPresumidoEnteProps = {
  /** pCredPres — percentual do credito presumido. */
  readonly percentual: number;
  /** vCredPres — valor do credito. Exclusivo com `valorCondicaoSuspensiva`. */
  readonly valor?: number;
  /** vCredPresCondSus — valor sob condicao suspensiva. */
  readonly valorCondicaoSuspensiva?: number;
};

/** gCredPresOper — credito presumido da operacao. */
export type CreditoPresumidoOperacaoProps = {
  /** vBCCredPres — base de calculo do credito presumido. */
  readonly baseCalculo: number;
  /** cCredPres — codigo do credito presumido. */
  readonly codigo: string;
  readonly ibs?: CreditoPresumidoEnteProps;
  readonly cbs?: CreditoPresumidoEnteProps;
};

/** gCredPresIBSZFM — credito presumido de IBS na Zona Franca de Manaus. */
export type CreditoPresumidoZfmProps = {
  /** competApur — competencia de apuracao (AAAA-MM). */
  readonly competencia: string;
  /** tpCredPresIBSZFM — tipo do credito presumido. */
  readonly tipo: string;
  /** vCredPresIBSZFM — valor do credito. */
  readonly valor: number;
};

/**
 * Grupo IBSCBS completo do item.
 *
 * Retrocompatibilidade: a forma antiga (`pIBSUF`, `pIBSMun`, `pCBS` no nivel
 * de cima) continua valendo e e convertida internamente para `ibsUf`, `ibsMun`
 * e `cbs`.
 */
export type IBSCBSProps = {
  /** CST do IBS/CBS. */
  readonly cst: string;
  /** cClassTrib — classificacao tributaria (6 digitos). */
  readonly cClassTrib: string;
  /** indDoacao — marca a operacao como doacao. */
  readonly doacao?: boolean;

  /** Base de calculo do grupo. Default: o valor total do item. */
  readonly baseCalculo?: number;

  /** @deprecated Use `ibsUf.aliquota`. */
  readonly pIBSUF?: number;
  /** @deprecated Use `ibsMun.aliquota`. */
  readonly pIBSMun?: number;
  /** @deprecated Use `cbs.aliquota`. */
  readonly pCBS?: number;

  readonly ibsUf?: EnteTributanteProps;
  readonly ibsMun?: EnteTributanteProps;
  readonly cbs?: EnteTributanteProps;

  readonly tributacaoRegular?: TributacaoRegularProps;
  readonly tributacaoCompraGov?: TributacaoCompraGovProps;

  /** Alternativa ao gIBSCBS: tributacao monofasica. */
  readonly monofasia?: MonofasiaIbsCbsProps;
  /** Alternativa ao gIBSCBS: transferencia de credito. */
  readonly transferenciaCredito?: TransferenciaCreditoProps;
  /** Alternativa ao gIBSCBS: ajuste de competencia. */
  readonly ajusteCompetencia?: AjusteCompetenciaProps;

  readonly estornoCredito?: EstornoCreditoProps;
  readonly creditoPresumido?: CreditoPresumidoOperacaoProps;
  readonly creditoPresumidoZfm?: CreditoPresumidoZfmProps;
};
