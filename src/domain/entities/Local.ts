/**
 * Local de retirada ou de entrega da mercadoria (grupos `retirada` e `entrega`,
 * tipo TLocal do leiaute).
 *
 * Usado quando o endereco fisico difere do endereco cadastral do emitente ou do
 * destinatario — venda com entrega em obra, retirada em deposito, triangulacao.
 */
export type LocalProps = {
  readonly cnpj?: string;
  readonly cpf?: string;
  readonly nome?: string;
  readonly logradouro: string;
  readonly numero: string;
  readonly complemento?: string;
  readonly bairro: string;
  readonly codigoMunicipio: string;
  readonly municipio: string;
  readonly uf: string;
  readonly cep?: string;
  readonly codigoPais?: string;
  readonly pais?: string;
  readonly telefone?: string;
  readonly email?: string;
  readonly inscricaoEstadual?: string;
};

/**
 * Emissao de NFe avulsa pelo fisco (grupo `avulsa`).
 *
 * So se aplica quando quem emite e a propria repartic'ao fiscal, em nome de
 * contribuinte sem credenciamento.
 */
export type AvulsaProps = {
  /** CNPJ do orgao emitente. */
  readonly cnpj: string;
  /** xOrgao — sigla do orgao. */
  readonly orgao: string;
  /** matr — matricula do agente. */
  readonly matricula: string;
  /** xAgente — nome do agente. */
  readonly agente: string;
  readonly telefone?: string;
  readonly uf: string;
  /** nDAR — numero do Documento de Arrecadacao de Receita. */
  readonly numeroDar?: string;
  /** dEmi — data de emissao do DAR. */
  readonly dataEmissaoDar?: Date;
  /** vDAR — valor do DAR. */
  readonly valorDar?: number;
  /** repEmi — repartic'ao fiscal emitente. */
  readonly reparticaoEmitente: string;
  /** dPag — data do pagamento do DAR. */
  readonly dataPagamento?: Date;
};

/**
 * Intermediador da operacao (grupo `infIntermed`) — marketplace ou plataforma
 * de intermediacao. Obrigatorio quando `indIntermed` = 1.
 */
export type IntermediadorProps = {
  readonly cnpj: string;
  /** idCadIntTran — identificador do vendedor no site do intermediador. */
  readonly identificadorVendedor: string;
};

/**
 * Informacoes de comercio exterior (grupo `exporta`).
 */
export type ExportacaoProps = {
  /** UFSaidaPais — UF de embarque ou de transposicao de fronteira. */
  readonly ufSaida: string;
  /** xLocExporta — local de embarque ou de transposicao. */
  readonly localExportacao: string;
  /** xLocDespacho — local do despacho. */
  readonly localDespacho?: string;
};

/**
 * Compra publica (grupo `compra`) — nota, pedido e contrato.
 */
export type CompraProps = {
  /** xNEmp — nota de empenho. */
  readonly notaEmpenho?: string;
  /** xPed — pedido. */
  readonly pedido?: string;
  /** xCont — contrato. */
  readonly contrato?: string;
};
