import { z } from 'zod/v4';

export const observacaoSchema = z.object({
  campo: z.string().min(1).max(20),
  texto: z.string().min(1).max(60)
});

export const processoReferenciadoSchema = z.object({
  numero: z.string().min(1).max(60),
  origem: z.literal(0).or(z.literal(1)).or(z.literal(2)).or(z.literal(3)).or(z.literal(9)),
  tipoAto: z.string().min(1).max(15).optional()
});

export const canaSchema = z.object({
  safra: z.string().min(4).max(9),
  referencia: z.string().min(1).max(7),
  fornecimentosDiarios: z
    .array(
      z.object({
        dia: z.int().min(1).max(31),
        quantidade: z.number().min(0)
      })
    )
    .min(1)
    .max(31),
  totalMes: z.number().min(0),
  totalAnterior: z.number().min(0),
  totalGeral: z.number().min(0),
  deducoes: z
    .array(z.object({ descricao: z.string().min(1).max(60), valor: z.number().min(0) }))
    .max(10)
    .optional(),
  valorFornecimento: z.number().min(0),
  valorTotalDeducao: z.number().min(0),
  valorLiquido: z.number().min(0)
});

export const agropecuarioSchema = z.union([
  z.object({
    defensivos: z
      .array(
        z.object({
          receituario: z.string().min(1).max(60),
          cpfResponsavelTecnico: z.string().length(11)
        })
      )
      .min(1)
      .max(20)
  }),
  z.object({
    guiaTransito: z.object({
      tipo: z.literal(1).or(z.literal(2)).or(z.literal(3)),
      uf: z.string().length(2),
      serie: z.string().min(1).max(3).optional(),
      numero: z.string().min(1).max(20)
    })
  })
]);
