import {
  DeclaracaoImportacaoProps,
  DetalheExportacaoProps,
  RastroProps,
  CreditoPresumidoProps,
  VeiculoNovoProps,
  MedicamentoProps,
  ArmamentoProps,
  CombustivelProps,
  ProdutoNFFProps,
  EmbalagemProps,
  ImpostoDevolvidoProps,
  DFeReferenciadoProps,
  ObservacaoItemProps
} from './ProdutoDetalhes';
import { IBSCBSProps } from './IbsCbs';

/**
 * ICMS do item.
 *
 * Os campos basicos (`cst`/`csosn`, `baseCalculo`, `aliquota`, `valor`) atendem
 * as operacoes tributadas e isentas. Os demais so sao emitidos quando
 * informados, conforme o grupo exigido por cada CST/CSOSN:
 *
 * - ST proprio (CST 10/30/70/90, CSOSN 201/202/203/900): campos `*ST`
 * - ST retido anteriormente (CST 60, CSOSN 500): campos `*STRetido`
 * - desoneracao (CST 20/30/40/41/50/70/90): `valorDesonerado` + `motivoDesoneracao`
 * - diferimento (CST 51): `percentualDiferimento`
 * - partilha entre UFs (ICMSPart): `percentualBaseOperacaoPropria` + `ufSt`
 */
export type ICMSProps = {
  readonly origem: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly cst?: string;
  readonly csosn?: string;
  /** pICMS */
  readonly aliquota?: number;
  /** vBC */
  readonly baseCalculo?: number;
  /** vICMS */
  readonly valor?: number;

  /** modBC — 0 margem agregada, 1 pauta, 2 preco tabelado, 3 valor da operacao (default). */
  readonly modalidadeBaseCalculo?: 0 | 1 | 2 | 3;
  /** pRedBC */
  readonly percentualReducaoBase?: number;

  /** vBCFCP — base do Fundo de Combate a Pobreza. Default: a base do ICMS. */
  readonly baseCalculoFcp?: number;
  /** pFCP */
  readonly aliquotaFcp?: number;
  /** vFCP. Calculado a partir da base e da aliquota quando ausente. */
  readonly valorFcp?: number;

  /** modBCST — 0 preco tabelado, 1 lista negativa, 2 positiva, 3 neutra, 4 MVA (default), 5 pauta. */
  readonly modalidadeBaseCalculoST?: 0 | 1 | 2 | 3 | 4 | 5;
  /** pMVAST */
  readonly percentualMva?: number;
  /** pRedBCST */
  readonly percentualReducaoBaseST?: number;
  /** vBCST */
  readonly baseCalculoST?: number;
  /** pICMSST */
  readonly aliquotaST?: number;
  /** vICMSST. Calculado a partir da base e da aliquota quando ausente. */
  readonly valorST?: number;
  /** vBCFCPST */
  readonly baseCalculoFcpST?: number;
  /** pFCPST */
  readonly aliquotaFcpST?: number;
  /** vFCPST. Calculado a partir da base e da aliquota quando ausente. */
  readonly valorFcpST?: number;

  /** vBCSTRet — base do ST retido na operacao anterior. */
  readonly baseCalculoSTRetido?: number;
  /** pST — aliquota suportada pelo consumidor final. */
  readonly aliquotaSTConsumidorFinal?: number;
  /** vICMSSTRet */
  readonly valorSTRetido?: number;
  /** vICMSSubstituto */
  readonly valorSubstituto?: number;
  /** vBCFCPSTRet */
  readonly baseCalculoFcpSTRetido?: number;
  /** pFCPSTRet */
  readonly aliquotaFcpSTRetido?: number;
  /** vFCPSTRet */
  readonly valorFcpSTRetido?: number;

  /** vICMSDeson */
  readonly valorDesonerado?: number;
  /** motDesICMS — motivo da desoneracao (tabela da SEFAZ). */
  readonly motivoDesoneracao?: number;

  /** pDif — percentual do diferimento (CST 51). */
  readonly percentualDiferimento?: number;

  /** pCredSN — aliquota de credito do Simples Nacional (CSOSN 101/201/900). */
  readonly aliquotaCreditoSN?: number;
  /** vCredICMSSN. Calculado a partir da base e da aliquota quando ausente. */
  readonly valorCreditoSN?: number;

  /** pBCOp — percentual da BC da operacao propria (ICMSPart). */
  readonly percentualBaseOperacaoPropria?: number;
  /** UFST — UF para quem o ST e devido (ICMSPart / ICMSST). */
  readonly ufSt?: string;

  /** cBenefRBC — codigo do beneficio da reducao de base (CST 51). */
  readonly codigoBeneficioReducaoBase?: string;
  /** vICMSOp — valor do ICMS da operacao antes do diferimento (CST 51). */
  readonly valorOperacao?: number;
  /** pFCPDif / vFCPDif / vFCPEfet — FCP diferido (CST 51). */
  readonly percentualFcpDiferido?: number;
  readonly valorFcpDiferido?: number;
  readonly valorFcpEfetivo?: number;

  /** indDeduzDeson — 0 valor desonerado nao deduzido do total, 1 deduzido. */
  readonly indicadorDeducaoDesoneracao?: 0 | 1;
  /** vICMSSTDeson — ICMS ST desonerado (CST 10/70/90). */
  readonly valorStDesonerado?: number;
  /** motDesICMSST — motivo da desoneracao do ST. */
  readonly motivoStDesoneracao?: number;

  /** vBCSTDest / vICMSSTDest — ST devido a UF de destino (grupo ICMSST). */
  readonly baseCalculoSTDestino?: number;
  readonly valorSTDestino?: number;

  /**
   * Grupo do ICMS efetivo (pRedBCEfet, vBCEfet, pICMSEfet, vICMSEfet) — usado
   * nos CST 60 e ICMSST e no CSOSN 500 para informar o imposto real da operacao.
   */
  readonly efetivo?: ICMSEfetivoProps;

  /**
   * Tributacao monofasica de combustiveis (CST 02, 15, 53 e 61), instituida
   * pela LC 192/2022: o imposto e por unidade de medida, nao por percentual.
   */
  readonly monofasico?: ICMSMonofasicoProps;
};

