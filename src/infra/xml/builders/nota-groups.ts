import {
  LocalProps,
  AvulsaProps,
  IntermediadorProps,
  ExportacaoProps,
  CompraProps
} from '@nfe/domain/entities/Local';
import {
  ObservacaoProps,
  ProcessoReferenciadoProps,
  CanaProps,
  AgropecuarioProps
} from '@nfe/domain/entities/InformacoesAdicionais';
import { TransporteProps, VeiculoTranspProps } from '@nfe/domain/entities/Transporte';
import { tag, tagGroup, formatNumber, formatDateOnly } from '../xml-helper';

/**
 * Grupos de nivel de nota do leiaute 4.00 — os que ficam soltos dentro do
 * `infNFe`, fora de `det` e `imposto`.
 */

/**
 * Emissao avulsa pelo fisco (grupo `avulsa`).
 */
export function buildAvulsa(avulsa?: AvulsaProps): string {
  if (!avulsa) return '';

  return tagGroup(
    'avulsa',
    tag('CNPJ', avulsa.cnpj) +
      tag('xOrgao', avulsa.orgao) +
      tag('matr', avulsa.matricula) +
      tag('xAgente', avulsa.agente) +
      tag('fone', avulsa.telefone) +
      tag('UF', avulsa.uf) +
      tag('nDAR', avulsa.numeroDar) +
      tag('dEmi', avulsa.dataEmissaoDar ? formatDateOnly(avulsa.dataEmissaoDar) : undefined) +
      tag('vDAR', avulsa.valorDar !== undefined ? formatNumber(avulsa.valorDar, 2) : undefined) +
      tag('repEmi', avulsa.reparticaoEmitente) +
      tag('dPag', avulsa.dataPagamento ? formatDateOnly(avulsa.dataPagamento) : undefined)
  );
}

/**
 * Local de retirada ou de entrega (tipo TLocal).
 */
export function buildLocal(tagName: 'retirada' | 'entrega', local?: LocalProps): string {
  if (!local) return '';

  return tagGroup(
    tagName,
    (local.cnpj ? tag('CNPJ', local.cnpj) : tag('CPF', local.cpf)) +
      tag('xNome', local.nome) +
      tag('xLgr', local.logradouro) +
      tag('nro', local.numero) +
      tag('xCpl', local.complemento) +
      tag('xBairro', local.bairro) +
      tag('cMun', local.codigoMunicipio) +
      tag('xMun', local.municipio) +
      tag('UF', local.uf) +
      tag('CEP', local.cep) +
      tag('cPais', local.codigoPais) +
      tag('xPais', local.pais) +
      tag('fone', local.telefone) +
      tag('email', local.email) +
      tag('IE', local.inscricaoEstadual)
  );
}

/**
 * Intermediador da operacao (grupo `infIntermed`).
 */
export function buildIntermediador(intermediador?: IntermediadorProps): string {
  if (!intermediador) return '';

  return tagGroup(
    'infIntermed',
    tag('CNPJ', intermediador.cnpj) + tag('idCadIntTran', intermediador.identificadorVendedor)
  );
}

/**
 * Comercio exterior (grupo `exporta`).
 */
export function buildExportacao(exportacao?: ExportacaoProps): string {
  if (!exportacao) return '';

  return tagGroup(
    'exporta',
    tag('UFSaidaPais', exportacao.ufSaida) +
      tag('xLocExporta', exportacao.localExportacao) +
      tag('xLocDespacho', exportacao.localDespacho)
  );
}

/**
 * Compra publica (grupo `compra`).
 */
export function buildCompra(compra?: CompraProps): string {
  if (!compra) return '';

  const conteudo =
    tag('xNEmp', compra.notaEmpenho) + tag('xPed', compra.pedido) + tag('xCont', compra.contrato);

  return conteudo ? tagGroup('compra', conteudo) : '';
}

/**
 * Aquisicao de cana-de-acucar (grupo `cana`).
 */
export function buildCana(cana?: CanaProps): string {
  if (!cana) return '';

  const forDia = cana.fornecimentosDiarios
    .map((f) => tagGroup('forDia', tag('qtde', formatNumber(f.quantidade, 10)), `dia="${f.dia}"`))
    .join('');

  const deduc = (cana.deducoes ?? [])
    .map((d) => tagGroup('deduc', tag('xDed', d.descricao) + tag('vDed', formatNumber(d.valor, 2))))
    .join('');

  return tagGroup(
    'cana',
    tag('safra', cana.safra) +
      tag('ref', cana.referencia) +
      forDia +
      tag('qTotMes', formatNumber(cana.totalMes, 10)) +
      tag('qTotAnt', formatNumber(cana.totalAnterior, 10)) +
      tag('qTotGer', formatNumber(cana.totalGeral, 10)) +
      deduc +
      tag('vFor', formatNumber(cana.valorFornecimento, 2)) +
      tag('vTotDed', formatNumber(cana.valorTotalDeducao, 2)) +
      tag('vLiqFor', formatNumber(cana.valorLiquido, 2))
  );
}

/**
 * Rastreabilidade agropecuaria (grupo `agropecuario`): defensivos OU guia de
 * transito, nunca os dois.
 */
