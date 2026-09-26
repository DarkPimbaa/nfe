import { EmitenteProps } from './Emitente';
import { DestinatarioProps } from './Destinatario';
import { ProdutoProps } from './Produto';
import { TransporteProps } from './Transporte';
import { PagamentoProps } from './Pagamento';
import { CobrancaProps } from './Cobranca';
import {
  LocalProps,
  AvulsaProps,
  IntermediadorProps,
  ExportacaoProps,
  CompraProps
} from './Local';
import {
  ObservacaoProps,
  ProcessoReferenciadoProps,
  CanaProps,
  AgropecuarioProps
} from './InformacoesAdicionais';

/**
 * Documento fiscal referenciado pela NFe (grupo NFref).
 *
 * Obrigatorio em nota de devolucao, complementar e de ajuste — sem ele a SEFAZ
 * rejeita a nota (rejeicoes 239/240 e correlatas).
 */
export type NotaReferenciada =
  /** NFe eletronica (mod 55/65) referenciada pela chave de acesso. */
  | { readonly tipo: 'nfe'; readonly chaveAcesso: string }
  /** NFe referenciada com sigilo (refNFeSig) — a chave nao aparece no DANFE. */
  | { readonly tipo: 'nfeSigilosa'; readonly chaveAcesso: string }
  /** CTe referenciado pela chave de acesso. */
  | { readonly tipo: 'cte'; readonly chaveAcesso: string }
  /** Nota fiscal em papel, modelo 1/1A ou 02. */
  | {
      readonly tipo: 'nf';
      readonly uf: string;
      /** Ano e mes da emissao no formato AAMM. */
      readonly anoMes: string;
      readonly cnpj: string;
      readonly modelo: '01' | '02';
      readonly serie: number;
      readonly numero: number;
    }
  /** Nota fiscal de produtor rural (mod 04 ou 01). */
  | {
      readonly tipo: 'produtorRural';
      readonly uf: string;
      readonly anoMes: string;
      readonly cnpj?: string;
      readonly cpf?: string;
      readonly inscricaoEstadual: string;
      readonly modelo: '01' | '04';
      readonly serie: number;
      readonly numero: number;
    }
  /** Cupom fiscal emitido por ECF. */
  | {
      readonly tipo: 'ecf';
      readonly modelo: '2B' | '2C' | '2D';
      readonly numeroEcf: string;
      readonly numeroContadorOrdem: string;
    };

/**
 * Pessoa autorizada a consultar o XML da NFe (grupo autXML) — tipicamente a
 * contabilidade ou o transportador. Ate 10 por nota.
 */
export type AutorizadoXml = {
  readonly cnpj?: string;
  readonly cpf?: string;
};

/**
 * Responsavel tecnico pelo sistema emissor (grupo infRespTec).
 *
 * Exigido pela maioria das SEFAZ. `csrt` e `idCSRT` sao o codigo de seguranca
 * fornecido pela SEFAZ ao desenvolvedor — quando informados, o builder calcula
 * o `hashCSRT` a partir da chave de acesso.
 */
export type ResponsavelTecnico = {
  readonly cnpj: string;
  readonly contato: string;
  readonly email: string;
  readonly telefone: string;
  readonly idCSRT?: string;
  readonly csrt?: string;
};

export type NFeIdentificacao = {
  readonly naturezaOperacao: string;
  readonly tipoOperacao: 0 | 1;
  readonly destinoOperacao: 1 | 2 | 3;
  readonly finalidade: 1 | 2 | 3 | 4;
  readonly consumidorFinal: 0 | 1;
  readonly presencaComprador: 0 | 1 | 2 | 3 | 4 | 5 | 9;
  readonly uf: string;
  readonly municipio: string;
  readonly serie: number;
  readonly numero: number;
  readonly dataEmissao?: Date;
  readonly tipoEmissao?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 9;
  readonly tipoImpressao?: 0 | 1 | 2 | 3 | 4 | 5;
  readonly ambiente?: 1 | 2;
  readonly modelo?: '55' | '65';
  /** dhSaiEnt — data e hora de saida ou de entrada da mercadoria. */
  readonly dataSaidaEntrada?: Date;
  /** dPrevEntrega — data prevista para a entrega. */
  readonly dataPrevistaEntrega?: Date;
  /** cMunFGIBS — municipio de ocorrencia do fato gerador do IBS. */
  readonly municipioFatoGeradorIbs?: string;
  /** tpNFDebito — tipo de nota de debito especial (RTC). */
  readonly tipoNotaDebito?: string;
  /** tpNFCredito — tipo de nota de credito (RTC). */
  readonly tipoNotaCredito?: string;
  /** gCompraGov — compra governamental, com o redutor aplicavel (RTC). */
  readonly compraGovernamental?: CompraGovernamentalProps;
  /** indIntermed — 0 operacao sem intermediador, 1 operacao via intermediador. */
  readonly indicadorIntermediador?: 0 | 1;
  /**
   * dhCont + xJust — data/hora de entrada em contingencia e a justificativa.
   * Obrigatorios quando `tipoEmissao` indica contingencia (2, 4, 5, 6, 7 ou 9).
   */
  readonly dataHoraContingencia?: Date;
  readonly justificativaContingencia?: string;
  readonly notasReferenciadas?: readonly NotaReferenciada[];
  /**
   * gPagAntecipado — chaves das NFe de antecipacao de pagamento que esta nota
   * liquida. Ate 99.
   */
  readonly pagamentosAntecipados?: readonly string[];
};