/**
 * ICMS efetivo da operacao (grupo comum aos CST 60, ICMSST e CSOSN 500).
 */
export type ICMSEfetivoProps = {
  /** pRedBCEfet */
  readonly percentualReducaoBase: number;
  /** vBCEfet */
  readonly baseCalculo: number;
  /** pICMSEfet */
  readonly aliquota: number;
  /** vICMSEfet */
  readonly valor: number;
};

/**
 * Tributacao monofasica de combustiveis. Cada CST usa um subconjunto:
 *
 * - CST 02: `quantidade`, `aliquotaAdRem`, `valor`
 * - CST 15: acima + `quantidadeRetencao`, `aliquotaAdRemRetencao`, `valorRetencao`
 *   e, opcionalmente, `percentualReducaoAdRem` + `motivoReducaoAdRem`
 * - CST 53: `quantidade`, `aliquotaAdRem`, `valorOperacao`, `percentualDiferimento`,
 *   `valorDiferido`, `valor`, `quantidadeDiferida`, `aliquotaAdRemDiferida`
 * - CST 61: `quantidadeRetido`, `aliquotaAdRemRetido`, `valorRetido`
 */
export type ICMSMonofasicoProps = {
  /** qBCMono — quantidade tributada. */
  readonly quantidade?: number;
  /** adRemICMS — aliquota ad rem por unidade. */
  readonly aliquotaAdRem?: number;
  /** vICMSMono — valor do ICMS monofasico. */
  readonly valor?: number;

  /** qBCMonoReten — quantidade tributada sujeita a retencao. */
  readonly quantidadeRetencao?: number;
  /** adRemICMSReten — aliquota ad rem da retencao. */
  readonly aliquotaAdRemRetencao?: number;
  /** vICMSMonoReten — valor retido. */
  readonly valorRetencao?: number;
  /** pRedAdRem — percentual de reducao da aliquota ad rem. */
  readonly percentualReducaoAdRem?: number;
  /** motRedAdRem — motivo da reducao. */
  readonly motivoReducaoAdRem?: number;

  /** qBCMonoRet — quantidade cujo imposto foi retido anteriormente. */
  readonly quantidadeRetido?: number;
  /** adRemICMSRet — aliquota ad rem do imposto retido. */
  readonly aliquotaAdRemRetido?: number;
  /** vICMSMonoRet — valor do imposto retido anteriormente. */
  readonly valorRetido?: number;

  /** vICMSMonoOp — valor do ICMS monofasico da operacao (antes do diferimento). */
  readonly valorOperacao?: number;
  /** pDif — percentual do diferimento. */
  readonly percentualDiferimento?: number;
  /** vICMSMonoDif — valor diferido. */
  readonly valorDiferido?: number;
  /** qBCMonoDif — quantidade com imposto diferido. */
  readonly quantidadeDiferida?: number;
  /** adRemICMSDif — aliquota ad rem diferida. */
  readonly aliquotaAdRemDiferida?: number;
};

