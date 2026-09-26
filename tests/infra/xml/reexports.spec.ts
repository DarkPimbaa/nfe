import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalize } from '@nfe/infra/xml/canonicalize';
import { DefaultXmlSigner } from '@nfe/infra/xml/DefaultXmlSigner';
import * as core from '@brasil-fiscal/core';

/**
 * `canonicalize` e `DefaultXmlSigner` sao reexports do @brasil-fiscal/core — o
 * comportamento (C14N, digest, assinatura) e testado la. Aqui so garantimos que
 * o reexport aponta para a implementacao do core.
 */
describe('reexports do core', () => {
  it('canonicalize deve ser a implementacao do core', () => {
    assert.equal(canonicalize, core.canonicalize);
    assert.equal(canonicalize('<root><child/></root>'), '<root><child></child></root>');
  });

  it('DefaultXmlSigner deve ser a implementacao do core', () => {
    assert.equal(DefaultXmlSigner, core.DefaultXmlSigner);
  });
});
