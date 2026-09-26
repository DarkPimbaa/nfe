import { z } from 'zod/v4';
import { enderecoSchema } from './endereco-schema';

export const destinatarioSchema = z
  .object({
    cpf: z.string().length(11).optional(),
    cnpj: z.string().length(14).optional(),
    idEstrangeiro: z.string().min(2).max(20).optional(),
    nome: z.string().min(1).max(60),
    email: z.email().max(60).optional(),
    inscricaoEstadual: z.string().max(14).optional(),
    inscricaoSuframa: z.string().min(8).max(9).optional(),
    inscricaoMunicipal: z.string().min(1).max(15).optional(),
    indicadorIE: z.literal(1).or(z.literal(2)).or(z.literal(9)),
    endereco: enderecoSchema
  })
  .refine((data) => data.cpf || data.cnpj || data.idEstrangeiro, {
    message: 'Destinatario deve ter CPF, CNPJ ou idEstrangeiro'
  });
