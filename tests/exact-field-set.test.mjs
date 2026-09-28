import assert from 'node:assert/strict';
import test from 'node:test';
import { exact } from '../packages/publisher/src/semantics/document.mjs';
import { hasExactFields } from '../packages/publisher/src/protocol/values.mjs';

test('exact fields compare keys rather than delimiter-joined spellings', () => {
  assert.equal(exact({ alpha: 1, beta: 2 }, ['alpha', 'beta']), true);
  assert.equal(exact({ 'alpha\nbeta': 1 }, ['alpha', 'beta']), false);
  assert.equal(exact({ 'alpha,beta': 1 }, ['alpha', 'beta']), false);
  assert.equal(exact({ alpha: 1, beta: 2, gamma: 3 }, ['alpha', 'beta']), false);
});

test('exact fields reject hidden own properties and preserve optional-field semantics', () => {
  const hidden = Object.defineProperty({ alpha: 1 }, 'beta', { value: 2 });
  assert.equal(hasExactFields(hidden, ['alpha']), false);
  assert.equal(hasExactFields({ alpha: 1, beta: 2 }, ['alpha'], ['beta']), true);
  assert.equal(hasExactFields({ alpha: 1, gamma: 2 }, ['alpha'], ['beta']), false);
  assert.equal(hasExactFields({ alpha: 1, [Symbol('side-channel')]: 2 }, ['alpha']), false);
});
