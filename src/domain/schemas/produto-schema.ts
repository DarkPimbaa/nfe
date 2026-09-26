import { z } from 'zod/v4';

export const icmsSchema = z.object({
  origem: z.int().min(0).max(8),
  cst: z.string().length(2).optional(),
  csosn: z.string().min(3).max(3).optional(),
  aliquota: z.number().min(0).optional(),
  baseCalculo: z.number().min(0).optional(),
  valor: z.number().min(0).optional(),

  modalidadeBaseCalculo: z.int().min(0).max(3).optional(),
  percentualReducaoBase: z.number().min(0).max(100).optional(),

  baseCalculoFcp: z.number().min(0).optional(),
  aliquotaFcp: z.number().min(0).max(100).optional(),
  valorFcp: z.number().min(0).optional(),

  modalidadeBaseCalculoST: z.int().min(0).max(5).optional(),
  percentualMva: z.number().min(0).optional(),
  percentualReducaoBaseST: z.number().min(0).max(100).optional(),
  baseCalculoST: z.number().min(0).optional(),
  aliquotaST: z.number().min(0).max(100).optional(),
  valorST: z.number().min(0).optional(),
  baseCalculoFcpST: z.number().min(0).optional(),
  aliquotaFcpST: z.number().min(0).max(100).optional(),
  valorFcpST: z.number().min(0).optional(),

  baseCalculoSTRetido: z.number().min(0).optional(),
  aliquotaSTConsumidorFinal: z.number().min(0).max(100).optional(),
  valorSTRetido: z.number().min(0).optional(),
  valorSubstituto: z.number().min(0).optional(),
  baseCalculoFcpSTRetido: z.number().min(0).optional(),
  aliquotaFcpSTRetido: z.number().min(0).max(100).optional(),
  valorFcpSTRetido: z.number().min(0).optional(),

  valorDesonerado: z.number().min(0).optional(),
  motivoDesoneracao: z.int().min(0).max(99).optional(),

  percentualDiferimento: z.number().min(0).max(100).optional(),

  aliquotaCreditoSN: z.number().min(0).max(100).optional(),
  valorCreditoSN: z.number().min(0).optional(),

  percentualBaseOperacaoPropria: z.number().min(0).max(100).optional(),
  ufSt: z.string().length(2).optional(),

  codigoBeneficioReducaoBase: z.string().min(8).max(10).optional(),
  valorOperacao: z.number().min(0).optional(),
  percentualFcpDiferido: z.number().min(0).max(100).optional(),
  valorFcpDiferido: z.number().min(0).optional(),
  valorFcpEfetivo: z.number().min(0).optional(),

  indicadorDeducaoDesoneracao: z.literal(0).or(z.literal(1)).optional(),
  valorStDesonerado: z.number().min(0).optional(),
  motivoStDesoneracao: z.int().min(0).max(99).optional(),

  baseCalculoSTDestino: z.number().min(0).optional(),
  valorSTDestino: z.number().min(0).optional(),

  efetivo: z
    .object({
      percentualReducaoBase: z.number().min(0).max(100),
      baseCalculo: z.number().min(0),
      aliquota: z.number().min(0).max(100),
      valor: z.number().min(0)
    })
    .optional(),

  monofasico: z
    .object({
      quantidade: z.number().min(0).optional(),
      aliquotaAdRem: z.number().min(0).optional(),
      valor: z.number().min(0).optional(),
      quantidadeRetencao: z.number().min(0).optional(),
      aliquotaAdRemRetencao: z.number().min(0).optional(),
      valorRetencao: z.number().min(0).optional(),
      percentualReducaoAdRem: z.number().min(0).max(100).optional(),
      motivoReducaoAdRem: z.int().min(0).max(9).optional(),
      quantidadeRetido: z.number().min(0).optional(),
      aliquotaAdRemRetido: z.number().min(0).optional(),
      valorRetido: z.number().min(0).optional(),
      valorOperacao: z.number().min(0).optional(),
      percentualDiferimento: z.number().min(0).max(100).optional(),
      valorDiferido: z.number().min(0).optional(),
      quantidadeDiferida: z.number().min(0).optional(),
      aliquotaAdRemDiferida: z.number().min(0).optional()
    })
    .optional()
});

export const icmsUfDestSchema = z.object({
  baseCalculo: z.number().min(0).optional(),
  baseCalculoFcp: z.number().min(0).optional(),
  aliquotaFcp: z.number().min(0).max(100).optional(),
  aliquotaInterna: z.number().min(0).max(100),
  aliquotaInterestadual: z.literal(4).or(z.literal(7)).or(z.literal(12)),
  percentualPartilha: z.number().min(0).max(100).optional()
});

