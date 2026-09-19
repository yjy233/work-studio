import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findContentChildren,
  eraseOverlapIntervals,
  canJump,
  minJumps,
  canCompleteCircuit,
  partitionLabels,
  maxProfit,
} from '../examples/algorithms/greedy.ts';
function arrays(length: number, base: number): number[][] {
  if (!length) return [[]];
  return arrays(length - 1, base).flatMap((prefix) =>
    Array.from({ length: base }, (_, i) => [...prefix, i]),
  );
}
function bfsJumps(nums: number[]) {
  if (!nums.length) return -1;
  const distance = Array(nums.length).fill(Infinity);
  distance[0] = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j <= Math.min(nums.length - 1, i + nums[i]); j++)
      distance[j] = Math.min(distance[j], distance[i] + 1);
  }
  return Number.isFinite(distance.at(-1)) ? distance.at(-1) : -1;
}
test('jump greedy matches shortest-path reference for all 3-valued arrays up to length 7', () => {
  for (let n = 0; n <= 7; n++)
    for (const nums of arrays(n, 3)) {
      const expected = bfsJumps(nums);
      assert.equal(minJumps(nums), expected, JSON.stringify(nums));
      assert.equal(canJump(nums), expected >= 0, JSON.stringify(nums));
    }
  assert.equal(minJumps([2, 3, 1, 1, 4]), 2);
});
test('cookie matching agrees with exhaustive assignments and preserves inputs', () => {
  const brute = (g: number[], s: number[]): number => {
    if (!g.length) return 0;
    let best = brute(g.slice(1), s);
    s.forEach((cookie, i) => {
      if (cookie >= g[0])
        best = Math.max(
          best,
          1 +
            brute(
              g.slice(1),
              s.filter((_, j) => i !== j),
            ),
        );
    });
    return best;
  };
  for (let n = 0; n <= 3; n++)
    for (const g of arrays(n, 3))
      for (const s of arrays(3, 3)) assert.equal(findContentChildren(g, s), brute(g, s));
  const g = [3, 1, 2];
  findContentChildren(g, [2, 1]);
  assert.deepEqual(g, [3, 1, 2]);
});
test('interval scheduling matches every subset of six possible intervals', () => {
  const candidates: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3],
  ];
  for (let mask = 0; mask < 64; mask++) {
    const input = candidates.filter((_, i) => mask & (1 << i));
    let kept = 0;
    for (let sub = 0; sub < 1 << input.length; sub++) {
      const chosen = input.filter((_, i) => sub & (1 << i)).sort((a, b) => a[0] - b[0]);
      if (chosen.every((v, i) => !i || chosen[i - 1][1] <= v[0]))
        kept = Math.max(kept, chosen.length);
    }
    assert.equal(eraseOverlapIntervals(input), input.length - kept);
  }
  assert.equal(
    eraseOverlapIntervals([
      [1, 2],
      [1, 2],
      [1, 2],
    ]),
    2,
  );
});
test('gas station result really completes a cycle, or every possible start fails', () => {
  for (let n = 1; n <= 4; n++)
    for (const g of arrays(n, 3))
      for (const c of arrays(n, 3)) {
        const valid = (start: number) => {
          let tank = 0;
          for (let j = 0; j < n; j++) {
            const k = (start + j) % n;
            tank += g[k] - c[k];
            if (tank < 0) return false;
          }
          return true;
        };
        const result = canCompleteCircuit(g, c);
        if (result === -1)
          assert.equal(
            g.some((_, i) => valid(i)),
            false,
          );
        else assert.ok(result < n && valid(result));
      }
  assert.equal(canCompleteCircuit([], []), -1);
});
test('partition greediness matches exhaustive cut patterns', () => {
  for (let n = 0; n <= 6; n++)
    for (const chars of arrays(n, 3)) {
      const text = chars.map((v) => 'abc'[v]).join('');
      let most = text ? 1 : 0;
      for (let mask = 0; mask < 2 ** Math.max(0, n - 1); mask++) {
        const owner = new Map<string, number>();
        let part = 0;
        let ok = true;
        for (let i = 0; i < n; i++) {
          if (owner.has(text[i]) && owner.get(text[i]) !== part) ok = false;
          owner.set(text[i], part);
          if (mask & (1 << i)) part++;
        }
        if (ok && n) most = Math.max(most, part + 1);
      }
      const lengths = partitionLabels(text);
      assert.equal(lengths.length, most);
      assert.equal(
        lengths.reduce((a, b) => a + b, 0),
        text.length,
      );
    }
  assert.deepEqual(partitionLabels('ababcbacadefegdehijhklij'), [9, 7, 8]);
});
test('stock greedy matches independent hold/cash dynamic programming', () => {
  for (let n = 0; n <= 6; n++)
    for (const prices of arrays(n, 4)) {
      let cash = 0,
        hold = -Infinity;
      for (const p of prices) [cash, hold] = [Math.max(cash, hold + p), Math.max(hold, cash - p)];
      assert.equal(maxProfit(prices), cash);
    }
});
