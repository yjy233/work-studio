---
title: 55 / 45 · 跳跃游戏
tags: [算法, 覆盖, BFS]
---
# 55 / 45 · 跳跃游戏

## 两个目标要分开

55 问“能否到达终点”；45 问“最少跳几次”。每个数是从当前位置最多能前进的距离，不是必须跳这么远。来源：[LeetCode · Jump Game](https://leetcode.com/problems/jump-game/)、[LeetCode · Jump Game II](https://leetcode.com/problems/jump-game-ii/)。

## 55：只维护已知最远覆盖

不变量：处理位置 i 前，`farthest` 是已经确认可达的位置所能覆盖的最远下标。若 i > farthest，说明前面所有可达位置都跨不过这个缺口，可以直接失败。

```ts
function canJump(nums: readonly number[]): boolean {
  if (!nums.length) return false;
  let farthest = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > farthest) return false;
    farthest = Math.max(farthest, i + nums[i]);
    if (farthest >= nums.length - 1) return true;
  }
  return false;
}
```

例如 `[3,2,1,0,4]` 扫到 i=3 仍只能覆盖 3；i=4 超界，失败。单个元素即使是 0 也已经在终点；本实现额外约定空数组不可达。

## 45：把覆盖区间当成 BFS 的层

`end` 表示当前跳数能覆盖的右边界；扫描这一层所有位置，得到再跳一步能达到的 farthest。只有扫描到 end 才增加跳数，不对每个下标都加。

例 `[2,3,1,1,4]`：

| i | 更新后的 farthest | 是否到当前 end | 累计跳数 / 新 end |
| --- | --- | --- | --- |
| 0 | 2 | 是 | 1 / 2 |
| 1 | 4 | 否 | 1 / 2 |
| 2 | 4 | 是 | 2 / 4，覆盖终点 |

```ts
function minJumps(nums: readonly number[]): number {
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
```

官方 45 输入保证可达；这里拓展为不可达或空数组返回 -1，使函数在个人练习中也有明确行为。

## 为什么最少

第 k 层扫描的是 k 次跳跃可覆盖的位置，它们所有下一跳的并集构成 k+1 次能覆盖的范围。选择这批位置的最大右端点，覆盖不会少于任何恰好走 k+1 次的方案。终点首次落入覆盖时，该层数就是最少跳数。它是把连续可达范围压缩后的 BFS，不需要枚举所有边。

## 误区与边界

不是直接跳到 `nums[i]` 最大的位置；比较的是 **i + nums[i]** 的覆盖能力。循环不扫描最后一格，已经到终点无需再跳。若 end 没有前进，应判不可达，不能死循环或仍然加数。

两个算法都是 O(n) 时间、O(1) 额外空间。测试对长度不超过 7 的三值数组全部枚举，与独立最短路径递推对照。

返回 [[projects/algorithms/index|项目目录]]。
