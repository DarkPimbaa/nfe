import type { NFeProps } from './entities/NFe';

/**
 * Tabela de classificacao tributaria do IBS/CBS (cClassTrib).
 *
 * Fonte: Informe Tecnico 2025.002 v1.71 (planilha oficial publicada no
 * Portal NF-e / SVRS em 30/10/2026, aprovada pelo Ato Tecnico Conjunto
 * RFB/SUFIS/CGIBS/Diretoria-Executiva n. 10/2026). 173 codigos, 18 CSTs.
 *
 * Campos por codigo: permissao por modelo (indNFe/indNFCe) e vigencia.
 * Codigos com inicio = fim de vigencia (ex.: CST 220, encerrados pela
 * v1.60) sao marcados como nao vigentes.
 */

export const CST_IBS_CBS: ReadonlySet<string> = new Set([
  '000',
  '010',
  '011',
  '200',
  '220',
  '221',
  '222',
  '400',
  '410',
  '510',
  '515',
  '550',
  '620',
  '800',
  '810',
  '811',
  '820',
  '830',
]);

export type CClassTribInfo = {
  readonly codigo: string;
  readonly nfe: boolean;
  readonly nfce: boolean;
  readonly vigente: boolean;
};

const TABELA: readonly CClassTribInfo[] = [
  { codigo: '000001', nfe: true, nfce: true, vigente: true },
  { codigo: '000002', nfe: false, nfce: false, vigente: true },
  { codigo: '000003', nfe: true, nfce: false, vigente: true },
  { codigo: '000004', nfe: true, nfce: false, vigente: true },
  { codigo: '000005', nfe: true, nfce: false, vigente: true },
  { codigo: '000006', nfe: false, nfce: false, vigente: true },
  { codigo: '010001', nfe: false, nfce: false, vigente: true },
  { codigo: '010002', nfe: false, nfce: false, vigente: true },
  { codigo: '011001', nfe: false, nfce: false, vigente: true },
  { codigo: '011002', nfe: false, nfce: false, vigente: true },
  { codigo: '011003', nfe: false, nfce: false, vigente: true },
  { codigo: '011004', nfe: false, nfce: false, vigente: true },
  { codigo: '011005', nfe: false, nfce: false, vigente: true },
  { codigo: '200001', nfe: false, nfce: false, vigente: true },
  { codigo: '200002', nfe: true, nfce: true, vigente: true },
  { codigo: '200003', nfe: true, nfce: true, vigente: true },
  { codigo: '200004', nfe: true, nfce: true, vigente: true },
  { codigo: '200005', nfe: true, nfce: false, vigente: true },
  { codigo: '200006', nfe: true, nfce: true, vigente: true },
  { codigo: '200007', nfe: true, nfce: true, vigente: true },
  { codigo: '200008', nfe: true, nfce: false, vigente: true },
  { codigo: '200009', nfe: true, nfce: true, vigente: true },
  { codigo: '200010', nfe: true, nfce: true, vigente: true },
  { codigo: '200011', nfe: true, nfce: false, vigente: true },
  { codigo: '200012', nfe: true, nfce: true, vigente: true },
  { codigo: '200013', nfe: true, nfce: true, vigente: true },
  { codigo: '200014', nfe: true, nfce: true, vigente: true },
  { codigo: '200015', nfe: true, nfce: true, vigente: true },
  { codigo: '200016', nfe: false, nfce: false, vigente: true },
  { codigo: '200017', nfe: false, nfce: false, vigente: true },
  { codigo: '200018', nfe: false, nfce: false, vigente: true },
  { codigo: '200019', nfe: false, nfce: false, vigente: true },
  { codigo: '200020', nfe: true, nfce: true, vigente: true },
  { codigo: '200021', nfe: false, nfce: false, vigente: true },
  { codigo: '200022', nfe: true, nfce: false, vigente: true },
  { codigo: '200023', nfe: true, nfce: false, vigente: true },
  { codigo: '200024', nfe: true, nfce: false, vigente: true },
  { codigo: '200025', nfe: false, nfce: false, vigente: true },
  { codigo: '200026', nfe: false, nfce: false, vigente: true },
  { codigo: '200027', nfe: false, nfce: false, vigente: true },
  { codigo: '200028', nfe: false, nfce: false, vigente: true },
  { codigo: '200029', nfe: false, nfce: false, vigente: true },
  { codigo: '200030', nfe: true, nfce: true, vigente: true },
  { codigo: '200031', nfe: true, nfce: true, vigente: true },
  { codigo: '200032', nfe: true, nfce: true, vigente: true },
  { codigo: '200033', nfe: true, nfce: true, vigente: true },
  { codigo: '200034', nfe: true, nfce: true, vigente: true },
  { codigo: '200035', nfe: true, nfce: true, vigente: true },
  { codigo: '200036', nfe: true, nfce: true, vigente: true },
  { codigo: '200037', nfe: false, nfce: false, vigente: true },
  { codigo: '200038', nfe: true, nfce: true, vigente: true },
  { codigo: '200039', nfe: true, nfce: false, vigente: true },
  { codigo: '200040', nfe: false, nfce: false, vigente: true },
  { codigo: '200041', nfe: false, nfce: false, vigente: true },
  { codigo: '200042', nfe: false, nfce: false, vigente: true },
  { codigo: '200043', nfe: true, nfce: false, vigente: true },
  { codigo: '200044', nfe: false, nfce: false, vigente: true },
  { codigo: '200045', nfe: false, nfce: false, vigente: true },
  { codigo: '200046', nfe: false, nfce: false, vigente: true },
  { codigo: '200047', nfe: true, nfce: true, vigente: true },
  { codigo: '200048', nfe: false, nfce: false, vigente: true },
  { codigo: '200049', nfe: false, nfce: false, vigente: true },
  { codigo: '200050', nfe: false, nfce: false, vigente: true },
  { codigo: '200051', nfe: false, nfce: false, vigente: true },
  { codigo: '200052', nfe: false, nfce: false, vigente: true },
  { codigo: '200053', nfe: true, nfce: true, vigente: true },
  { codigo: '200054', nfe: true, nfce: true, vigente: true },
  { codigo: '200055', nfe: false, nfce: false, vigente: true },
  { codigo: '200056', nfe: false, nfce: false, vigente: true },
  { codigo: '220001', nfe: false, nfce: false, vigente: false },
  { codigo: '220002', nfe: false, nfce: false, vigente: false },
  { codigo: '220003', nfe: false, nfce: false, vigente: false },
  { codigo: '221001', nfe: false, nfce: false, vigente: true },
  { codigo: '221002', nfe: false, nfce: false, vigente: true },
  { codigo: '221003', nfe: false, nfce: false, vigente: true },
  { codigo: '221004', nfe: false, nfce: false, vigente: true },
  { codigo: '222001', nfe: false, nfce: false, vigente: true },
  { codigo: '400001', nfe: false, nfce: false, vigente: true },
  { codigo: '400002', nfe: false, nfce: false, vigente: true },
  { codigo: '400003', nfe: false, nfce: false, vigente: true },
  { codigo: '400004', nfe: false, nfce: false, vigente: true },
  { codigo: '410001', nfe: true, nfce: true, vigente: true },
  { codigo: '410002', nfe: true, nfce: false, vigente: true },
  { codigo: '410003', nfe: true, nfce: true, vigente: true },
  { codigo: '410004', nfe: true, nfce: false, vigente: true },
  { codigo: '410005', nfe: true, nfce: true, vigente: true },
  { codigo: '410006', nfe: true, nfce: true, vigente: true },
  { codigo: '410007', nfe: true, nfce: true, vigente: true },
  { codigo: '410008', nfe: true, nfce: true, vigente: true },
  { codigo: '410009', nfe: true, nfce: true, vigente: true },
  { codigo: '410010', nfe: false, nfce: false, vigente: true },
  { codigo: '410011', nfe: false, nfce: false, vigente: true },
  { codigo: '410012', nfe: true, nfce: true, vigente: true },
  { codigo: '410013', nfe: true, nfce: false, vigente: true },
  { codigo: '410014', nfe: true, nfce: true, vigente: true },
  { codigo: '410015', nfe: false, nfce: false, vigente: true },
  { codigo: '410016', nfe: true, nfce: false, vigente: true },
  { codigo: '410017', nfe: true, nfce: false, vigente: true },
  { codigo: '410018', nfe: false, nfce: false, vigente: true },
  { codigo: '410019', nfe: true, nfce: true, vigente: true },
  { codigo: '410020', nfe: true, nfce: true, vigente: true },
  { codigo: '410021', nfe: false, nfce: false, vigente: true },
  { codigo: '410022', nfe: true, nfce: false, vigente: true },
  { codigo: '410023', nfe: true, nfce: false, vigente: true },
  { codigo: '410024', nfe: true, nfce: false, vigente: true },
  { codigo: '410025', nfe: true, nfce: false, vigente: true },
  { codigo: '410026', nfe: true, nfce: true, vigente: true },
  { codigo: '410027', nfe: true, nfce: false, vigente: true },
  { codigo: '410028', nfe: false, nfce: false, vigente: true },
  { codigo: '410029', nfe: true, nfce: true, vigente: true },
  { codigo: '410030', nfe: true, nfce: false, vigente: true },
  { codigo: '410031', nfe: true, nfce: false, vigente: true },
  { codigo: '410032', nfe: false, nfce: false, vigente: true },
  { codigo: '410033', nfe: false, nfce: false, vigente: true },
  { codigo: '410034', nfe: false, nfce: false, vigente: true },
  { codigo: '410035', nfe: true, nfce: true, vigente: true },
  { codigo: '410036', nfe: false, nfce: false, vigente: true },
  { codigo: '410037', nfe: false, nfce: false, vigente: true },
  { codigo: '410999', nfe: true, nfce: true, vigente: true },
  { codigo: '510001', nfe: true, nfce: false, vigente: true },
  { codigo: '515001', nfe: true, nfce: false, vigente: true },
  { codigo: '550001', nfe: true, nfce: false, vigente: true },
  { codigo: '550002', nfe: false, nfce: false, vigente: true },
  { codigo: '550003', nfe: true, nfce: false, vigente: true },
  { codigo: '550004', nfe: true, nfce: false, vigente: true },
  { codigo: '550005', nfe: true, nfce: false, vigente: true },
  { codigo: '550006', nfe: true, nfce: false, vigente: true },
  { codigo: '550007', nfe: true, nfce: false, vigente: true },
  { codigo: '550008', nfe: true, nfce: false, vigente: true },
  { codigo: '550009', nfe: true, nfce: false, vigente: true },
  { codigo: '550010', nfe: true, nfce: false, vigente: true },
  { codigo: '550011', nfe: true, nfce: false, vigente: true },
  { codigo: '550012', nfe: true, nfce: false, vigente: true },
  { codigo: '550013', nfe: true, nfce: false, vigente: true },
  { codigo: '550014', nfe: true, nfce: false, vigente: true },
  { codigo: '550015', nfe: true, nfce: false, vigente: true },
  { codigo: '550016', nfe: true, nfce: false, vigente: true },
  { codigo: '550017', nfe: true, nfce: false, vigente: true },
  { codigo: '550018', nfe: true, nfce: false, vigente: true },
  { codigo: '550019', nfe: true, nfce: false, vigente: true },
  { codigo: '550020', nfe: true, nfce: false, vigente: true },
  { codigo: '550021', nfe: true, nfce: false, vigente: true },
  { codigo: '550022', nfe: true, nfce: false, vigente: true },
  { codigo: '550023', nfe: true, nfce: false, vigente: true },
  { codigo: '550024', nfe: false, nfce: false, vigente: true },
  { codigo: '550025', nfe: false, nfce: false, vigente: true },
  { codigo: '550026', nfe: true, nfce: false, vigente: true },
  { codigo: '550027', nfe: true, nfce: false, vigente: true },
  { codigo: '550028', nfe: true, nfce: false, vigente: true },
  { codigo: '550029', nfe: true, nfce: false, vigente: true },
  { codigo: '620001', nfe: true, nfce: false, vigente: true },
  { codigo: '620002', nfe: true, nfce: false, vigente: true },
  { codigo: '620003', nfe: true, nfce: false, vigente: true },
  { codigo: '620004', nfe: true, nfce: false, vigente: true },
  { codigo: '620005', nfe: true, nfce: false, vigente: true },
  { codigo: '620006', nfe: true, nfce: true, vigente: true },
  { codigo: '620007', nfe: true, nfce: false, vigente: true },
  { codigo: '800001', nfe: true, nfce: false, vigente: true },
  { codigo: '800002', nfe: true, nfce: false, vigente: true },
  { codigo: '810001', nfe: true, nfce: false, vigente: true },
  { codigo: '811001', nfe: true, nfce: false, vigente: true },
  { codigo: '811002', nfe: true, nfce: false, vigente: true },
  { codigo: '811003', nfe: true, nfce: false, vigente: true },
  { codigo: '820001', nfe: false, nfce: false, vigente: true },
  { codigo: '820002', nfe: false, nfce: false, vigente: true },
  { codigo: '820003', nfe: false, nfce: false, vigente: true },
  { codigo: '820004', nfe: false, nfce: false, vigente: true },
  { codigo: '820005', nfe: false, nfce: false, vigente: true },
  { codigo: '820006', nfe: false, nfce: false, vigente: true },
  { codigo: '820007', nfe: false, nfce: false, vigente: true },
  { codigo: '820008', nfe: false, nfce: false, vigente: true },
  { codigo: '820009', nfe: false, nfce: false, vigente: true },
  { codigo: '830001', nfe: true, nfce: false, vigente: true },
];

