---
title: 134 · 加油站
tags: [算法, 前缀和, 排除法]
---
# 134 · 加油站

## 把问题压成差值

站点 i 的净油量为 `gas[i] - cost[i]`。选择起点，绕一圈时任何前缀油量都不能小于 0。假定油箱无限容量，gas 和 cost 非负。题目来源：[LeetCode · Gas Station](https://leetcode.com/problems/gas-station/)。

## 两个量分工

`total` 记录整圈总差值，判断总资源是否足够；`tank` 只记录当前候选 start 到 i 的累计值。一旦 tank < 0，把 start 改成 i+1，并清空 tank。

以 `gas=[1,2,3,4,5]`、`cost=[3,4,5,1,2]` 为例，差值为 `[-2,-2,-2,3,3]`。

| i | delta | 处理后的 tank | 候选 start |
| --- | --- | --- | --- |
| 0 | -2 | 0，失败重置 | 1 |
| 1 | -2 | 0，失败重置 | 2 |
| 2 | -2 | 0，失败重置 | 3 |
| 3 | 3 | 3 | 3 |
| 4 | 3 | 6 | 3 |

total=0，返回 3。

## 为什么能整段排除

设从 s 出发第一次在 i 处亏油，因此 s 到 i 的累计和为负，s 到任意更早位置的累计和非负。对中间 k，从 k 到 i 的累计和 = 从 s 到 i 的和 − 从 s 到 k−1 的和，仍然为负。因此 s…i 中没有一个起点能走过 i，可以一次跳过整段。

为什么 total ≥ 0 就能找到可行起点？把环展开为前缀和，选择最小前缀和之后的位置。向右走时相对该最小值不下降到负数；绕回左边时加上非负总和，仍不为负。重置候选的扫描正是在不断跳过新的低前缀。

## 实现

```ts
function canCompleteCircuit(gas: readonly number[], cost: readonly number[]): number {
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
```

时间 O(n)，额外空间 O(1)。不要只检查 total 就直接返回 0：整体足够不代表任意起点都可行。重置条件是 `< 0`，油量恰好 0 仍可继续。

## 追问

如果油箱容量有限，以上推导还成立吗？不一定，因为多余的油会溢出，前缀差值相加不再完整表达状态。若多个起点都可行，本实现返回一个可行起点；不承诺返回所有起点。

测试枚举小油量数组，验证返回起点能真的绕完；若返回 -1，则逐个起点都应失败。

返回 [[projects/algorithms/index|项目目录]]。
