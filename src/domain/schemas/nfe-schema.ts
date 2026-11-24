import { z } from 'zod/v4';
import { errosDevolucao } from '../devolucao-regras';
import { emitenteSchema } from './emitente-schema';
import { destinatarioSchema } from './destinatario-schema';
import { produtoSchema } from './produto-schema';
import { transporteSchema } from './transporte-schema';
import { pagamentoSchema } from './pagamento-schema';
import { cobrancaSchema } from './cobranca-schema';
import {
  localSchema,
  avulsaSchema,
  intermediadorSchema,
  exportacaoSchema,
  compraSchema
} from './local-schema';
import {
  observacaoSchema,
  processoReferenciadoSchema,
  canaSchema,
  agropecuarioSchema
} from './informacoes-adicionais-schema';

export const notaReferenciadaSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('nfe'), chaveAcesso: z.string().length(44) }),
  z.object({ tipo: z.literal('cte'), chaveAcesso: z.string().length(44) }),
  z.object({
    tipo: z.literal('nf'),
    uf: z.string().length(2),
    anoMes: z.string().length(4),
    cnpj: z.string().length(14),
    modelo: z.literal('01').or(z.literal('02')),
    serie: z.int().min(0).max(999),
    numero: z.int().min(1).max(999999999)
  }),
  z.object({
    tipo: z.literal('produtorRural'),
    uf: z.string().length(2),
    anoMes: z.string().length(4),
    cnpj: z.string().length(14).optional(),
    cpf: z.string().length(11).optional(),
    inscricaoEstadual: z.string().min(2).max(14),
    modelo: z.literal('01').or(z.literal('04')),
    serie: z.int().min(0).max(999),
    numero: z.int().min(1).max(999999999)
  }),
  z.object({
    tipo: z.literal('ecf'),
    modelo: z.literal('2B').or(z.literal('2C')).or(z.literal('2D')),
    numeroEcf: z.string().min(1).max(3),
    numeroContadorOrdem: z.string().min(1).max(6)
  })
]);

export const autorizadoXmlSchema = z
  .object({
    cnpj: z.string().length(14).optional(),
    cpf: z.string().length(11).optional()
  })
  .refine((a) => Boolean(a.cnpj) !== Boolean(a.cpf), {
    message: 'Informe CNPJ ou CPF no autorizado a baixar o XML'
  });

export const responsavelTecnicoSchema = z.object({
  cnpj: z.string().length(14),
  contato: z.string().min(2).max(60),
  email: z.email().max(60),
  telefone: z.string().min(7).max(12),
  idCSRT: z.string().length(2).optional(),
  csrt: z.string().min(1).optional()
});

export const nfeIdentificacaoSchema = z.object({
  naturezaOperacao: z.string().min(1).max(60),
  tipoOperacao: z.literal(0).or(z.literal(1)),
  destinoOperacao: z.literal(1).or(z.literal(2)).or(z.literal(3)),
  finalidade: z.literal(1).or(z.literal(2)).or(z.literal(3)).or(z.literal(4)).or(z.literal(5)).or(z.literal(6)),
  consumidorFinal: z.literal(0).or(z.literal(1)),
  presencaComprador: z
    .literal(0)
    .or(z.literal(1))
    .or(z.literal(2))
    .or(z.literal(3))
    .or(z.literal(4))
    .or(z.literal(5))
    .or(z.literal(9)),
  uf: z.string().length(2),
  municipio: z.string().length(7),
  serie: z.int().min(0).max(999),
  numero: z.int().min(1).max(999999999),
  dataEmissao: z.date().optional(),
  tipoEmissao: z
    .literal(1)
    .or(z.literal(2))
    .or(z.literal(3))
    .or(z.literal(4))
    .or(z.literal(5))
    .or(z.literal(6))
    .or(z.literal(7))
    .or(z.literal(9))
    .optional(),
  tipoImpressao: z
    .literal(0)
    .or(z.literal(1))
    .or(z.literal(2))
    .or(z.literal(3))
    .or(z.literal(4))
    .or(z.literal(5))
    .optional(),
  modelo: z.literal('55').or(z.literal('65')).optional(),
  dataSaidaEntrada: z.date().optional(),
  dataPrevistaEntrega: z.date().optional(),
  municipioFatoGeradorIbs: z.string().length(7).optional(),
  indicadorIntermediador: z.literal(0).or(z.literal(1)).optional(),
  dataHoraContingencia: z.date().optional(),
  justificativaContingencia: z.string().min(15).max(256).optional(),
  notasReferenciadas: z.array(notaReferenciadaSchema).max(500).optional(),
  pagamentosAntecipados: z.array(z.string().length(44)).max(99).optional(),
  tipoNotaDebito: z.enum(['01', '02', '03', '04', '05', '06', '07', '08']).optional(),
  tipoNotaCredito: z.enum(['01', '02', '03', '04', '05', '06']).optional()
}).superRefine((id, ctx) => {
  if (id.finalidade === 5 && !id.tipoNotaCredito) {
    ctx.addIssue({
      code: 'custom',
      path: ['tipoNotaCredito'],
      message: 'Nota de credito (finNFe=5) exige tipoNotaCredito (tpNFCredito)'
    });
  }
  if (id.finalidade === 6 && !id.tipoNotaDebito) {
    ctx.addIssue({
      code: 'custom',
      path: ['tipoNotaDebito'],
      message: 'Nota de debito (finNFe=6) exige tipoNotaDebito (tpNFDebito)'
    });
  }
});