export const pisSchema = z.object({
  cst: z.string().length(2),
  baseCalculo: z.number().min(0).optional(),
  aliquota: z.number().min(0).optional(),
  valor: z.number().min(0).optional(),
  quantidade: z.number().min(0).optional(),
  aliquotaPorUnidade: z.number().min(0).optional()
});

export const cofinsSchema = z.object({
  cst: z.string().length(2),
  baseCalculo: z.number().min(0).optional(),
  aliquota: z.number().min(0).optional(),
  valor: z.number().min(0).optional(),
  quantidade: z.number().min(0).optional(),
  aliquotaPorUnidade: z.number().min(0).optional()
});

export const pisCofinsStSchema = z
  .object({
    baseCalculo: z.number().min(0).optional(),
    aliquota: z.number().min(0).max(100).optional(),
    quantidade: z.number().min(0).optional(),
    aliquotaPorUnidade: z.number().min(0).optional(),
    valor: z.number().min(0),
    compoeTotal: z.literal(0).or(z.literal(1)).optional()
  })
  .refine(
    (p) =>
      (p.baseCalculo !== undefined && p.aliquota !== undefined) ||
      (p.quantidade !== undefined && p.aliquotaPorUnidade !== undefined),
    { message: 'Informe base + aliquota, ou quantidade + aliquota por unidade' }
  );

export const ipiSchema = z.object({
  cst: z.string().length(2),
  baseCalculo: z.number().min(0).optional(),
  aliquota: z.number().min(0).optional(),
  valor: z.number().min(0).optional(),
  cEnq: z.string().max(3).optional(),
  cnpjProdutor: z.string().length(14).optional(),
  codigoSelo: z.string().min(1).max(60).optional(),
  quantidadeSelo: z.number().int().min(0).optional(),
  quantidade: z.number().min(0).optional(),
  valorPorUnidade: z.number().min(0).optional()
});

const enteTributanteSchema = z.object({
  aliquota: z.number().min(0).max(100),
  diferimento: z
    .object({ percentual: z.number().min(0).max(100), valor: z.number().min(0) })
    .optional(),
  tributoDevolvido: z.number().min(0).optional(),
  reducao: z
    .object({
      percentualReducao: z.number().min(0).max(100),
      aliquotaEfetiva: z.number().min(0).max(100)
    })
    .optional(),
  valor: z.number().min(0).optional()
});

const creditoPresumidoEnteSchema = z
  .object({
    percentual: z.number().min(0).max(100),
    valor: z.number().min(0).optional(),
    valorCondicaoSuspensiva: z.number().min(0).optional()
  })
  .refine((c) => c.valor !== undefined || c.valorCondicaoSuspensiva !== undefined, {
    message: 'Informe vCredPres ou vCredPresCondSus no credito presumido'
  });

export const ibsCbsSchema = z.object({
  cst: z.string().min(1).max(3),
  cClassTrib: z.string().min(1).max(6),
  doacao: z.boolean().optional(),
  baseCalculo: z.number().min(0).optional(),
  pIBSUF: z.number().min(0).optional(),
  pIBSMun: z.number().min(0).optional(),
  pCBS: z.number().min(0).optional(),
  ibsUf: enteTributanteSchema.optional(),
  ibsMun: enteTributanteSchema.optional(),
  cbs: enteTributanteSchema.optional(),
  tributacaoRegular: z
    .object({
      cst: z.string().min(1).max(3),
      cClassTrib: z.string().min(1).max(6),
      aliquotaEfetivaIbsUf: z.number().min(0),
      valorIbsUf: z.number().min(0),
      aliquotaEfetivaIbsMun: z.number().min(0),
      valorIbsMun: z.number().min(0),
      aliquotaEfetivaCbs: z.number().min(0),
      valorCbs: z.number().min(0)
    })
    .optional(),
  tributacaoCompraGov: z
    .object({
      aliquotaIbsUf: z.number().min(0),
      valorIbsUf: z.number().min(0),
      aliquotaIbsMun: z.number().min(0),
      valorIbsMun: z.number().min(0),
      aliquotaCbs: z.number().min(0),
      valorCbs: z.number().min(0)
    })
    .optional(),
  monofasia: z
    .object({
      padrao: z
        .object({
          quantidade: z.number().min(0),
          aliquotaIbs: z.number().min(0),
          aliquotaCbs: z.number().min(0),
          valorIbs: z.number().min(0),
          valorCbs: z.number().min(0)
        })
        .optional(),
      retencao: z
        .object({
          quantidade: z.number().min(0),
          aliquotaIbs: z.number().min(0),
          valorIbs: z.number().min(0),
          aliquotaCbs: z.number().min(0),
          valorCbs: z.number().min(0)
        })
        .optional(),
      retidoAnteriormente: z
        .object({
          quantidade: z.number().min(0),
          aliquotaIbs: z.number().min(0),
          valorIbs: z.number().min(0),
          aliquotaCbs: z.number().min(0),
          valorCbs: z.number().min(0)
        })
        .optional(),
      diferimento: z
        .object({
          percentualIbs: z.number().min(0).max(100),
          valorIbs: z.number().min(0),
          percentualCbs: z.number().min(0).max(100),
          valorCbs: z.number().min(0)
        })
        .optional(),
      totalIbs: z.number().min(0),
      totalCbs: z.number().min(0)
    })
    .optional(),
  transferenciaCredito: z
    .object({ valorIbs: z.number().min(0), valorCbs: z.number().min(0) })
    .optional(),
  ajusteCompetencia: z
    .object({
      competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Use o formato AAAA-MM'),
      valorIbs: z.number().min(0),
      valorCbs: z.number().min(0)
    })
    .optional(),
  estornoCredito: z
    .object({ valorIbs: z.number().min(0), valorCbs: z.number().min(0) })
    .optional(),
  creditoPresumido: z
    .object({
      baseCalculo: z.number().min(0),
      codigo: z.string().min(1).max(10),
      ibs: creditoPresumidoEnteSchema.optional(),
      cbs: creditoPresumidoEnteSchema.optional()
    })
    .optional(),
  creditoPresumidoZfm: z
    .object({
      competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Use o formato AAAA-MM'),
      tipo: z.string().min(1).max(2),
      valor: z.number().min(0)
    })
    .optional()
});

