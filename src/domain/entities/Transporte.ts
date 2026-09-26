export type VolumeProps = {
  readonly quantidade?: number;
  readonly especie?: string;
  readonly marca?: string;
  readonly numeracao?: string;
  readonly pesoLiquido?: number;
  readonly pesoBruto?: number;
  /** nLacre — numeros dos lacres do volume. */
  readonly lacres?: readonly string[];
};

export type VeiculoTranspProps = {
  readonly placa: string;
  readonly uf?: string;
  /** RNTC — Registro Nacional de Transportador de Carga (ANTT). */
  readonly rntc?: string;
};

/**
 * ICMS retido por substituicao tributaria sobre o frete (grupo `retTransp`).
 */
export type RetencaoTransporteProps = {
  /** vServ — valor do servico. */
  readonly valorServico: number;
  /** vBCRet — base de calculo da retencao. */
  readonly baseCalculoRetencao: number;
  /** pICMSRet — aliquota da retencao. */
  readonly aliquotaRetencao: number;
  /** vICMSRet — valor do ICMS retido. */
  readonly valorRetencao: number;
  readonly cfop: string;
  /** cMunFG — municipio de ocorrencia do fato gerador. */
  readonly codigoMunicipio: string;
};

export type TransporteProps = {
  /**
   * modFrete — 0 por conta do emitente, 1 por conta do destinatario,
   * 2 por conta de terceiros, 3 proprio por conta do remetente,
   * 4 proprio por conta do destinatario, 9 sem transporte.
   */
  readonly modalidadeFrete: 0 | 1 | 2 | 3 | 4 | 9;
  readonly cnpjTransportadora?: string;
  readonly cpfTransportadora?: string;
  readonly nomeTransportadora?: string;
  readonly inscricaoEstadual?: string;
  readonly endereco?: string;
  readonly municipio?: string;
  readonly uf?: string;
  readonly retencao?: RetencaoTransporteProps;
  readonly veiculo?: VeiculoTranspProps;
  /** reboque — ate 5 reboques do veiculo de transporte. */
  readonly reboques?: readonly VeiculoTranspProps[];
  /** vagao — identificacao do vagao (transporte ferroviario). */
  readonly vagao?: string;
  /** balsa — identificacao da balsa (transporte aquaviario). */
  readonly balsa?: string;
  readonly volumes?: readonly VolumeProps[];
};
