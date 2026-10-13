# @brasil-fiscal/nfe

Lib open-source em TypeScript para emissao de **NFe (Nota Fiscal Eletronica)** e **NFC-e (Nota Fiscal de Consumidor Eletronica)** no Brasil. Arquitetura limpa, totalmente plugavel. Parte do ecossistema [`@brasil-fiscal`](https://github.com/brasil-fiscal).

## Instalacao

```bash
npm install @brasil-fiscal/nfe
```

Para gerar DANFE (PDF), instale tambem:

```bash
npm install pdfkit
```

> O [`@brasil-fiscal/core`](https://github.com/brasil-fiscal/core) eh instalado automaticamente como dependencia — contem certificado digital, assinatura XML, transporte mTLS e helpers compartilhados com CTe e MDFe.

## Features

### NFe (modelo 55) — Completo

- Geracao de XML da NFe (layout SEFAZ 4.00)
- Assinatura digital com certificado A1 (.pfx/.p12)
- Validacao contra schemas XSD oficiais
- Transmissao para SEFAZ via HTTPS com mTLS (modo sincrono)
- Consulta de protocolo de autorizacao
- Distribuicao DFe (consulta de NFes recebidas)
- Cancelamento de NFe
- Carta de Correcao (CC-e)
- Inutilizacao de numeracao
- Manifestacao do Destinatario (confirmacao, ciencia, desconhecimento, nao realizada)
- Geracao de DANFE em PDF (A4 retrato)
- URLs de todos os 27 estados (14 autorizadores)
- Providers plugaveis para certificado, transporte, XML e assinatura
- Responsavel tecnico (`infRespTec`), com calculo do `hashCSRT`
- Autorizados a baixar o XML (`autXML`)
- Documentos referenciados (`NFref`) — NFe, CTe, nota em papel, produtor rural e ECF
- DIFAL da EC 87/2015 (`ICMSUFDest`), com partilha e FCP
- ICMS por CST: ST (10/30/70/90), reducao de base, desoneracao, diferimento (51)
  e ST retido (60); CSOSN 101/201/202/500/900
- Campos de pagamento do split payment (`dPag`, `CNPJPag`/`UFPag`, `CNPJReceb`,
  `idTermPag`, `xPag`, `indPag`) e `gPagAntecipado`
- Tabelas IBGE completas: 5.571 municipios e 248 paises, com busca por nome
- Validacao XSD de eventos, inutilizacao, EPEC, consultas e distribuicao DFe
- Leitura dos dados do certificado (titular, CNPJ, emissor, validade)
- **Leiaute 4.00 completo**: 100% dos grupos de emissao do XSD oficial, incluindo
  importacao (DI/adicoes), exportacao, rastreabilidade por lote, veiculos novos,
  medicamentos, armas, combustiveis (CIDE/encerrante/biocombustivel), ISSQN,
  II, PIS/COFINS ST, cana, agropecuario, contingencia, avulsa, intermediador
- ICMS monofasico de combustiveis (CST 02, 15, 53, 61) e ICMS efetivo
- IBS/CBS com todos os regimes: diferimento, reducao, monofasia, credito
  presumido (inclusive ZFM), transferencia de credito, ajuste de competencia,
  estorno, tributacao regular e compra governamental
- Imposto Seletivo (IS) no item e no total

### NFC-e (modelo 65) — Completo

- Modelo configuravel (`'55' | '65'`)
- QR Code v2 da NFC-e (online e contingencia offline, hash SHA1)
- Webservices de NFC-e de todas as UFs
- Campos `qrCode` e `urlChave` no bloco `infNFeSupl`
- Destinatario opcional (consumidor nao identificado)
- Cupom termico 80mm com QR Code

## Quick Start

```typescript
import { NFeCore } from '@brasil-fiscal/nfe';
import { readFileSync } from 'node:fs';

const nfe = NFeCore.create({
  pfx: readFileSync('./certificado.pfx'),
  senha: 'senha-do-certificado',
  ambiente: 'homologacao',  // ou 'producao'
  uf: 'MT'
});
```

### Transmitir NFe

```typescript
const result = await nfe.transmitir({
  identificacao: {
    naturezaOperacao: 'Venda de mercadoria',
    tipoOperacao: 1,
    destinoOperacao: 1,
    finalidade: 1,
    consumidorFinal: 1,
    presencaComprador: 1,
    uf: 'MT',
    municipio: '5103403',
    serie: 1,
    numero: 1
  },
  emitente: {
    cnpj: '12345678000195',
    razaoSocial: 'Empresa Teste Ltda',
    inscricaoEstadual: '131234567',
    regimeTributario: 1,
    endereco: {
      logradouro: 'Rua das Flores',
      numero: '100',
      bairro: 'Centro',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78005000'
    }
  },
  destinatario: {
    cpf: '52998224725',
    nome: 'Joao da Silva',
    indicadorIE: 9,
    endereco: {
      logradouro: 'Av Brasil',
      numero: '500',
      bairro: 'Centro',
      codigoMunicipio: '5103403',
      municipio: 'Cuiaba',
      uf: 'MT',
      cep: '78010100'
    }
  },
  produtos: [
    {
      numero: 1,
      codigo: '001',
      descricao: 'Produto Teste',
      ncm: '84714900',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 2,
      valorUnitario: 49.90,
      valorTotal: 99.80,
      icms: { origem: 0, csosn: '102' },
      pis: { cst: '49' },
      cofins: { cst: '49' }
    }
  ],
  transporte: { modalidadeFrete: 9 },
  pagamento: {
    pagamentos: [{ formaPagamento: '01', valor: 99.80 }]
  }
});

console.log(result.autorizada);   // true
console.log(result.protocolo);    // '151240000012345'
console.log(result.chaveAcesso);  // 44 digitos
```

### Transmitir NFC-e (modelo 65)

Mesma chamada da NFe: basta informar `modelo: '65'` e configurar o CSC
(`cIdToken` + `csc`, obtidos no portal da SEFAZ da sua UF).

```typescript
const nfce = NFeCore.create({
  pfx: readFileSync('./certificado.pfx'),
  senha: 'senha-do-certificado',
  ambiente: 'homologacao',
  uf: 'MT',
  cIdToken: '000001',
  csc: 'SEU-CSC'
});

const result = await nfce.transmitir({
  identificacao: {
    modelo: '65',
    // ...demais campos como na NFe; `destinatario` e opcional
  },
  // ...
});
```

O QR Code e a `urlChave` sao gerados e inseridos no `infNFeSupl` automaticamente.

### Gerar cupom NFC-e (PDF 80mm)

```typescript
import { GerarCupomUseCase } from '@brasil-fiscal/nfe';

const pdf = await new GerarCupomUseCase().execute(result.xmlProtocolado!);
writeFileSync('cupom.pdf', pdf);
```

> Requer `pdfkit` e `qrcode` instalados: `npm install pdfkit qrcode`

### Consultar protocolo

```typescript
const result = await nfe.consultarProtocolo('51240412345678000195550010000000011234567890');
console.log(result.codigoStatus); // '100'
```

### Cancelar NFe

```typescript
await nfe.cancelar({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195',
  protocolo: '151240000012345',
  justificativa: 'Erro na emissao da nota fiscal eletronica'
});
```

### Carta de Correcao (CC-e)

```typescript
await nfe.cartaCorrecao({
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195',
  correcao: 'Correcao do endereco do destinatario para Rua ABC 123',
  sequencia: 1  // opcional, default 1
});
```

### Inutilizar numeracao

```typescript
await nfe.inutilizar({
  cnpj: '12345678000195',
  ano: 2024,
  serie: 1,
  numeroInicial: 10,
  numeroFinal: 20,
  justificativa: 'Numeracao pulada por erro no sistema emissor'
});
```

### Consultar NFes recebidas (Distribuicao DFe)

```typescript
// Por ultimo NSU (paginacao manual)
const result = await nfe.distribuicaoPorNSU('12345678000195');
console.log(result.documentos);  // Array de { nsu, schema, xml }
console.log(result.ultNSU);      // Usar como input da proxima chamada

// Por chave de acesso
const result2 = await nfe.distribuicaoPorChave(
  '12345678000195',
  '51240412345678000195550010000000011234567890'
);
```

### Manifestacao do Destinatario

```typescript
const input = {
  chaveAcesso: '51240412345678000195550010000000011234567890',
  cnpj: '12345678000195'
};

await nfe.manifestar.confirmar(input);
await nfe.manifestar.ciencia(input);
await nfe.manifestar.desconhecer({ ...input, justificativa: 'Nao reconheco esta operacao' });
await nfe.manifestar.naoRealizada({ ...input, justificativa: 'Mercadoria devolvida' });
```

### Gerar DANFE (PDF)

```typescript
import { writeFileSync } from 'node:fs';

const pdf = await nfe.danfe(xmlAutorizado);
writeFileSync('danfe.pdf', pdf);
```

> Requer `pdfkit` instalado: `npm install pdfkit`

### Responsavel tecnico e autorizados a baixar o XML

```typescript
await nfe.transmitir({
  // ...
  responsavelTecnico: {
    cnpj: '11222333000181',
    contato: 'Suporte Tecnico',
    email: 'suporte@empresa.com.br',
    telefone: '6533334444',
    // Opcional: com o CSRT a lib calcula o hashCSRT a partir da chave de acesso
    idCSRT: '01',
    csrt: 'G8063VRTNDMPM4TG4B8ZI4GZ5XY8CQ'
  },
  // Contador e transportador podem baixar o XML (ate 10)
  autorizadosXml: [{ cnpj: '99888777000166' }, { cpf: '52998224725' }]
});
```

### Nota referenciada (devolucao, complementar, ajuste)

```typescript
await nfe.transmitir({
  identificacao: {
    // ...
    finalidade: 4, // devolucao
    notasReferenciadas: [{ tipo: 'nfe', chaveAcesso: '5126...0015' }]
  },
  // ...
});
```

Tambem aceita `{ tipo: 'cte' }`, `{ tipo: 'nf' }` (nota em papel modelo 01/02),
`{ tipo: 'produtorRural' }` e `{ tipo: 'ecf' }`.

### DIFAL — venda interestadual para consumidor final

```typescript
produtos: [
  {
    // ...
    icms: { origem: 0, cst: '00', baseCalculo: 100, aliquota: 12, valor: 12 },
    icmsUfDest: {
      aliquotaInterna: 18,        // aliquota da UF de destino
      aliquotaInterestadual: 12,  // 4, 7 ou 12
      aliquotaFcp: 2              // opcional
      // percentualPartilha: 100 (default desde 2019)
    }
  }
]
```

A lib calcula `vICMSUFDest`, `vICMSUFRemet` e `vFCPUFDest` no item e soma tudo no
grupo `ICMSTot`.

### ICMS com substituicao tributaria

```typescript
icms: {
  origem: 0,
  cst: '10',
  baseCalculo: 100,
  aliquota: 17,
  valor: 17,
  percentualMva: 40,
  baseCalculoST: 140,
  aliquotaST: 17,
  aliquotaFcpST: 2 // opcional
}
```

Para mercadoria com ST ja retido (CST 60 / CSOSN 500):

```typescript
icms: {
  origem: 0,
  cst: '60',
  baseCalculoSTRetido: 140,
  aliquotaSTConsumidorFinal: 17,
  valorSTRetido: 23.8
}
```

### Simples Nacional: o mínimo por CSOSN

Para NFC-e/NFe do Simples Nacional no MVP (N1), o mínimo que passa no XSD:

| CSOSN | Quando usar | ICMS | PIS/COFINS |
|---|---|---|---|
| `102` | Revenda sem ST, sem crédito | `icms: { origem, csosn: '102' }` (sem base/alíquota) | `pis/cofins: { cst: '49' }` → gera `PISOutr`/`COFINSOutr` |
| `500` | Mercadoria com ST já retido | `icms: { origem, csosn: '500' }` + `baseCalculoSTRetido`, `aliquotaSTConsumidorFinal`, `valorSTRetido` (+ `efetivo` com o imposto real, quando houver) | `pis/cofins: { cst: '49' }` |

```typescript
// CSOSN 102 — revenda simples (ex.: padaria, varejo)
{
  numero: 1,
  codigo: '001',
  descricao: 'Pao frances kg',
  ncm: '19059090',
  cfop: '5102',
  unidade: 'KG',
  quantidade: 1,
  valorUnitario: 12.0,
  valorTotal: 12.0,
  icms: { origem: 0, csosn: '102' },
  pis: { cst: '49' },
  cofins: { cst: '49' }
}

// CSOSN 500 — ST retido anteriormente (ex.: refrigerante, cigarro)
{
  // ... mesmos campos básicos
  icms: {
    origem: 0,
    csosn: '500',
    baseCalculoSTRetido: 10.0,
    aliquotaSTConsumidorFinal: 17,
    valorSTRetido: 1.7
  },
  pis: { cst: '49' },
  cofins: { cst: '49' }
}
```

Notas: `CSOSN 101/201/900` dão crédito de ICMS — exigem `aliquotaCreditoSN`
e análise por operação (ver contador, fora do MVP). `PIS/COFINS 49` e `IBS 000`
são a simplificação de homolog do MVP; o N2 refina por operação. Em dúvida,
não chute CST — confirme com o contador. Ver exemplos NFC-e completos em
[docs/EXAMPLES.md](docs/EXAMPLES.md).

### Pagamento e split payment

Os campos abaixo sao os que amarram a nota a liquidacao financeira — e o que o
prestador de servico de pagamento usa para identificar o documento fiscal e
segregar IBS/CBS no split payment. Todos sao opcionais no leiaute 4.00.

```typescript
pagamento: {
  pagamentos: [
    {
      indicadorPagamento: 0,        // indPag: 0 a vista, 1 a prazo
      formaPagamento: '03',         // tPag: cartao de credito
      valor: 100,
      dataPagamento: new Date(),    // dPag
      cnpjPagador: '11222333000181', // CNPJPag — onde o pagamento foi processado
      ufPagador: 'MT',               // UFPag  — obrigatorio junto com CNPJPag
      tipoIntegracao: 1,
      cnpjCredenciadora: '99888777000166',
      bandeira: '01',
      autorizacao: 'A12345',
      cnpjRecebedor: '44555666000177', // CNPJReceb — beneficiario do pagamento
      idTerminalPagamento: 'POS-0001'  // idTermPag
    }
  ]
}
```

`CNPJPag` e `UFPag` sao uma sequencia opcional no XSD: ou os dois, ou nenhum. O
schema Zod rejeita a combinacao incompleta e o builder omite o par.

Para nota que liquida pagamento antecipado:

```typescript
identificacao: {
  // ...
  pagamentosAntecipados: ['5126...0015'] // gPagAntecipado, ate 99 chaves
}
```

### Grupos especializados de item

```typescript
produtos: [
  {
    // ... campos basicos
    // Importacao
    declaracoesImportacao: [{ numero: '2026/1234567', dataRegistro: new Date(), /* ... */ }],
    // Rastreabilidade (obrigatoria para medicamento, alimento, bebida)
    rastros: [{ lote: 'L123', quantidade: 2, dataFabricacao: new Date(), dataValidade: new Date() }],
    // Produtos com regra propria — apenas um por item
    medicamento: { codigoAnvisa: '1234567890123', precoMaximoConsumidor: 45.9 },
    // veiculoNovo, armamentos, combustivel ou recopi
  }
]
```

### IBS/CBS com regimes especiais

```typescript
ibsCbs: {
  cst: '200',
  cClassTrib: '000002',
  ibsUf: {
    aliquota: 1,
    reducao: { percentualReducao: 60, aliquotaEfetiva: 0.4 }  // gRed
  },
  ibsMun: { aliquota: 0.05, diferimento: { percentual: 50, valor: 0.02 } },  // gDif
  cbs: { aliquota: 0.9, tributoDevolvido: 0.1 },                             // gDevTrib
  creditoPresumido: {                                                        // gCredPresOper
    baseCalculo: 100,
    codigo: '01',
    ibs: { percentual: 10, valor: 0.02 }
  }
}
```

Alternativas ao `gIBSCBS`, mutuamente exclusivas: `monofasia` (gIBSCBSMono),
`transferenciaCredito` (gTransfCred) e `ajusteCompetencia` (gAjusteCompet).
Os valores sao calculados pela aliquota efetiva quando ha reducao, e somados no
`IBSCBSTot`.

### Municipios e paises

```typescript
import { getMunicipio, findCodigoMunicipio, getUfDoMunicipio, getPais } from '@brasil-fiscal/nfe';

getMunicipio('5103403');                  // 'Cuiabá'
findCodigoMunicipio('SP', 'sao paulo');   // '3550308' (ignora acento e caixa)
getUfDoMunicipio('3550308');              // 'SP'
getPais('1058');                          // 'BRASIL'
```

### Dados do certificado

```typescript
const cert = await nfe.certificado();

console.log(cert.titular);        // 'EMPRESA TESTE LTDA'
console.log(cert.documento);      // '11222333000181'
console.log(cert.notAfter);       // Date
console.log(cert.diasParaVencer); // 137
```

### Validar XSD de outros documentos

```typescript
import { XsdSchemaValidator } from '@brasil-fiscal/nfe';

const validator = new XsdSchemaValidator();

validator.validate(xmlEvento, 'cancelamento');
validator.validate(xmlEvento, 'cartaCorrecao');
validator.validate(xmlInut, 'inutilizacao');
validator.validate(xmlConsulta, 'consultaStatus');
```

### Tratamento de erros

Contrato do `transmitir` (estável, throw-only): sucesso (cStat 100) resolve com
`{ autorizada: true }`; rejeição SEFAZ lança `SefazRejectError` com `cStat`/`xMotivo`;
falha de rede/timeout propaga o erro original. A lib **nunca retorna
`{ autorizada: false }`** — trate a nota rejeitada no `catch` e chame
`consultarProtocolo(chave)` antes de reemitir.

```typescript
import { SefazRejectError, CertificateError, NFeError } from '@brasil-fiscal/nfe';

try {
  const result = await nfe.transmitir(nfeData);
  console.log(result.autorizada); // sempre true aqui (cStat 100)
} catch (error) {
  if (error instanceof CertificateError) {
    console.error('Certificado:', error.message);
  } else if (error instanceof SefazRejectError) {
    // Nota rejeitada (ex: 539 duplicidade): não reemitir sem consultar antes.
    console.error(`[${error.cStat}] ${error.xMotivo}`);
  } else if (error instanceof NFeError) {
    console.error('Erro:', error.message);
  }
}
```

## Uso avancado

Para quem precisa de controle total, os providers e use cases individuais tambem estao disponiveis. Veja [docs/EXAMPLES.md](docs/EXAMPLES.md) para exemplos com a API de baixo nivel.

## Providers plugaveis

A lib usa o padrao Provider. Cada integracao externa eh uma interface que voce pode substituir:

| Provider | Descricao | Default | Origem |
|----------|-----------|---------|--------|
| `CertificateProvider` | Carrega certificados digitais | `A1CertificateProvider` (.pfx/.p12) | `@brasil-fiscal/core` |
| `SefazTransport` | Comunicacao HTTP com a SEFAZ | `NodeHttpSefazTransport` (mTLS) | `@brasil-fiscal/core` |
| `XmlBuilder` | Gera XML a partir das entidades | `DefaultXmlBuilder` | `@brasil-fiscal/nfe` |
| `XmlSigner` | Assina XML com certificado digital | `DefaultXmlSigner` | `@brasil-fiscal/core` |

Para criar seu proprio provider, veja [docs/PROVIDERS.md](docs/PROVIDERS.md).

## Arquitetura

Este pacote usa [`@brasil-fiscal/core`](https://github.com/brasil-fiscal/core) para infraestrutura compartilhada (certificado, assinatura, transporte mTLS, helpers). O core eh reutilizado entre NFe, CTe e MDFe.

```
@brasil-fiscal/core          Certificado A1, XMLDSig, mTLS, CNPJ/CPF, UF codes
      |
@brasil-fiscal/nfe           NFe + NFC-e (este pacote)
      |
      src/
        core/                 Fachada (NFeCore) e tipos
        domain/               Entidades puras e schemas Zod
        contracts/            Interface XmlBuilder (NFe-especifica)
        application/          Use cases (transmit, consult, cancel, etc.)
        infra/                DefaultXmlBuilder, SOAP, DANFE
        shared/               Constantes (CFOP, CST, URLs SEFAZ)
```

Para detalhes completos, veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Ecossistema @brasil-fiscal

| Pacote | Status | Descricao |
|--------|--------|-----------|
| [@brasil-fiscal/core](https://github.com/brasil-fiscal/core) | Estavel | Infraestrutura compartilhada |
| **@brasil-fiscal/nfe** | Estavel | NFe e NFC-e (este pacote) |
| [@brasil-fiscal/cte](https://github.com/brasil-fiscal/cte) | Em desenvolvimento | CTe |
| [@brasil-fiscal/mdfe](https://github.com/brasil-fiscal/mdfe) | Em desenvolvimento | MDFe |
| [@brasil-fiscal/sped-fiscal](https://github.com/brasil-fiscal/sped-fiscal) | Em desenvolvimento | EFD ICMS/IPI (SPED Fiscal) |
| [@brasil-fiscal/sped-contribuicoes](https://github.com/brasil-fiscal/sped-contribuicoes) | Em desenvolvimento | EFD Contribuicoes (PIS/COFINS) |
| [@brasil-fiscal/sintegra](https://github.com/brasil-fiscal/sintegra) | Em desenvolvimento | SINTEGRA |

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [ROADMAP.md](ROADMAP.md) | Fases e progresso do desenvolvimento |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura detalhada |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Glossario de termos fiscais |
| [docs/PROVIDERS.md](docs/PROVIDERS.md) | Guia para criar providers |
| [docs/EXAMPLES.md](docs/EXAMPLES.md) | Exemplos completos |

## Exemplos

Veja a pasta [`examples/`](examples/) para arquivos de exemplo:
- `nfe-exemplo.xml` — XML de NFe gerado
- `danfe-exemplo.pdf` — DANFE em PDF

Para regenerar: `npx tsx scripts/generate-examples.ts`

## Requisitos

- Node.js >= 18
- Certificado digital A1 (.pfx ou .p12)
- OpenSSL instalado (para carregar certificados e validar XSD)
- `pdfkit` (opcional, apenas para gerar DANFE)

## Desenvolvimento

```bash
git clone https://github.com/brasil-fiscal/nfe.git
cd nfe
npm install
npm test
npm run lint
npm run build
```

## Contribuindo

Contribuicoes sao bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Inspiracao

- [nfephp-org/sped-nfe](https://github.com/nfephp-org/sped-nfe) — Referencia PHP para NFe
- [nfephp-org/sped-common](https://github.com/nfephp-org/sped-common) — Base comum do sped-nfe

## Licenca

[MIT](LICENSE)
