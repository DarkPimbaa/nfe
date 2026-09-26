import { ProdutoProps } from '@nfe/domain/entities/Produto';
import {
  DeclaracaoImportacaoProps,
  DetalheExportacaoProps,
  RastroProps,
  CreditoPresumidoProps,
  VeiculoNovoProps,
  MedicamentoProps,
  ArmamentoProps,
  CombustivelProps,
  ImpostoDevolvidoProps,
  ObservacaoItemProps,
  DFeReferenciadoProps
} from '@nfe/domain/entities/ProdutoDetalhes';
import { UF_CODES } from '@nfe/shared/constants/ibge-codes';
import { tag, tagGroup, formatNumber, formatDateOnly } from '../xml-helper';

/**
 * Subgrupos do item (`det/prod`) que so aparecem em operacoes especificas:
 * importacao, exportacao, rastreabilidade e os produtos com regra propria.
 */

/**
 * NVE — Nomenclatura de Valor Aduaneiro e Estatistica (ate 8 por item).
 */
export function buildNve(nve?: readonly string[]): string {
  if (!nve || nve.length === 0) return '';

  return nve
    .slice(0, 8)
    .map((codigo) => tag('NVE', codigo))
    .join('');
}

/**
 * CEST + indicador de escala + CNPJ do fabricante. Sequencia opcional: o CEST
 * abre o grupo, os outros dois so existem junto dele.
 */
export function buildCest(prod: ProdutoProps): string {
  if (!prod.cest) return '';

  return (
    tag('CEST', prod.cest) +
    tag('indEscala', prod.indicadorEscala) +
    tag('CNPJFab', prod.cnpjFabricante)
  );
}

/**
 * Creditos presumidos do item (grupo `gCred`, ate 4).
 *
 * O `cCredPresumido` tem tamanho fixo de 8 ou 10 caracteres na tabela oficial.
 */
export function buildCreditosPresumidos(creditos?: readonly CreditoPresumidoProps[]): string {
  if (!creditos || creditos.length === 0) return '';

  return creditos
    .slice(0, 4)
    .map((c) =>
      tagGroup(
        'gCred',
        tag('cCredPresumido', c.codigo) +
          tag('pCredPresumido', formatNumber(c.percentual, 4)) +
          tag('vCredPresumido', formatNumber(c.valor, 2))
      )
    )
    .join('');
}

/**
 * Declaracoes de importacao com suas adicoes (grupo `DI`).
 */
export function buildDeclaracoesImportacao(dis?: readonly DeclaracaoImportacaoProps[]): string {
  if (!dis || dis.length === 0) return '';

  return dis
    .slice(0, 100)
    .map((di) => {
      const adicoes = di.adicoes
        .slice(0, 999)
        .map((adi) =>
          tagGroup(
            'adi',
            tag('nAdicao', adi.numero !== undefined ? String(adi.numero) : undefined) +
              tag('nSeqAdic', String(adi.sequencial)) +
              tag('cFabricante', adi.codigoFabricante) +
              tag(
                'vDescDI',
                adi.desconto !== undefined ? formatNumber(adi.desconto, 2) : undefined
              ) +
              tag('nDraw', adi.drawback)
          )
        )
        .join('');

      return tagGroup(
        'DI',
        tag('nDI', di.numero) +
          tag('dDI', formatDateOnly(di.dataRegistro)) +
          tag('xLocDesemb', di.localDesembaraco) +
          tag('UFDesemb', di.ufDesembaraco) +
          tag('dDesemb', formatDateOnly(di.dataDesembaraco)) +
          tag('tpViaTransp', String(di.viaTransporte)) +
          tag('vAFRMM', di.valorAfrmm !== undefined ? formatNumber(di.valorAfrmm, 2) : undefined) +
          tag('tpIntermedio', String(di.tipoIntermediacao)) +
          (di.cnpj ? tag('CNPJ', di.cnpj) : di.cpf ? tag('CPF', di.cpf) : '') +
          tag('UFTerceiro', di.ufTerceiro) +
          tag('cExportador', di.codigoExportador) +
          adicoes
      );
    })
    .join('');
}

/**
 * Detalhes de exportacao do item (grupo `detExport`).
 */