export type PISProps = {
  readonly cst: string;
  readonly baseCalculo?: number;
  readonly aliquota?: number;
  readonly valor?: number;
  /** qBCProd — base por quantidade (CST 03, tributacao por unidade). */
  readonly quantidade?: number;
  /** vAliqProd — aliquota por unidade. */
  readonly aliquotaPorUnidade?: number;
};

export type COFINSProps = {
  readonly cst: string;
  readonly baseCalculo?: number;
  readonly aliquota?: number;
  readonly valor?: number;
  /** qBCProd — base por quantidade (CST 03, tributacao por unidade). */
  readonly quantidade?: number;
  /** vAliqProd — aliquota por unidade. */
  readonly aliquotaPorUnidade?: number;
};

export type IPIProps = {
  readonly cst: string;
  readonly baseCalculo?: number;
  readonly aliquota?: number;
  readonly valor?: number;
  readonly cEnq?: string;
  /** CNPJProd — CNPJ do produtor da mercadoria, quando diferente do emitente. */
  readonly cnpjProdutor?: string;
  /** cSelo — codigo do selo de controle. */
  readonly codigoSelo?: string;
  /** qSelo — quantidade de selos. */
  readonly quantidadeSelo?: number;
  /** qUnid — quantidade tributada (IPI por unidade). */
  readonly quantidade?: number;
  /** vUnid — valor por unidade tributavel. */
  readonly valorPorUnidade?: number;
};

export type { IBSCBSProps } from './IbsCbs';

/**
 * Partilha do ICMS para a UF de destino (grupo ICMSUFDest, EC 87/2015).
 *
 * Obrigatorio em venda interestadual para consumidor final nao contribuinte
 * (idDest=2 + indFinal=1). O builder calcula os valores a partir das aliquotas:
 * o diferencial e `vBC x (aliquotaInterna - aliquotaInterestadual)`, repartido
 * entre destino e remetente conforme `percentualPartilha` (100% destino desde 2019).
 */
export type ICMSUFDestProps = {
  /** vBCUFDest. Default: valor total do item. */
  readonly baseCalculo?: number;
  /** vBCFCPUFDest. Default: mesma base do ICMS quando ha aliquota de FCP. */
  readonly baseCalculoFcp?: number;
  /** pFCPUFDest — aliquota do Fundo de Combate a Pobreza na UF de destino. */
  readonly aliquotaFcp?: number;
  /** pICMSUFDest — aliquota interna da UF de destino. */
  readonly aliquotaInterna: number;
  /** pICMSInter — aliquota interestadual da operacao. */
  readonly aliquotaInterestadual: 4 | 7 | 12;
  /** pICMSInterPart — percentual de partilha para a UF de destino. Default: 100. */
  readonly percentualPartilha?: number;
};

