/** Teaching functions inspired by inference primitives; not model inference or interview questions. */
function validate(logits: readonly number[]): void {
  if (!logits.length || logits.some((x) => !Number.isFinite(x)))
    throw new Error('Expected nonempty finite logits');
}
export function stableSoftmax(logits: readonly number[]): number[] {
  validate(logits);
  const max = logits.reduce((a, b) => Math.max(a, b), -Infinity);
  const weights = logits.map((x) => Math.exp(x - max));
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((x) => x / sum);
}
export function greedyToken(logits: readonly number[]): number {
  validate(logits);
  let best = 0;
  for (let i = 1; i < logits.length; i++) {
    if (logits[i] > logits[best]) best = i;
  }
  return best;
}
/** Readable sort baseline; equal scores break ties by original position. */
export function topKIndices(scores: readonly number[], k: number): number[] {
  validate(scores);
  if (!Number.isInteger(k) || k < 0 || k > scores.length) throw new Error('Invalid k');
  return scores
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, k)
    .map(({ index }) => index);
}
