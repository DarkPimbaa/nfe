/**
 * Grupos especializados do item (`det/prod`) do leiaute 4.00: importacao,
 * exportacao, rastreabilidade e os produtos com regra propria (veiculo,
 * medicamento, arma, combustivel).
 */

/**
 * Adicao da Declaracao de Importacao (grupo `adi`).
 */
export type AdicaoImportacaoProps = {
  /** nAdicao — numero da adicao. */
  readonly numero?: number;
  /** nSeqAdic — sequencial do item dentro da adicao. */
  readonly sequencial: number;
  /** cFabricante — codigo do fabricante estrangeiro. */
  readonly codigoFabricante: string;
  /** vDescDI — desconto do item da DI. */
  readonly desconto?: number;
  /** nDraw — numero do ato concessorio de drawback. */
  readonly drawback?: string;
};

/**
 * Declaracao de Importacao (grupo `DI`).
 */
export type DeclaracaoImportacaoProps = {
  /** nDI — numero do documento de importacao (DI, DSI, DA, DRI-E). */
  readonly numero: string;
  /** dDI — data de registro. */
  readonly dataRegistro: Date;
  /** xLocDesemb — local do desembaraco. */
  readonly localDesembaraco: string;
  /** UFDesemb — UF do desembaraco. */
  readonly ufDesembaraco: string;
  /** dDesemb — data do desembaraco. */
  readonly dataDesembaraco: Date;
  /**
   * tpViaTransp — via de transporte internacional: 1 maritima, 2 fluvial,
   * 3 lacustre, 4 aerea, 5 postal, 6 ferroviaria, 7 rodoviaria, 8 conduto,
   * 9 meios proprios, 10 entrada/saida ficta, 11 courier, 12 handcarry.
   */
  readonly viaTransporte: number;
  /** vAFRMM — Adicional ao Frete para Renovacao da Marinha Mercante. */
  readonly valorAfrmm?: number;
  /**
   * tpIntermedio — forma de importacao: 1 por conta propria, 2 por conta e
   * ordem, 3 encomenda.
   */
  readonly tipoIntermediacao: 1 | 2 | 3;
  /** CNPJ do adquirente ou do encomendante. */
  readonly cnpj?: string;
  /** CPF do adquirente ou do encomendante. */
  readonly cpf?: string;
  /** UFTerceiro — UF do adquirente ou do encomendante. */
  readonly ufTerceiro?: string;
  /** cExportador — codigo do exportador. */
  readonly codigoExportador: string;
  readonly adicoes: readonly AdicaoImportacaoProps[];
};

/**
 * Exportacao indireta vinculada ao item (grupo `exportInd`).
 */
export type ExportacaoIndiretaProps = {
  /** nRE — Registro de Exportacao. */
  readonly registroExportacao: string;
  /** chNFe — chave da NFe de exportacao. */
  readonly chaveAcesso: string;
  /** qExport — quantidade exportada. */
  readonly quantidade: number;
};

/**
 * Detalhe de exportacao do item (grupo `detExport`).
 */
export type DetalheExportacaoProps = {
  /** nDraw — numero do ato concessorio de drawback. */
  readonly drawback?: string;
  readonly exportacaoIndireta?: ExportacaoIndiretaProps;
};

/**
 * Rastreabilidade por lote (grupo `rastro`). Obrigatorio para medicamentos,
 * produtos veterinarios, odontologicos, bebidas, aguas e alimentos.
 */
export type RastroProps = {
  /** nLote — numero do lote. */
  readonly lote: string;
  /** qLote — quantidade do lote. */
  readonly quantidade: number;
  /** dFab — data de fabricacao. */
  readonly dataFabricacao: Date;
  /** dVal — data de validade. */
  readonly dataValidade: Date;
  /** cAgreg — codigo de agregacao. */
  readonly codigoAgregacao?: string;
};

/**
 * Credito presumido do item (grupo `gCred`).
 */
export type CreditoPresumidoProps = {
  /** cCredPresumido — codigo do credito presumido. */
  readonly codigo: string;
  /** pCredPresumido — percentual. */
  readonly percentual: number;
  /** vCredPresumido — valor. */
  readonly valor: number;
};

/**
 * Veiculo novo (grupo `veicProd`). Todos os campos sao obrigatorios no leiaute.
 */
export type VeiculoNovoProps = {
  /** tpOp — 1 venda concessionaria, 2 faturamento direto, 3 venda direta, 0 outros. */
  readonly tipoOperacao: 0 | 1 | 2 | 3;
  readonly chassi: string;
  /** cCor — codigo da cor no padrao do fabricante. */
  readonly codigoCor: string;
  /** xCor — descricao da cor. */
  readonly cor: string;
  /** pot — potencia do motor em CV. */
  readonly potencia: string;
  /** cilin — cilindrada. */
  readonly cilindrada: string;
  /** pesoL — peso liquido. */
  readonly pesoLiquido: string;
  /** pesoB — peso bruto. */
  readonly pesoBruto: string;
  readonly numeroSerie: string;
  /** tpComb — tipo de combustivel (tabela DENATRAN). */
  readonly tipoCombustivel: string;
  readonly numeroMotor: string;
  /** CMT — capacidade maxima de tracao. */
  readonly capacidadeMaximaTracao: string;
  /** dist — distancia entre eixos. */
  readonly distanciaEixos: string;
  readonly anoModelo: number;
  readonly anoFabricacao: number;
  /** tpPint — tipo de pintura. */
  readonly tipoPintura: string;
  /** tpVeic — tipo de veiculo (tabela DENATRAN). */
  readonly tipoVeiculo: number;
  /** espVeic — especie do veiculo (tabela DENATRAN). */
  readonly especieVeiculo: number;
  /** VIN — 'R' remarcado ou 'N' normal. */
  readonly vin: 'R' | 'N';
  /** condVeic — 1 acabado, 2 inacabado, 3 semiacabado. */
  readonly condicaoVeiculo: 1 | 2 | 3;
  /** cMod — codigo do modelo (tabela DENATRAN). */
  readonly codigoModelo: string;
  /** cCorDENATRAN — codigo da cor (tabela DENATRAN). */
  readonly codigoCorDenatran: string;
  /** lota — lotacao de passageiros. */
  readonly lotacao: number;
  /** tpRest — restricao: 0 sem restricao, 1 alienacao fiduciaria, ... */
  readonly tipoRestricao: number;
};