export type ProdutoProps = {
  readonly numero: number;
  readonly codigo: string;
  readonly descricao: string;
  readonly ncm: string;
  readonly cest?: string;
  readonly cfop: string;
  readonly unidade: string;
  readonly quantidade: number;
  readonly valorUnitario: number;
  readonly valorTotal: number;
  readonly valorDesconto?: number;
  readonly valorFrete?: number;
  readonly valorSeguro?: number;
  readonly outrasDespesas?: number;
  readonly ean?: string;
  readonly eanTributavel?: string;
  readonly icms: ICMSProps;
  readonly pis: PISProps;
  readonly cofins: COFINSProps;
  readonly ipi?: IPIProps;
  readonly icmsUfDest?: ICMSUFDestProps;
  readonly ibsCbs?: IBSCBSProps;
  readonly ii?: IIProps;
  /** IS — Imposto Seletivo (reforma tributaria). */
  readonly impostoSeletivo?: ImpostoSeletivoProps;
  readonly issqn?: ISSQNProps;
  readonly pisSt?: PISCOFINSSTProps;
  readonly cofinsSt?: PISCOFINSSTProps;

  /** cBarra — codigo de barras proprio quando o cEAN nao e GTIN. */
  readonly codigoBarras?: string;
  /** cBarraTrib — codigo de barras da unidade tributavel. */
  readonly codigoBarrasTributavel?: string;
  /** NVE — Nomenclatura de Valor Aduaneiro e Estatistica (ate 8). */
  readonly nve?: readonly string[];
  /** indEscala — 'S' produzido em escala relevante, 'N' nao relevante. */
  readonly indicadorEscala?: 'S' | 'N';
  /** CNPJFab — CNPJ do fabricante da mercadoria (quando indEscala = 'N'). */
  readonly cnpjFabricante?: string;
  /** cBenef — codigo de beneficio fiscal na UF. */
  readonly codigoBeneficioFiscal?: string;
  /** gCred — creditos presumidos (ate 4). */
  readonly creditosPresumidos?: readonly CreditoPresumidoProps[];
  /** tpCredPresIBSZFM — tipo de credito presumido de IBS na Zona Franca. */
  readonly tipoCreditoPresumidoIbsZfm?: string;
  /** EXTIPI — codigo da excecao da TIPI. */
  readonly extipi?: string;
  /**
   * indBemMovelUsado — marca o item como bem movel usado. O XSD so aceita o
   * valor '1', entao aqui e booleano: `true` emite a tag, `false` a omite.
   */
  readonly bemMovelUsado?: boolean;
  /** xPed — numero do pedido de compra. */
  readonly pedido?: string;
  /** nItemPed — item do pedido de compra. */
  readonly itemPedido?: number;
  /** nFCI — numero de controle da Ficha de Conteudo de Importacao (GUID). */
  readonly fci?: string;
  readonly declaracoesImportacao?: readonly DeclaracaoImportacaoProps[];
  readonly detalhesExportacao?: readonly DetalheExportacaoProps[];
  readonly rastros?: readonly RastroProps[];
  readonly produtoNFF?: ProdutoNFFProps;
  readonly embalagem?: EmbalagemProps;

  /** Produtos com grupo proprio — apenas um deles por item. */
  readonly veiculoNovo?: VeiculoNovoProps;
  readonly medicamento?: MedicamentoProps;
  readonly armamentos?: readonly ArmamentoProps[];
  readonly combustivel?: CombustivelProps;
  /** nRECOPI — numero do registro no sistema RECOPI (papel imune). */
  readonly recopi?: string;

  /** vTotTrib — tributos aproximados do item (Lei 12.741/2012). */
  readonly tributosAproximados?: number;
  readonly impostoDevolvido?: ImpostoDevolvidoProps;
  /** infAdProd — informacao adicional do item. */
  readonly informacoesAdicionais?: string;
  readonly observacaoItem?: ObservacaoItemProps;
  /** vItem — valor do item, quando difere de vProd. */
  readonly valorItem?: number;
  readonly dfeReferenciado?: DFeReferenciadoProps;
};

