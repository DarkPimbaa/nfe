import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  SchemaValidator,
  ValidationResult
} from '@nfe/contracts/SchemaValidator';
import { parseXmllintErrors, fallbackValidationError } from './parse-xmllint-errors';

const DEFAULT_SCHEMAS_DIR = resolve(__dirname, '..', '..', '..', 'schemas');

/**
 * Documentos da NFe que podem ser validados contra o XSD oficial.
 *
 * Cada tipo aponta para o schema raiz correspondente no pacote da SEFAZ. Os
 * eventos com envelope proprio (cancelamento, CC-e, manifestacao, EPEC) tem o
 * mesmo elemento raiz `envEvento`, mas schemas diferentes para o `detEvento`.
 */
export type SchemaDocument =
  | 'nfe'
  | 'enviNFe'
  | 'procNFe'
  | 'inutilizacao'
  | 'procInutNFe'
  | 'evento'
  | 'procEvento'
  | 'cancelamento'
  | 'cancelamentoSubstituicao'
  | 'cartaCorrecao'
  | 'manifestacao'
  | 'epec'
  | 'comprovanteEntrega'
  | 'insucessoEntrega'
  | 'atorInteressado'
  | 'consultaProtocolo'
  | 'consultaStatus'
  | 'consultaCadastro'
  | 'consultaGTIN'
  | 'distribuicaoDFe'
  | 'retDistDFeInt'
  | 'retConsGTIN'
  | 'downloadNFe';

const SCHEMA_FILES: Record<SchemaDocument, string> = {
  nfe: 'nfe_v4.00.xsd',
  enviNFe: 'enviNFe_v4.00.xsd',
  procNFe: 'procNFe_v4.00.xsd',
  inutilizacao: 'inutNFe_v4.00.xsd',
  procInutNFe: 'procInutNFe_v4.00.xsd',
  evento: 'envEvento_v1.00.xsd',
  procEvento: 'procEventoNFe_v1.00.xsd',
  cancelamento: 'envEventoCancNFe_v1.00.xsd',
  cancelamentoSubstituicao: 'envEventoCancSubst_v1.00.xsd',
  cartaCorrecao: 'envCCe_v1.00.xsd',
  manifestacao: 'envConfRecebto_v1.00.xsd',
  epec: 'envEPEC_v1.00.xsd',
  comprovanteEntrega: 'envEventoEntregaNFe_v1.00.xsd',
  insucessoEntrega: 'envEventoInsucessoNFe_v1.00.xsd',
  atorInteressado: 'envEventoAtorInteressado_v1.00.xsd',
  consultaProtocolo: 'consSitNFe_v4.00.xsd',
  consultaStatus: 'consStatServ_v4.00.xsd',
  consultaCadastro: 'consCad_v2.00.xsd',
  consultaGTIN: 'consGTIN_v1.00.xsd',
  distribuicaoDFe: 'distDFeInt_v1.01.xsd',
  retDistDFeInt: 'retDistDFeInt_v1.01.xsd',
  retConsGTIN: 'retConsGTIN_v1.00.xsd',
  downloadNFe: 'downloadNFe_v1.00.xsd'
};

export type XsdSchemaValidatorOptions = {
  readonly schemasDir?: string;
  readonly document?: SchemaDocument;
};

export class XsdSchemaValidator implements SchemaValidator {
  private readonly schemasDir: string;
  private readonly document: SchemaDocument;

  /**
   * @param options Diretorio dos schemas e documento padrao. Por compatibilidade,
   *   tambem aceita apenas o diretorio como string.
   */
  constructor(options?: string | XsdSchemaValidatorOptions) {
    const opts = typeof options === 'string' ? { schemasDir: options } : (options ?? {});

    this.schemasDir = opts.schemasDir ?? DEFAULT_SCHEMAS_DIR;
    this.document = opts.document ?? 'nfe';
  }

  /**
   * Caminho do XSD raiz de um documento.
   */
  schemaPathFor(document: SchemaDocument): string {
    const file = SCHEMA_FILES[document];

    if (!file) {
      throw new Error(`Documento sem schema mapeado: ${document}`);
    }

    return resolve(this.schemasDir, file);
  }

  /**
   * @param document Sobrescreve o documento padrao do validador.
   */
  validate(xml: string, document?: SchemaDocument): ValidationResult {
    const schemaPath = this.schemaPathFor(document ?? this.document);

    try {
      execFileSync(
        'xmllint',
        ['--noout', '--schema', schemaPath, '-'],
        {
          input: xml,
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf-8'
        }
      );

      return { valid: true, errors: [] };
    } catch (error: unknown) {
      const stderr = this.extractStderr(error);

      if (!stderr) {
        throw error;
      }

      const errors = parseXmllintErrors(stderr);

      if (errors.length === 0 && !stderr.includes('validates')) {
        return { valid: false, errors: [fallbackValidationError(stderr)] };
      }

      return { valid: false, errors };
    }
  }

  private extractStderr(error: unknown): string | null {
    if (
      error !== null &&
      typeof error === 'object' &&
      'stderr' in error &&
      typeof (error as Record<string, unknown>).stderr === 'string'
    ) {
      return (error as Record<string, unknown>).stderr as string;
    }
    return null;
  }
}