export function buildDetalhesExportacao(detalhes?: readonly DetalheExportacaoProps[]): string {
  if (!detalhes || detalhes.length === 0) return '';

  return detalhes
    .slice(0, 500)
    .map((d) => {
      const ind = d.exportacaoIndireta;

      return tagGroup(
        'detExport',
        tag('nDraw', d.drawback) +
          (ind
            ? tagGroup(
                'exportInd',
                tag('nRE', ind.registroExportacao) +
                  tag('chNFe', ind.chaveAcesso) +
                  tag('qExport', formatNumber(ind.quantidade, 4))
              )
            : '')
      );
    })
    .join('');
}

/**
 * Rastreabilidade por lote (grupo `rastro`).
 */
export function buildRastros(rastros?: readonly RastroProps[]): string {
  if (!rastros || rastros.length === 0) return '';

  return rastros
    .slice(0, 500)
    .map((r) =>
      tagGroup(
        'rastro',
        tag('nLote', r.lote) +
          tag('qLote', formatNumber(r.quantidade, 3)) +
          tag('dFab', formatDateOnly(r.dataFabricacao)) +
          tag('dVal', formatDateOnly(r.dataValidade)) +
          tag('cAgreg', r.codigoAgregacao)
      )
    )
    .join('');
}

/**
 * Veiculo novo (grupo `veicProd`).
 */
export function buildVeiculoNovo(veiculo?: VeiculoNovoProps): string {
  if (!veiculo) return '';

  return tagGroup(
    'veicProd',
    tag('tpOp', String(veiculo.tipoOperacao)) +
      tag('chassi', veiculo.chassi) +
      tag('cCor', veiculo.codigoCor) +
      tag('xCor', veiculo.cor) +
      tag('pot', veiculo.potencia) +
      tag('cilin', veiculo.cilindrada) +
      tag('pesoL', veiculo.pesoLiquido) +
      tag('pesoB', veiculo.pesoBruto) +
      tag('nSerie', veiculo.numeroSerie) +
      tag('tpComb', veiculo.tipoCombustivel) +
      tag('nMotor', veiculo.numeroMotor) +
      tag('CMT', veiculo.capacidadeMaximaTracao) +
      tag('dist', veiculo.distanciaEixos) +
      tag('anoMod', String(veiculo.anoModelo)) +
      tag('anoFab', String(veiculo.anoFabricacao)) +
      tag('tpPint', veiculo.tipoPintura) +
      tag('tpVeic', String(veiculo.tipoVeiculo)) +
      tag('espVeic', String(veiculo.especieVeiculo)) +
      tag('VIN', veiculo.vin) +
      tag('condVeic', String(veiculo.condicaoVeiculo)) +
      tag('cMod', veiculo.codigoModelo) +
      tag('cCorDENATRAN', veiculo.codigoCorDenatran) +
      tag('lota', String(veiculo.lotacao)) +
      tag('tpRest', String(veiculo.tipoRestricao))
  );
}

/**
 * Medicamento (grupo `med`).
 */
export function buildMedicamento(med?: MedicamentoProps): string {
  if (!med) return '';

  return tagGroup(
    'med',
    tag('cProdANVISA', med.codigoAnvisa) +
      tag('xMotivoIsencao', med.motivoIsencao) +
      tag('vPMC', formatNumber(med.precoMaximoConsumidor, 2))
  );
}

/**
 * Armamentos do item (grupo `arma`, ate 500).
 */
export function buildArmamentos(armas?: readonly ArmamentoProps[]): string {
  if (!armas || armas.length === 0) return '';

  return armas
    .slice(0, 500)
    .map((arma) =>
      tagGroup(
        'arma',
        tag('tpArma', String(arma.tipo)) +
          tag('nSerie', arma.numeroSerie) +
          tag('nCano', arma.numeroSerieCano) +
          tag('descr', arma.descricao)
      )
    )
    .join('');
}

/**
 * Combustivel (grupo `comb`), com CIDE, encerrante e origem do biocombustivel.
 */
