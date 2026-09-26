/**
 * Uma forma de pagamento da nota (grupo detPag).
 *
 * Os campos alem de `formaPagamento`/`valor` alimentam o split de pagamento da
 * reforma tributaria: sao eles que ligam a nota a liquidacao financeira, para o
 * prestador de servico de pagamento identificar o documento fiscal e segregar
 * IBS/CBS no momento da liquidacao.
 */
export type FormaPagamentoProps = {
  /** tPag — forma de pagamento (01 dinheiro, 03 cartao de credito, 17 PIX...). */
  readonly formaPagamento: string;
  /** vPag */
  readonly valor: number;
  /** indPag — 0 a vista, 1 a prazo. */
  readonly indicadorPagamento?: 0 | 1;
  /** xPag — descricao do meio de pagamento. Obrigatorio quando `tPag` e 99 (outros). */
  readonly descricao?: string;
  /** dPag — data do pagamento. */
  readonly dataPagamento?: Date;
  /**
   * CNPJPag — CNPJ do estabelecimento onde o pagamento foi processado.
   * Anda junto com `ufPagador`: ou os dois, ou nenhum.
   */
  readonly cnpjPagador?: string;
  /** UFPag — UF do estabelecimento onde o pagamento foi processado. */
  readonly ufPagador?: string;

  /** tpIntegra — 1 integrado com o sistema de automacao, 2 nao integrado. */
  readonly tipoIntegracao?: 1 | 2;
  /** CNPJ da instituicao de pagamento. */
  readonly cnpjCredenciadora?: string;
  /** tBand — bandeira da operadora de cartao. */
  readonly bandeira?: string;
  /** cAut — numero de autorizacao da operacao. */
  readonly autorizacao?: string;
  /** CNPJReceb — CNPJ do beneficiario do pagamento. */
  readonly cnpjRecebedor?: string;
  /** idTermPag — identificador do terminal de pagamento. */
  readonly idTerminalPagamento?: string;
};

export type PagamentoProps = {
  readonly pagamentos: FormaPagamentoProps[];
  readonly troco?: number;
};
