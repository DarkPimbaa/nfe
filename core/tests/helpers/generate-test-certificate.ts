import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

type TestCertificateOptions = {
  readonly password?: string;
  readonly days?: number;
  readonly cn?: string;
};

type TestCertificate = {
  readonly pfx: Buffer;
  readonly password: string;
};

export function generateTestCertificate(options?: TestCertificateOptions): TestCertificate {
  const password = options?.password ?? 'test1234';
  const days = options?.days ?? 365;
  const cn = options?.cn ?? 'Test DFe Certificate';

  const tmpDir = mkdtempSync(join(tmpdir(), 'dfe-cert-'));
  const keyPath = join(tmpDir, 'key.pem');
  const certPath = join(tmpDir, 'cert.pem');
  const pfxPath = join(tmpDir, 'cert.pfx');

  try {
    // Sem shell: argumentos em array, sem risco de injecao via cn/password.
    // (execSync com `2>/dev/null` quebra no Windows; execFileSync é portátil.)
    const execOptions = { stdio: 'pipe' } as const;
    // Generate private key
    execFileSync('openssl', ['genrsa', '-out', keyPath, '2048'], execOptions);

    // Generate self-signed certificate
    execFileSync(
      'openssl',
      [
        'req',
        '-new',
        '-x509',
        '-key',
        keyPath,
        '-out',
        certPath,
        '-days',
        String(days),
        '-subj',
        `/CN=${cn}/O=Test/C=BR`
      ],
      execOptions
    );

    // Export to PKCS#12 (.pfx)
    execFileSync(
      'openssl',
      [
        'pkcs12',
        '-export',
        '-out',
        pfxPath,
        '-inkey',
        keyPath,
        '-in',
        certPath,
        '-passout',
        `pass:${password}`
      ],
      execOptions
    );

    const pfx = readFileSync(pfxPath);

    return { pfx, password };
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