/**
 * Imposto Seletivo do item (grupo `IS`, NT 2025.002).
 *
 * Incide sobre bens e servicos prejudiciais a saude ou ao meio ambiente. Pode
 * ser por percentual (`aliquota`) e/ou por unidade (`aliquotaEspecifica`).
 */
export type ImpostoSeletivoProps = {
  /** CSTIS — codigo de situacao tributaria do IS. */
  readonly cst: string;
  /** cClassTribIS — classificacao tributaria do IS. */
  readonly cClassTrib: string;
  /** vBCIS — base de calculo. */
  readonly baseCalculo: number;
  /** pIS — aliquota ad valorem. */
  readonly aliquota: number;
  /** pISEspec — aliquota especifica por unidade. */
  readonly aliquotaEspecifica?: number;
  /** uTrib — unidade de medida tributavel. */
  readonly unidadeTributavel: string;
  /** qTrib — quantidade tributavel. */
  readonly quantidadeTributavel: number;
  /** vIS — valor do imposto seletivo. */
  readonly valor: number;
};

/**
 * Imposto de Importacao do item (grupo `II`).
 */
export type IIProps = {
  /** vBC — base de calculo. */
  readonly baseCalculo: number;
  /** vDespAdu — despesas aduaneiras. */
  readonly despesasAduaneiras: number;
  /** vII — valor do imposto de importacao. */
  readonly valor: number;
  /** vIOF — valor do IOF. */
  readonly valorIof: number;
};

/**
 * ISSQN do item (grupo `ISSQN`), para nota mista de mercadoria e servico.
 */
export type ISSQNProps = {
  /** vBC — base de calculo. */
  readonly baseCalculo: number;
  /** vAliq — aliquota. */
  readonly aliquota: number;
  /** vISSQN — valor do ISSQN. */
  readonly valor: number;
  /** cMunFG — municipio de ocorrencia do fato gerador. */
  readonly codigoMunicipioFatoGerador: string;
  /** cListServ — item da lista de servicos da LC 116/2003. */
  readonly itemListaServicos: string;
  readonly valorDeducao?: number;
  readonly outrasRetencoes?: number;
  readonly descontoIncondicionado?: number;
  readonly descontoCondicionado?: number;
  readonly valorRetido?: number;
  /** indISS — 1 exigivel, 2 nao incidencia, 3 isencao, 4 exportacao, ... */
  readonly exigibilidade: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** cServico — codigo do servico no municipio. */
  readonly codigoServico?: string;
  /** cMun — municipio de incidencia. */
  readonly codigoMunicipio?: string;
  /** cPais — pais onde o servico foi prestado. */
  readonly codigoPais?: string;
  readonly numeroProcesso?: string;
  /** indIncentivo — 1 sim, 2 nao. */
  readonly incentivoFiscal: 1 | 2;
};

/**
 * PIS ST / COFINS ST do item (grupos `PISST` e `COFINSST`). A base pode ser por
 * valor (`baseCalculo` + `aliquota`) ou por quantidade (`quantidade` +
 * `aliquotaPorUnidade`).
 */
export type PISCOFINSSTProps = {
  readonly baseCalculo?: number;
  readonly aliquota?: number;
  readonly quantidade?: number;
  readonly aliquotaPorUnidade?: number;
  readonly valor: number;
  /** indSomaPISST / indSomaCOFINSST — 0 nao compoe o total, 1 compoe. */
  readonly compoeTotal?: 0 | 1;
};
