import { z } from 'zod/v4';

export const faturaSchema = z.object({
  nFat: z.string().max(60).optional(),
  vOrig: z.number().min(0).optional(),
  vDesc: z.number().min(0).optional(),
  vLiq: z.number().min(0).optional()
});

export const duplicataSchema = z.object({
  nDup: z.string().min(1).max(60),
  /** dVenc — data de vencimento da parcela, no formato AAAA-MM-DD. */
  dVenc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD'),
  vDup: z.number().min(0)
});

export const cobrancaSchema = z.object({
  fatura: faturaSchema.optional(),
  /** O leiaute aceita ate 120 parcelas por nota. */
  duplicatas: z.array(duplicataSchema).max(120).optional()
});