export function buildCombustivel(comb?: CombustivelProps): string {
  if (!comb) return '';

  const cide = comb.cide
    ? tagGroup(
        'CIDE',
        tag('qBCProd', formatNumber(comb.cide.quantidade, 4)) +
          tag('vAliqProd', formatNumber(comb.cide.aliquota, 4)) +
          tag('vCIDE', formatNumber(comb.cide.valor, 2))
      )
    : '';

  const enc = comb.encerrante;
  const encerrante = enc
    ? tagGroup(
        'encerrante',
        tag('nBico', String(enc.bico)) +
          tag('nBomba', enc.bomba !== undefined ? String(enc.bomba) : undefined) +
          tag('nTanque', String(enc.tanque)) +
          tag('vEncIni', formatNumber(enc.valorInicial, 3)) +
          tag('vEncFin', formatNumber(enc.valorFinal, 3))
      )
    : '';

  const origens = (comb.origens ?? [])
    .slice(0, 30)
    .map((o) =>
      tagGroup(
        'origComb',
        tag('indImport', String(o.indicadorImportacao)) +
          tag('cUFOrig', UF_CODES[o.uf] || o.uf) +
          tag('pOrig', formatNumber(o.percentual, 4))
      )
    )
    .join('');

  return tagGroup(
    'comb',
    tag('cProdANP', comb.codigoAnp) +
      tag('descANP', comb.descricaoAnp) +
      tag(
        'pGLP',
        comb.percentualGlp !== undefined ? formatNumber(comb.percentualGlp, 4) : undefined
      ) +
      tag(
        'pGNn',
        comb.percentualGasNacional !== undefined
          ? formatNumber(comb.percentualGasNacional, 4)
          : undefined
      ) +
      tag(
        'pGNi',
        comb.percentualGasImportado !== undefined
          ? formatNumber(comb.percentualGasImportado, 4)
          : undefined
      ) +
      tag(
        'vPart',
        comb.valorPartida !== undefined ? formatNumber(comb.valorPartida, 2) : undefined
      ) +
      tag('CODIF', comb.codif) +
      tag(
        'qTemp',
        comb.quantidadeTemperaturaAmbiente !== undefined
          ? formatNumber(comb.quantidadeTemperaturaAmbiente, 4)
          : undefined
      ) +
      tag('UFCons', comb.ufConsumo) +
      cide +
      encerrante +
      tag(
        'pBio',
        comb.percentualBiocombustivel !== undefined
          ? formatNumber(comb.percentualBiocombustivel, 4)
          : undefined
      ) +
      origens
  );
}

/**
 * Grupo exclusivo do item: veiculo, medicamento, arma, combustivel ou RECOPI.
 * O leiaute permite apenas um deles.
 */
export function buildProdutoEspecifico(prod: ProdutoProps): string {
  if (prod.veiculoNovo) return buildVeiculoNovo(prod.veiculoNovo);
  if (prod.medicamento) return buildMedicamento(prod.medicamento);
  if (prod.armamentos?.length) return buildArmamentos(prod.armamentos);
  if (prod.combustivel) return buildCombustivel(prod.combustivel);
  if (prod.recopi) return tag('nRECOPI', prod.recopi);

  return '';
}

/**
 * Devolucao de imposto no item (grupo `impostoDevol`).
 */
export function buildImpostoDevolvido(devolucao?: ImpostoDevolvidoProps): string {
  if (!devolucao) return '';

  return tagGroup(
    'impostoDevol',
    tag('pDevol', formatNumber(devolucao.percentualDevolvido, 2)) +
      tagGroup('IPI', tag('vIPIDevol', formatNumber(devolucao.valorIpiDevolvido, 2)))
  );
}

/**
 * Observacoes do item (grupo `obsItem`): ate uma do contribuinte e uma do fisco.
 */
export function buildObservacaoItem(obs?: ObservacaoItemProps): string {
  if (!obs || (!obs.contribuinte && !obs.fisco)) return '';

  const contribuinte = obs.contribuinte
    ? tagGroup(
        'obsCont',
        tag('xTexto', obs.contribuinte.texto),
        `xCampo="${obs.contribuinte.campo}"`
      )
    : '';

  const fisco = obs.fisco
    ? tagGroup('obsFisco', tag('xTexto', obs.fisco.texto), `xCampo="${obs.fisco.campo}"`)
    : '';

  return tagGroup('obsItem', contribuinte + fisco);
}

/**
 * DFe referenciado pelo item (grupo `DFeReferenciado`).
 */
export function buildDFeReferenciado(dfe?: DFeReferenciadoProps): string {
  if (!dfe) return '';

  return tagGroup(
    'DFeReferenciado',
    tag('chaveAcesso', dfe.chaveAcesso) +
      tag('nItem', dfe.numeroItem !== undefined ? String(dfe.numeroItem) : undefined)
  );
}
