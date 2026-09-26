import { z } from 'zod/v4';

export const volumeSchema = z.object({
  quantidade: z.number().int().min(0).optional(),
  especie: z.string().max(60).optional(),
  marca: z.string().max(60).optional(),
  numeracao: z.string().max(60).optional(),
  pesoLiquido: z.number().min(0).optional(),
  pesoBruto: z.number().min(0).optional(),
  lacres: z.array(z.string().min(1).max(60)).optional()
});

export const veiculoTranspSchema = z.object({
  placa: z.string().max(7).optional(),
  uf: z.string().length(2).optional(),
  rntc: z.string().max(20).optional()
});

export const retencaoTransporteSchema = z.object({
  valorServico: z.number().min(0),
  baseCalculoRetencao: z.number().min(0),
  aliquotaRetencao: z.number().min(0).max(100),
  valorRetencao: z.number().min(0),
  cfop: z.string().length(4),
  codigoMunicipio: z.string().length(7)
});

export const transporteSchema = z
  .object({
    modalidadeFrete: z
      .literal(0)
      .or(z.literal(1))
      .or(z.literal(2))
      .or(z.literal(3))
      .or(z.literal(4))
      .or(z.literal(9)),
    cnpjTransportadora: z.string().length(14).optional(),
    cpfTransportadora: z.string().length(11).optional(),
    nomeTransportadora: z.string().max(60).optional(),
    inscricaoEstadual: z.string().max(14).optional(),
    endereco: z.string().max(60).optional(),
    municipio: z.string().max(60).optional(),
    uf: z.string().length(2).optional(),
    retencao: retencaoTransporteSchema.optional(),
    veiculo: veiculoTranspSchema.optional(),
    reboques: z.array(veiculoTranspSchema).max(5).optional(),
    vagao: z.string().max(20).optional(),
    balsa: z.string().max(20).optional(),
    volumes: z.array(volumeSchema).max(5000).optional()
  })
  .refine((t) => !(t.vagao && t.balsa), {
    message: 'Informe apenas um modal: vagao ou balsa'
  })
  .refine((t) => !((t.vagao || t.balsa) && (t.veiculo || t.reboques?.length)), {
    message: 'Vagao/balsa nao convivem com veiculo rodoviario no mesmo transporte'
  });
