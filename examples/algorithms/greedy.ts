/** Smallest adequate cookie serves the least demanding remaining child. */
export function findContentChildren(greed: readonly number[], cookies: readonly number[]): number {
  const children = [...greed].sort((a, b) => a - b);
  const available = [...cookies].sort((a, b) => a - b);
  let child = 0;
  for (const size of available) {
    if (child < children.length && size >= children[child]) child++;
  }
  return child;
}

/** Touching endpoints are compatible; intervals must have start < end. */
export function eraseOverlapIntervals(intervals: readonly (readonly [number, number])[]): number {
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
  let end = -Infinity;
  let kept = 0;
  for (const [start, finish] of sorted) {
    if (start >= end) {
      kept++;
      end = finish;
    }
  }
  return intervals.length - kept;
}

/** Empty input is defined as unreachable; a singleton needs no jump. */
export function canJump(nums: readonly number[]): boolean {
  if (!nums.length) return false;
  let farthest = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > farthest) return false;
    farthest = Math.max(farthest, i + nums[i]);
    if (farthest >= nums.length - 1) return true;
  }
  return false;
}

/** Minimum jumps; returns -1 for empty or unreachable input. */
export function minJumps(nums: readonly number[]): number {
  if (!nums.length) return -1;
  let end = 0;
  let farthest = 0;
  let jumps = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    if (i > farthest) return -1;
    farthest = Math.max(farthest, i + nums[i]);
    if (i === end) {
      if (farthest === end) return -1;
      jumps++;
      end = farthest;
      if (end >= nums.length - 1) return jumps;
    }
  }
  return jumps;
}

/** Empty or mismatched input is rejected with -1. Values are nonnegative. */
export function canCompleteCircuit(gas: readonly number[], cost: readonly number[]): number {
  if (!gas.length || gas.length !== cost.length) return -1;
  let total = 0;
  let tank = 0;
  let start = 0;
  for (let i = 0; i < gas.length; i++) {
    const delta = gas[i] - cost[i];
    total += delta;
    tank += delta;
    if (tank < 0) {
      start = i + 1;
      tank = 0;
    }
  }
  return total >= 0 ? start : -1;
}

/** Input follows the problem's lowercase English letter constraint. */
export function partitionLabels(text: string): number[] {
  const last = new Map<string, number>();
  for (let i = 0; i < text.length; i++) last.set(text[i], i);
  const lengths: number[] = [];
  let start = 0;
  let end = 0;
  for (let i = 0; i < text.length; i++) {
    end = Math.max(end, last.get(text[i])!);
    if (i === end) {
      lengths.push(end - start + 1);
      start = i + 1;
    }
  }
  return lengths;
}

/** Unlimited transactions, one share at a time, no fee and no cooldown. */
export function maxProfit(prices: readonly number[]): number {
  let profit = 0;
  for (let i = 1; i < prices.length; i++) {
    profit += Math.max(0, prices[i] - prices[i - 1]);
  }
  return profit;
}