export const nfeSchema = z.object({
  identificacao: nfeIdentificacaoSchema,
  emitente: emitenteSchema,
  destinatario: destinatarioSchema.optional(),
  produtos: z.array(produtoSchema).min(1),
  transporte: transporteSchema,
  cobranca: cobrancaSchema.optional(),
  pagamento: pagamentoSchema,
  informacoesComplementares: z.string().max(5000).optional(),
  informacoesFisco: z.string().max(2000).optional(),
  autorizadosXml: z.array(autorizadoXmlSchema).max(10).optional(),
  responsavelTecnico: responsavelTecnicoSchema.optional(),
  avulsa: avulsaSchema.optional(),
  retirada: localSchema.optional(),
  entrega: localSchema.optional(),
  intermediador: intermediadorSchema.optional(),
  exportacao: exportacaoSchema.optional(),
  compra: compraSchema.optional(),
  cana: canaSchema.optional(),
  observacoesContribuinte: z.array(observacaoSchema).max(10).optional(),
  observacoesFisco: z.array(observacaoSchema).max(10).optional(),
  processosReferenciados: z.array(processoReferenciadoSchema).max(100).optional(),
  solicitacaoNFF: z.string().min(1).max(5000).optional(),
  agropecuario: agropecuarioSchema.optional(),
  valorProdutoLiquidoTotal: z.number().min(0).optional()
}).superRefine((nfe, ctx) => {
  const id = nfe.identificacao;
  const exigeRefItem =
    id.tipoNotaCredito === '06' ||
    id.tipoNotaDebito === '03' ||
    id.tipoNotaDebito === '04';
  const temRefItem = (nfe.produtos ?? []).some((p) => p?.dfeReferenciado !== undefined);
  // VC02-10 (Rej. 1038): esses motivos exigem DFeReferenciado no item.
  if (exigeRefItem && !temRefItem) {
    ctx.addIssue({
      code: 'custom',
      path: ['produtos'],
      message:
        'tpNFCredito 06 e tpNFDebito 03/04 exigem DFeReferenciado em ao menos um item (VC02-10)'
    });
  }
  // VC02-07 (Rej. 1042): nota de credito nao referencia por item, exceto tpNFCredito 06.
  if (id.finalidade === 5 && id.tipoNotaCredito !== '06' && temRefItem) {
    ctx.addIssue({
      code: 'custom',
      path: ['produtos'],
      message:
        'Nota de credito (finNFe=5) nao pode referenciar por item, exceto tpNFCredito 06 (VC02-07)'
    });
  }

  // I08-140 (Rej. 327), B25-40 (Rej. 255), VC02-14/05 (Rej. 321/1010).
  for (const erro of errosDevolucao(nfe as never)) {
    ctx.addIssue({ code: 'custom', path: ['produtos'], message: erro });
  }
});

export type NFeInput = z.infer<typeof nfeSchema>;
