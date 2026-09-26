import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NFeCore } from '@nfe/core/NFeCore';
import { A1CertificateProvider } from '@nfe/infra/certificate/A1CertificateProvider';
import { extractCertPem } from '@brasil-fiscal/core';
import type { CertificateProvider, CertificateData } from '@nfe/contracts/CertificateProvider';
import { generateTestCertificate } from '../helpers/generate-test-certificate';

describe('NFeCore.certificado', () => {
  it('deve devolver os dados do certificado configurado', async () => {
    const { pfx, password } = generateTestCertificate({ cn: 'EMPRESA TESTE:11222333000181' });

    const nfe = NFeCore.create({ pfx, senha: password, ambiente: 'homologacao', uf: 'MT' });
    const info = await nfe.certificado();

    assert.equal(info.titular, 'EMPRESA TESTE');
    assert.equal(info.documento, '11222333000181');
    assert.equal(info.tipoDocumento, 'CNPJ');
    assert.equal(info.expirado, false);
    assert.ok(info.diasParaVencer > 0);
  });

  it('deve derivar do certPem quando o provider customizado nao preenche info', async () => {
    const { pfx, password } = generateTestCertificate({ cn: 'PROVIDER CUSTOMIZADO' });
    const real = await new A1CertificateProvider(pfx, password).load();

    // Provider legado: devolve CertificateData sem o campo `info`.
    const provider: CertificateProvider = {
      load: async (): Promise<CertificateData> => ({
        pfx,
        password,
        notAfter: real.notAfter,
        privateKey: real.privateKey,
        certPem: extractCertPem(pfx, password)
      })
    };

    const nfe = NFeCore.create({
      pfx,
      senha: password,
      ambiente: 'homologacao',
      uf: 'MT',
      certificate: provider
    });

    assert.equal((await nfe.certificado()).titular, 'PROVIDER CUSTOMIZADO');
  });
});
