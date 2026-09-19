---
title: 435 · 无重叠区间
tags: [算法, 区间, 交换论证]
---
# 435 · 无重叠区间

## 问题转换

删除最少区间，使剩余区间互不重叠，等价于保留最多互不重叠区间。区间 `[1,2]` 与 `[2,3]` 可以相邻保留；端点接触不算重叠。题目来源：[LeetCode · Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/)。

## 策略：先选结束最早的

按右端点升序排序，维护最后保留区间的 end。候选 start ≥ end 则接收，否则跳过。结束越早，给后续留下的空间越多。

示例 `[1,3], [2,4], [3,5], [0,6]`：

| 候选 | 当前 end | 判断 | 保留数 |
| --- | --- | --- | --- |
| [1,3] | -∞ | 接收，end=3 | 1 |
| [2,4] | 3 | 2 < 3，跳过 | 1 |
| [3,5] | 3 | 接收，end=5 | 2 |
| [0,6] | 5 | 跳过 | 2 |

最后删除 4−2=2 个。

## 交换证明

取任一最优方案，其首个区间结束于 e。贪心选择的最早结束时间 g ≤ e。把最优方案的首区间替换成贪心区间，其余区间的起点都不小于 e，因此也不小于 g；方案合法，数量不减少。去掉已选区间后对子问题重复，得到最多保留数。

错误策略“起点最早优先”的反例：`[0,10], [1,2], [2,3], [3,4]`。保留第一项只能留下 1 个，而后三项可以全部保留。

## 实现

```ts
function eraseOverlapIntervals(intervals: readonly (readonly [number, number])[]): number {
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
```

时间 O(n log n)，额外空间 O(n)，其中包含输入复制。约定每个区间 start < end；不在题解函数里混入 UI 输入校验。

## 容易错的地方

判断必须用 `>=`，不是 `>`。答案是删掉的数量，不是保留数。负端点需要 `-Infinity` 初始化，不能把 end 固定成 0。相同区间重复出现时只保留一个。

追问：如果每个区间有不同收益，目标变成收益最大，结束最早仍然最优吗？一般不成立，转向加权区间调度的动态规划。

返回 [[projects/algorithms/index|项目目录]]。