const POR_CODIGO: ReadonlyMap<string, CClassTribInfo> = new Map(
  TABELA.map((info) => [info.codigo, info] as const)
);

/** Busca o codigo na tabela oficial (undefined = inexistente). */
export function infoCClassTrib(codigo: string): CClassTribInfo | undefined {
  return POR_CODIGO.get(codigo);
}

/** CST valido do IBS/CBS (um dos 18 da IT 2025.002). */
export function isCstIbsCbs(cst: string): boolean {
  return CST_IBS_CBS.has(cst);
}

/**
 * UB14 (NT 2025.002): par CST x cClassTrib x modelo do item.
 *
 * - UB14-10 (Rej. 1023): codigo inexistente (ou fora de vigencia) na tabela;
 * - UB14-20 (Rej. 1024): prefixo do cClassTrib (3 primeiros digitos) diferente
 *   do CST informado no item;
 * - UB14-25 (Rej. 1025): codigo nao permitido para o modelo do documento
 *   (indNFe/indNFCe da tabela oficial).
 */
export function errosCClassTrib(nfe: NFeProps): string[] {
  const modelo = nfe.identificacao?.modelo ?? '55';
  const erros: string[] = [];

  (nfe.produtos ?? []).forEach((prod, i) => {
    const ibs = prod.ibsCbs;
    if (!ibs) return;
    const rotulo = `Item ${prod.numero ?? i + 1}`;

    if (!isCstIbsCbs(ibs.cst)) {
      erros.push(`${rotulo}: CST ${ibs.cst} do IBS/CBS nao consta na tabela oficial (18 CSTs)`);
      return;
    }

    const info = infoCClassTrib(ibs.cClassTrib);
    if (!info || !info.vigente) {
      erros.push(
        `${rotulo}: cClassTrib ${ibs.cClassTrib} inexistente${info ? ' (fora de vigencia)' : ''} na IT 2025.002 (UB14-10, Rej. 1023)`
      );
      return;
    }

    if (!ibs.cClassTrib.startsWith(ibs.cst)) {
      erros.push(
        `${rotulo}: cClassTrib ${ibs.cClassTrib} nao pertence ao CST ${ibs.cst} (UB14-20, Rej. 1024)`
      );
    }

    const permitido = modelo === '65' ? info.nfce : info.nfe;
    if (!permitido) {
      erros.push(
        `${rotulo}: cClassTrib ${ibs.cClassTrib} vedado no modelo ${modelo} (UB14-25, Rej. 1025)`
      );
    }
  });

  return erros;
}