export function buildAgropecuario(agro?: AgropecuarioProps): string {
  if (!agro) return '';

  if (agro.defensivos) {
    const defensivos = agro.defensivos
      .slice(0, 20)
      .map((d) =>
        tagGroup(
          'defensivo',
          tag('nReceituario', d.receituario) + tag('CPFRespTec', d.cpfResponsavelTecnico)
        )
      )
      .join('');

    return defensivos ? tagGroup('agropecuario', defensivos) : '';
  }

  const guia = agro.guiaTransito;

  return tagGroup(
    'agropecuario',
    tagGroup(
      'guiaTransito',
      tag('tpGuia', String(guia.tipo)) +
        tag('UFGuia', guia.uf) +
        tag('serieGuia', guia.serie) +
        tag('nGuia', guia.numero)
    )
  );
}

/**
 * Observacoes de uso livre (`obsCont` do contribuinte, `obsFisco` do fisco).
 */
export function buildObservacoes(
  tagName: 'obsCont' | 'obsFisco',
  observacoes?: readonly ObservacaoProps[]
): string {
  if (!observacoes || observacoes.length === 0) return '';

  return observacoes
    .slice(0, 10)
    .map((obs) => tagGroup(tagName, tag('xTexto', obs.texto), `xCampo="${obs.campo}"`))
    .join('');
}

/**
 * Processos ou atos concessorios referenciados (grupo `procRef`).
 */
export function buildProcessosReferenciados(
  processos?: readonly ProcessoReferenciadoProps[]
): string {
  if (!processos || processos.length === 0) return '';

  return processos
    .slice(0, 100)
    .map((p) =>
      tagGroup(
        'procRef',
        tag('nProc', p.numero) + tag('indProc', String(p.origem)) + tag('tpAto', p.tipoAto)
      )
    )
    .join('');
}

/**
 * Bloco `infAdic` completo: textos livres, observacoes e processos referenciados.
 */
export function buildInformacoesAdicionais(params: {
  readonly complementar?: string;
  readonly fisco?: string;
  readonly observacoesContribuinte?: readonly ObservacaoProps[];
  readonly observacoesFisco?: readonly ObservacaoProps[];
  readonly processosReferenciados?: readonly ProcessoReferenciadoProps[];
}): string {
  const conteudo =
    tag('infAdFisco', params.fisco) +
    tag('infCpl', params.complementar) +
    buildObservacoes('obsCont', params.observacoesContribuinte) +
    buildObservacoes('obsFisco', params.observacoesFisco) +
    buildProcessosReferenciados(params.processosReferenciados);

  return conteudo ? tagGroup('infAdic', conteudo) : '';
}

function buildVeiculo(tagName: string, veiculo: VeiculoTranspProps): string {
  return tagGroup(
    tagName,
    tag('placa', veiculo.placa) + tag('UF', veiculo.uf) + tag('RNTC', veiculo.rntc)
  );
}

/**
 * Bloco `transp` completo: transportadora, retencao de ICMS sobre o frete,
 * modal (veiculo + reboques, vagao ou balsa) e volumes com lacres.
 */
export function buildTransporte(transp: TransporteProps): string {
  const documento = transp.cnpjTransportadora
    ? tag('CNPJ', transp.cnpjTransportadora)
    : transp.cpfTransportadora
      ? tag('CPF', transp.cpfTransportadora)
      : '';

  const dadosTransportadora =
    documento +
    tag('xNome', transp.nomeTransportadora) +
    tag('IE', transp.inscricaoEstadual) +
    tag('xEnder', transp.endereco) +
    tag('xMun', transp.municipio) +
    tag('UF', transp.uf);

  const transportadora = dadosTransportadora ? tagGroup('transporta', dadosTransportadora) : '';

  const ret = transp.retencao;
  const retTransp = !ret
    ? ''
    : tagGroup(
        'retTransp',
        tag('vServ', formatNumber(ret.valorServico, 2)) +
          tag('vBCRet', formatNumber(ret.baseCalculoRetencao, 2)) +
          tag('pICMSRet', formatNumber(ret.aliquotaRetencao, 4)) +
          tag('vICMSRet', formatNumber(ret.valorRetencao, 2)) +
          tag('CFOP', ret.cfop) +
          tag('cMunFG', ret.codigoMunicipio)
      );

  // O leiaute permite um unico modal: rodoviario (veiculo + reboques),
  // ferroviario (vagao) ou aquaviario (balsa).
  let modal = '';
  if (transp.vagao) {
    modal = tag('vagao', transp.vagao);
  } else if (transp.balsa) {
    modal = tag('balsa', transp.balsa);
  } else {
    modal =
      (transp.veiculo ? buildVeiculo('veicTransp', transp.veiculo) : '') +
      (transp.reboques ?? [])
        .slice(0, 5)
        .map((reboque) => buildVeiculo('reboque', reboque))
        .join('');
  }

  const volumes = (transp.volumes ?? [])
    .map((vol) => {
      const lacres = (vol.lacres ?? [])
        .map((nLacre) => tagGroup('lacres', tag('nLacre', nLacre)))
        .join('');

      return tagGroup(
        'vol',
        tag('qVol', vol.quantidade !== undefined ? String(vol.quantidade) : undefined) +
          tag('esp', vol.especie) +
          tag('marca', vol.marca) +
          tag('nVol', vol.numeracao) +
          tag(
            'pesoL',
            vol.pesoLiquido !== undefined ? formatNumber(vol.pesoLiquido, 3) : undefined
          ) +
          tag('pesoB', vol.pesoBruto !== undefined ? formatNumber(vol.pesoBruto, 3) : undefined) +
          lacres
      );
    })
    .join('');

  return tagGroup(
    'transp',
    tag('modFrete', String(transp.modalidadeFrete)) + transportadora + retTransp + modal + volumes
  );
}
