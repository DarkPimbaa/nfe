import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseXmllintErrors,
  fallbackValidationError
} from '@nfe/infra/schema/parse-xmllint-errors';

describe('parseXmllintErrors', () => {
  it('deve extrair campo e mensagem no formato legado', () => {
    const stderr =
      '-:2: element infNFe: Schemas validity error : ' +
      "Element 'infNFe': Missing child element(s).\n" +
      '- fails to validate\n';

    const errors = parseXmllintErrors(stderr);

    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.field, 'infNFe');
    assert.ok((errors[0]?.message ?? '').includes('Missing child'));
  });

  it('deve remover o namespace no formato legado', () => {
    const stderr =
      '-:2: element {http://www.portalfiscal.inf.br/nfe}infNFe: ' +
      'Schemas validity error : invalido\n';

    const errors = parseXmllintErrors(stderr);

    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.field, 'infNFe');
  });

  it('deve extrair campo e mensagem no formato atual', () => {
    const stderr =
      "Element '{http://www.portalfiscal.inf.br/nfe}xJust': " +
      "[facet 'minLength'] The value has a length of '4'.\n" +
      '- fails to validate\n';

    const errors = parseXmllintErrors(stderr);

    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.field, 'xJust');
    assert.ok((errors[0]?.message ?? '').includes('minLength'));
  });

  it('deve aceitar o formato atual sem namespace', () => {
    const errors = parseXmllintErrors("Element 'uTrib': 'UN' is not valid.\n");

    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.field, 'uTrib');
  });

  it('deve tolerar finais de linha CRLF do Windows', () => {
    const stderr =
      "Element '{http://www.portalfiscal.inf.br/nfe}infNFe': Missing child.\r\n" +
      '- fails to validate\r\n';

    const errors = parseXmllintErrors(stderr);

    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.field, 'infNFe');
  });

  it('deve usar o atributo como campo no formato com virgula', () => {
    // Forma emitida por libxml mais novo para atributo ausente/invalido.
    const stderr = "Element 'evento', attribute 'Id': The attribute 'Id' is required.\n";

    const errors = parseXmllintErrors(stderr);

    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.field, 'Id');
  });

  it('deve tolerar prefixo de arquivo e linha', () => {
    const stderr =
      'schemas/nfe_v4.00.xsd:3: ' +
      "Element '{http://www.portalfiscal.inf.br/nfe}NFe': Missing child.\n";

    const errors = parseXmllintErrors(stderr);

    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.field, 'NFe');
  });

  it('deve ignorar linhas de rodape e vazias', () => {
    const errors = parseXmllintErrors('- fails to validate\n\n');

    assert.deepEqual(errors, []);
  });
});

describe('fallbackValidationError', () => {
  it('deve resumir stderr irreconhecivel em vez de estourar', () => {
    const stderr = 'WXS schema foo.xsd failed to compile\nboom\n';
    const error = fallbackValidationError(stderr);

    assert.equal(error.field, '');
    assert.ok(error.message.includes('failed to compile'));
  });

  it('deve truncar mensagens longas', () => {
    const error = fallbackValidationError('x'.repeat(600), 500);

    assert.equal(error.message.length, 500);
  });
});
