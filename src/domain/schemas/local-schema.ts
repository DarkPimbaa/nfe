import { z } from 'zod/v4';

export const localSchema = z
  .object({
    cnpj: z.string().length(14).optional(),
    cpf: z.string().length(11).optional(),
    nome: z.string().min(2).max(60).optional(),
    logradouro: z.string().min(2).max(60),
    numero: z.string().min(1).max(60),
    complemento: z.string().min(1).max(60).optional(),
    bairro: z.string().min(2).max(60),
    codigoMunicipio: z.string().length(7),
    municipio: z.string().min(2).max(60),
    uf: z.string().length(2),
    cep: z.string().length(8).optional(),
    codigoPais: z.string().min(1).max(4).optional(),
    pais: z.string().min(2).max(60).optional(),
    telefone: z.string().min(6).max(14).optional(),
    email: z.email().max(60).optional(),
    inscricaoEstadual: z.string().min(2).max(14).optional()
  })
  .refine((l) => Boolean(l.cnpj) !== Boolean(l.cpf), {
    message: 'Informe CNPJ ou CPF no local de retirada/entrega'
  });

export const avulsaSchema = z.object({
  cnpj: z.string().length(14),
  orgao: z.string().min(1).max(60),
  matricula: z.string().min(1).max(60),
  agente: z.string().min(1).max(60),
  telefone: z.string().min(6).max(14).optional(),
  uf: z.string().length(2),
  numeroDar: z.string().min(1).max(60).optional(),
  dataEmissaoDar: z.date().optional(),
  valorDar: z.number().min(0).optional(),
  reparticaoEmitente: z.string().min(1).max(60),
  dataPagamento: z.date().optional()
});

export const intermediadorSchema = z.object({
  cnpj: z.string().length(14),
  identificadorVendedor: z.string().min(2).max(60)
});

export const exportacaoSchema = z.object({
  ufSaida: z.string().length(2),
  localExportacao: z.string().min(1).max(60),
  localDespacho: z.string().min(1).max(60).optional()
});

export const compraSchema = z.object({
  notaEmpenho: z.string().min(1).max(22).optional(),
  pedido: z.string().min(1).max(60).optional(),
  contrato: z.string().min(1).max(60).optional()
});
