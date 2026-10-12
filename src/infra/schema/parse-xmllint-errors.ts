import type { ValidationError } from '@nfe/contracts/SchemaValidator';

/**
 * Extrai erros de validacao da saida de erro do `xmllint --schema`.
 *
 * Funcao pura (sem I/O) para que o parsing seja testavel sem o binario.
 * Tolera os formatos de varias versoes do libxml2 e finais de linha
 * Unix (`\n`) ou Windows (`\r\n`).
 */
export function parseXmllintErrors(stderr: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = stderr.split(/\r?\n/);

  for (const line of lines) {
    // Formato legado: "-:12: element infNFe: Schemas validity error : ..."
    const legacy = line.match(/^-:(\d+):\s*element\s+(\S+):\s*Schemas validity error\s*:\s*(.+)$/);

    if (legacy) {
      errors.push({
        field: stripNamespace(legacy[2]),
        message: legacy[3].trim()
      });
      continue;
    }

    // Formato atual (libxml2 >= 2.9), com prefixo opcional de arquivo/linha:
    // "Element '{ns}local': msg",
    // "schema.xsd:3: Element 'local': msg",
    // "Element 'local', attribute 'req': msg" (libxml mais novo).
    const current = line.match(
      /^(?:\S+:\d+:\s*)?[Ee]lement\s+'(?:\{[^}]*\})?([^':\s,]+)'\s*(?:,\s*attribute\s+'([^']+)')?\s*:\s*(.+)$/
    );

    if (current) {
      errors.push({
        field: current[2] ?? current[1],
        message: current[3].trim()
      });
    }
  }

  return errors;
}

/**
 * Erro generico para quando o xmllint falha sem emitir linhas reconheciveis
 * (ex.: formato futuro/desconhecido). Evita relancar o erro bruto do
 * `execFileSync` e preserva o diagnostico original na mensagem.
 */
export function fallbackValidationError(stderr: string, maxLength = 500): ValidationError {
  const message = stderr
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .join(' ')
    .slice(0, maxLength);

  return { field: '', message };
}

function stripNamespace(name: string): string {
  const match = name.match(/^\{[^}]*\}(.+)$/);
  return match ? match[1] : name;
}
