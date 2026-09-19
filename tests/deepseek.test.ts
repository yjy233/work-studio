import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stableSoftmax, greedyToken, topKIndices } from '../examples/algorithms/deepseek.ts';
test('softmax is normalized, finite for large logits and shift invariant', () => {
  const probabilities = stableSoftmax([1000, 1001, 1002]);
  assert.ok(probabilities.every((p) => p > 0 && p < 1));
  assert.ok(Math.abs(probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  const shifted = stableSoftmax([0, 1, 2]);
  probabilities.forEach((p, i) => assert.ok(Math.abs(p - shifted[i]) < 1e-12));
  assert.deepEqual(stableSoftmax([7]), [1]);
  assert.throws(() => stableSoftmax([Infinity]));
  assert.throws(() => stableSoftmax([]));
});
test('argmax and top-k use deterministic tie handling and validate k', () => {
  assert.equal(greedyToken([-2, -1, -1]), 1);
  assert.deepEqual(topKIndices([0.3, 0.9, 0.9, 0.1], 2), [1, 2]);
  assert.deepEqual(topKIndices([1], 0), []);
  assert.throws(() => topKIndices([1, 2], 3));
  assert.throws(() => topKIndices([1, 2], 0.5));
});