export const produtoSchema = z.object({
  numero: z.int().min(1),
  codigo: z.string().min(1).max(60),
  descricao: z.string().min(1).max(120),
  ncm: z.string().length(8),
  cest: z.string().length(7).optional(),
  cfop: z.string().length(4),
  unidade: z.string().min(1).max(6),
  quantidade: z.number().positive(),
  valorUnitario: z.number().min(0),
  valorTotal: z.number().min(0),
  valorDesconto: z.number().min(0).optional(),
  valorFrete: z.number().min(0).optional(),
  valorSeguro: z.number().min(0).optional(),
  outrasDespesas: z.number().min(0).optional(),
  ean: z.string().max(14).optional(),
  eanTributavel: z.string().max(14).optional(),
  icms: icmsSchema,
  pis: pisSchema,
  cofins: cofinsSchema,
  ipi: ipiSchema.optional(),
  icmsUfDest: icmsUfDestSchema.optional(),
  ibsCbs: ibsCbsSchema.optional(),
  impostoSeletivo: z
    .object({
      cst: z.string().min(1).max(3),
      cClassTrib: z.string().min(1).max(6),
      baseCalculo: z.number().min(0),
      aliquota: z.number().min(0).max(100),
      aliquotaEspecifica: z.number().min(0).optional(),
      unidadeTributavel: z.string().min(1).max(6),
      quantidadeTributavel: z.number().min(0),
      valor: z.number().min(0)
    })
    .optional(),
  ii: z
    .object({
      baseCalculo: z.number().min(0),
      despesasAduaneiras: z.number().min(0),
      valor: z.number().min(0),
      valorIof: z.number().min(0)
    })
    .optional(),
  issqn: z
    .object({
      baseCalculo: z.number().min(0),
      aliquota: z.number().min(0).max(100),
      valor: z.number().min(0),
      codigoMunicipioFatoGerador: z.string().length(7),
      itemListaServicos: z.string().min(4).max(5),
      valorDeducao: z.number().min(0).optional(),
      outrasRetencoes: z.number().min(0).optional(),
      descontoIncondicionado: z.number().min(0).optional(),
      descontoCondicionado: z.number().min(0).optional(),
      valorRetido: z.number().min(0).optional(),
      exigibilidade: z.int().min(1).max(7),
      codigoServico: z.string().min(1).max(20).optional(),
      codigoMunicipio: z.string().length(7).optional(),
      codigoPais: z.string().min(1).max(4).optional(),
      numeroProcesso: z.string().min(1).max(30).optional(),
      incentivoFiscal: z.literal(1).or(z.literal(2))
    })
    .optional(),
  pisSt: pisCofinsStSchema.optional(),
  cofinsSt: pisCofinsStSchema.optional(),
  tributosAproximados: z.number().min(0).optional(),
  impostoDevolvido: z
    .object({
      percentualDevolvido: z.number().min(0).max(100),
      valorIpiDevolvido: z.number().min(0)
    })
    .optional(),
  informacoesAdicionais: z.string().max(500).optional(),
  valorItem: z.number().min(0).optional()
});
