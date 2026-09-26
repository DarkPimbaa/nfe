/**
 * Observacao de uso livre do contribuinte (`obsCont`) ou do fisco (`obsFisco`).
 */
export type ObservacaoProps = {
  /** Atributo xCampo — identificador do campo. */
  readonly campo: string;
  /** xTexto — conteudo da observacao. */
  readonly texto: string;
};

/**
 * Processo ou ato concessorio referenciado (grupo `procRef`).
 */
export type ProcessoReferenciadoProps = {
  /** nProc — identificador do processo ou ato. */
  readonly numero: string;
  /**
   * indProc — origem: 0 SEFAZ, 1 Justica Federal, 2 Justica Estadual,
   * 3 Secex/RFB, 9 outros.
   */
  readonly origem: 0 | 1 | 2 | 3 | 9;
  /** tpAto — tipo do ato concessorio. */
  readonly tipoAto?: string;
};

/**
 * Fornecimento diario de cana (grupo `forDia`).
 */
export type FornecimentoDiarioProps = {
  /** Atributo dia — dia do fornecimento (1 a 31). */
  readonly dia: number;
  /** qtde — quantidade fornecida no dia. */
  readonly quantidade: number;
};

/**
 * Deducao do fornecimento de cana (grupo `deduc`).
 */
export type DeducaoCanaProps = {
  /** xDed — descricao da deducao. */
  readonly descricao: string;
  /** vDed — valor da deducao. */
  readonly valor: number;
};

/**
 * Aquisicao de cana-de-acucar (grupo `cana`), usado pelas usinas.
 */
export type CanaProps = {
  readonly safra: string;
  /** ref — mes e ano de referencia, no formato MM/AAAA. */
  readonly referencia: string;
  readonly fornecimentosDiarios: readonly FornecimentoDiarioProps[];
  /** qTotMes — total do mes. */
  readonly totalMes: number;
  /** qTotAnt — total anterior. */
  readonly totalAnterior: number;
  /** qTotGer — total geral. */
  readonly totalGeral: number;
  readonly deducoes?: readonly DeducaoCanaProps[];
  /** vFor — valor dos fornecimentos. */
  readonly valorFornecimento: number;
  /** vTotDed — total das deducoes. */
  readonly valorTotalDeducao: number;
  /** vLiqFor — valor liquido. */
  readonly valorLiquido: number;
};

/**
 * Defensivo agricola aplicado (grupo `agropecuario/defensivo`).
 */
export type DefensivoProps = {
  /** nReceituario — numero do receituario agronomico. */
  readonly receituario: string;
  /** CPFRespTec — CPF do responsavel tecnico. */
  readonly cpfResponsavelTecnico: string;
};

/**
 * Guia de transito animal ou vegetal (grupo `agropecuario/guiaTransito`).
 */
export type GuiaTransitoProps = {
  /** tpGuia — 1 GTA, 2 GTV, 3 outros. */
  readonly tipo: 1 | 2 | 3;
  readonly uf: string;
  readonly serie?: string;
  readonly numero: string;
};

/**
 * Grupo `agropecuario`: ou os defensivos, ou a guia de transito — nunca os dois.
 */
export type AgropecuarioProps =
  | { readonly defensivos: readonly DefensivoProps[]; readonly guiaTransito?: undefined }
  | { readonly guiaTransito: GuiaTransitoProps; readonly defensivos?: undefined };