/**
 * Medicamento (grupo `med`).
 */
export type MedicamentoProps = {
  /** cProdANVISA — codigo do produto na ANVISA. */
  readonly codigoAnvisa: string;
  /** xMotivoIsencao — motivo da isencao de registro na ANVISA. */
  readonly motivoIsencao?: string;
  /** vPMC — preco maximo ao consumidor. */
  readonly precoMaximoConsumidor: number;
};

/**
 * Armamento (grupo `arma`).
 */
export type ArmamentoProps = {
  /** tpArma — 0 uso permitido, 1 uso restrito. */
  readonly tipo: 0 | 1;
  readonly numeroSerie: string;
  /** nCano — numero de serie do cano. */
  readonly numeroSerieCano: string;
  /** descr — descricao completa da arma. */
  readonly descricao: string;
};

/**
 * CIDE sobre combustivel (grupo `CIDE`).
 */
export type CideProps = {
  /** qBCProd — quantidade da base de calculo. */
  readonly quantidade: number;
  /** vAliqProd — aliquota por unidade. */
  readonly aliquota: number;
  /** vCIDE — valor da CIDE. */
  readonly valor: number;
};

/**
 * Encerrante da bomba de combustivel (grupo `encerrante`).
 */
export type EncerranteProps = {
  /** nBico — numero de identificacao do bico. */
  readonly bico: number;
  /** nBomba — numero da bomba. */
  readonly bomba?: number;
  /** nTanque — numero do tanque. */
  readonly tanque: number;
  /** vEncIni — valor do encerrante no inicio do abastecimento. */
  readonly valorInicial: number;
  /** vEncFin — valor do encerrante no fim do abastecimento. */
  readonly valorFinal: number;
};

/**
 * Origem do biocombustivel (grupo `origComb`).
 */
export type OrigemCombustivelProps = {
  /** indImport — 0 nacional, 1 importado. */
  readonly indicadorImportacao: 0 | 1;
  /** cUFOrig — UF de origem do produtor. */
  readonly uf: string;
  /** pOrig — percentual originario para a UF. */
  readonly percentual: number;
};

/**
 * Combustivel (grupo `comb`).
 */
export type CombustivelProps = {
  /** cProdANP — codigo do produto na ANP. */
  readonly codigoAnp: string;
  /** descANP — descricao do produto na ANP. */
  readonly descricaoAnp: string;
  /** pGLP — percentual do GLP derivado do petroleo. */
  readonly percentualGlp?: number;
  /** pGNn — percentual de gas natural nacional. */
  readonly percentualGasNacional?: number;
  /** pGNi — percentual de gas natural importado. */
  readonly percentualGasImportado?: number;
  /** vPart — valor de partida. */
  readonly valorPartida?: number;
  /** CODIF — codigo de autorizacao da SEFAZ (exigido em algumas UFs). */
  readonly codif?: string;
  /** qTemp — quantidade a temperatura ambiente. */
  readonly quantidadeTemperaturaAmbiente?: number;
  /** UFCons — UF de consumo. */
  readonly ufConsumo: string;
  readonly cide?: CideProps;
  readonly encerrante?: EncerranteProps;
  /** pBio — percentual do biocombustivel na mistura. */
  readonly percentualBiocombustivel?: number;
  readonly origens?: readonly OrigemCombustivelProps[];
};

/**
 * Produto do fisco na NFF (grupo `infProdNFF`).
 */
export type ProdutoNFFProps = {
  /** cProdFisco — codigo do produto na tabela do fisco. */
  readonly codigoFisco: string;
  /** cOperNFF — codigo da operacao selecionada na NFF. */
  readonly codigoOperacao: string;
};

/**
 * Embalagem do produto (grupo `infProdEmb`).
 */
export type EmbalagemProps = {
  /** xEmb — identificacao da embalagem. */
  readonly identificacao: string;
  /** qVolEmb — volume embalado. */
  readonly volume: number;
  /** uEmb — unidade de medida do volume. */
  readonly unidade: string;
};

/**
 * Devolucao de imposto no item (grupo `impostoDevol`).
 */
export type ImpostoDevolvidoProps = {
  /** pDevol — percentual da mercadoria devolvida. */
  readonly percentualDevolvido: number;
  /** vIPIDevol — valor do IPI devolvido. */
  readonly valorIpiDevolvido: number;
};

/**
 * DFe referenciado no item (grupo `DFeReferenciado`).
 */
export type DFeReferenciadoProps = {
  readonly chaveAcesso: string;
  /** nItem — numero do item no documento referenciado. */
  readonly numeroItem?: number;
};

/**
 * Observacao de item (grupo `obsItem`): uma do contribuinte e/ou uma do fisco.
 */
export type ObservacaoItemProps = {
  readonly contribuinte?: { readonly campo: string; readonly texto: string };
  readonly fisco?: { readonly campo: string; readonly texto: string };
};
