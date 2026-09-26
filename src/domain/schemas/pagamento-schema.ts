import { z } from 'zod/v4';

export const formaPagamentoSchema = z
  .object({
    formaPagamento: z.string().length(2),
    valor: z.number().min(0),
    indicadorPagamento: z.literal(0).or(z.literal(1)).optional(),
    descricao: z.string().min(2).max(60).optional(),
    dataPagamento: z.date().optional(),
    cnpjPagador: z.string().length(14).optional(),
    ufPagador: z.string().length(2).optional(),
    tipoIntegracao: z.literal(1).or(z.literal(2)).optional(),
    cnpjCredenciadora: z.string().length(14).optional(),
    bandeira: z.string().max(2).optional(),
    autorizacao: z.string().max(20).optional(),
    cnpjRecebedor: z.string().length(14).optional(),
    idTerminalPagamento: z.string().min(1).max(40).optional()
  })
  .refine((p) => Boolean(p.cnpjPagador) === Boolean(p.ufPagador), {
    message: 'CNPJPag e UFPag andam juntos: informe os dois ou nenhum'
  });

export const pagamentoSchema = z.object({
  pagamentos: z.array(formaPagamentoSchema).min(1).max(100),
  troco: z.number().min(0).optional()
});
