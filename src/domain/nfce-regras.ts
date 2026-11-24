import type { NFeProps } from './entities/NFe';

/**
 * Vedacoes proprias da NFC-e (modelo 65), NT 2025.002 v1.51.
 *
 * O varejo presencial usa os mesmos grupos de IBS/CBS/IS da NF-e, mas com
 * proibicoes especificas — cada uma com sua rejeicao:
 *
 * - VC02-04 (Rej. 708): NFC-e nao referencia outros documentos no item;
 * - Rej. 1153: sem dPrevEntrega (data prevista de entrega);
 * - Rej. 1165: sem classificacao de subapuracao IBS/ZFM (tpCredPresIBSZFM);
 * - UB62-10 (Rej. 1187): gDevTrib da CBS e indevido no modelo 65;
 * - Rej. 1146: sem NF-e referenciada de pagamento antecipado;
 * - Rej. 1049: credito presumido nao e permitido;
 * - B25b-20 (Rej. 717): operacao nao presencial, salvo indPres 1, 4 ou 5.
 *
 * (cIndOp, Rej. 1099, nao precisa de regra: a lib nem emite o campo.)
 */
export function errosNFCe(nfe: NFeProps): string[] {
  const id = nfe.identificacao;
  if (!id || (id.modelo ?? '55') !== '65') return [];
  const erros: string[] = [];

  if ((nfe.produtos ?? []).some((p) => p?.dfeReferenciado !== undefined)) {
    erros.push('NFC-e nao pode referenciar outros documentos no item (VC02-04, Rej. 708)');
  }

  if (id.dataPrevistaEntrega !== undefined) {
    erros.push('NFC-e nao usa dPrevEntrega (Rej. 1153)');
  }

  if ((nfe.produtos ?? []).some((p) => p?.tipoCreditoPresumidoIbsZfm !== undefined)) {
    erros.push('NFC-e nao usa tpCredPresIBSZFM (Rej. 1165)');
  }

  if (
    (nfe.produtos ?? []).some(
      (p) => p?.ibsCbs?.cbs?.tributoDevolvido !== undefined
    )
  ) {
    erros.push('Devolucao de tributo da CBS (gDevTrib) e indevida na NFC-e (UB62-10, Rej. 1187)');
  }

  if (id.pagamentosAntecipados !== undefined && id.pagamentosAntecipados.length > 0) {
    erros.push('NFC-e nao admite NF-e referenciada de pagamento antecipado (Rej. 1146)');
  }

  if (
    (nfe.produtos ?? []).some(
      (p) => p?.ibsCbs?.creditoPresumido !== undefined || p?.ibsCbs?.creditoPresumidoZfm !== undefined
    )
  ) {
    erros.push('Credito presumido nao e permitido na NFC-e (Rej. 1049)');
  }

  if (id.presencaComprador !== 1 && id.presencaComprador !== 4 && id.presencaComprador !== 5) {
    erros.push(
      `NFC-e com indPres ${id.presencaComprador}: operacao nao presencial, salvo indPres 1, 4 ou 5 (B25b-20, Rej. 717)`
    );
  }

  return erros;
}