/**
 * Compra governamental (grupo `gCompraGov`, NT 2025.002): o ente publico tem
 * reducao das aliquotas de IBS/CBS.
 */
export type CompraGovernamentalProps = {
  /** tpEnteGov — 1 Uniao, 2 Estados/DF, 3 Municipios. */
  readonly tipoEnte: 1 | 2 | 3;
  /** pRedutor — percentual do redutor aplicado. */
  readonly percentualRedutor: number;
  /** tpOperGov — tipo da operacao governamental. */
  readonly tipoOperacao: number;
};

export type NFeProps = {
  readonly identificacao: NFeIdentificacao;
  readonly emitente: EmitenteProps;
  readonly destinatario?: DestinatarioProps;
  readonly produtos: ProdutoProps[];
  readonly transporte: TransporteProps;
  readonly cobranca?: CobrancaProps;
  readonly pagamento: PagamentoProps;
  readonly informacoesComplementares?: string;
  readonly informacoesFisco?: string;
  readonly autorizadosXml?: readonly AutorizadoXml[];
  readonly responsavelTecnico?: ResponsavelTecnico;
  /** Emissao avulsa pelo fisco. */
  readonly avulsa?: AvulsaProps;
  /** Local de retirada, quando diferente do endereco do emitente. */
  readonly retirada?: LocalProps;
  /** Local de entrega, quando diferente do endereco do destinatario. */
  readonly entrega?: LocalProps;
  /** Intermediador da operacao (marketplace). Exige `indicadorIntermediador` = 1. */
  readonly intermediador?: IntermediadorProps;
  readonly exportacao?: ExportacaoProps;
  readonly compra?: CompraProps;
  readonly cana?: CanaProps;
  readonly observacoesContribuinte?: readonly ObservacaoProps[];
  readonly observacoesFisco?: readonly ObservacaoProps[];
  readonly processosReferenciados?: readonly ProcessoReferenciadoProps[];
  /** vNFTot — valor total da NFe com os tributos da reforma (RTC). */
  readonly valorTotalNota?: number;
  /** Totais de servico (ISSQNtot) e retencoes de tributos federais (retTrib). */
  readonly totaisServico?: TotaisServicoProps;
  readonly retencoesTributos?: RetencoesTributosProps;
  /** xSolic — solicitacao do contribuinte para emissao via NFF. */
  readonly solicitacaoNFF?: string;
  readonly agropecuario?: AgropecuarioProps;
};

/**
 * Totais do ISSQN da nota (grupo `ISSQNtot`), obrigatorio quando ha item com
 * ISSQN.
 */
export type TotaisServicoProps = {
  /** vServ — total dos servicos sob nao incidencia do ICMS. */
  readonly valorServicos?: number;
  /** vBC — base de calculo do ISS. */
  readonly baseCalculo?: number;
  /** vISS — total do ISS. */
  readonly valorIss?: number;
  readonly valorPis?: number;
  readonly valorCofins?: number;
  /** dCompet — data da competencia do servico. Obrigatoria no grupo. */
  readonly dataCompetencia: Date;
  readonly valorDeducao?: number;
  readonly outrasRetencoes?: number;
  readonly descontoIncondicionado?: number;
  readonly descontoCondicionado?: number;
  readonly valorIssRetido?: number;
  /** cRegTrib — regime especial de tributacao do ISSQN. */
  readonly regimeTributacao?: number;
};

/**
 * Retencoes de tributos federais (grupo `retTrib`).
 */
export type RetencoesTributosProps = {
  readonly valorRetidoPis?: number;
  readonly valorRetidoCofins?: number;
  readonly valorRetidoCsll?: number;
  readonly baseCalculoIrrf?: number;
  readonly valorIrrf?: number;
  readonly baseCalculoRetencaoPrevidencia?: number;
  readonly valorRetencaoPrevidencia?: number;
};

export class NFe {
  public readonly identificacao: NFeIdentificacao;
  public readonly emitente: EmitenteProps;
  public readonly destinatario?: DestinatarioProps;
  public readonly produtos: readonly ProdutoProps[];
  public readonly transporte: TransporteProps;
  public readonly cobranca?: CobrancaProps;
  public readonly pagamento: PagamentoProps;
  public readonly informacoesComplementares?: string;
  public readonly informacoesFisco?: string;
  public readonly autorizadosXml?: readonly AutorizadoXml[];
  public readonly responsavelTecnico?: ResponsavelTecnico;

  constructor(props: NFeProps) {
    this.identificacao = {
      ...props.identificacao,
      dataEmissao: props.identificacao.dataEmissao ?? new Date(),
      tipoEmissao: props.identificacao.tipoEmissao ?? 1,
      tipoImpressao: props.identificacao.tipoImpressao ?? 1
    };
    this.emitente = props.emitente;
    this.destinatario = props.destinatario;
    this.produtos = Object.freeze([...props.produtos]);
    this.transporte = props.transporte;
    this.cobranca = props.cobranca;
    this.pagamento = props.pagamento;
    this.informacoesComplementares = props.informacoesComplementares;
    this.informacoesFisco = props.informacoesFisco;
    this.autorizadosXml = props.autorizadosXml
      ? Object.freeze([...props.autorizadosXml])
      : undefined;
    this.responsavelTecnico = props.responsavelTecnico;
  }
}
