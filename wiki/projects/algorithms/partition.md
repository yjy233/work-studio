---
title: 763 · 划分字母区间
tags: [算法, 字符串, 边界]
---
# 763 · 划分字母区间

## 目标

将字符串切成尽可能多的连续片段，每种字符只能出现在其中一个片段里，返回各段长度。这里遵循题目的小写英文字母约束。来源：[LeetCode · Partition Labels](https://leetcode.com/problems/partition-labels/)。

## 先记录每个字符最后出现的位置

扫描时把 end 延伸到所有已见字符末次位置的最大值。当 i == end，当前片段出现过的字符都不会在后面再出现，可以安全切开。

例 `abac`，末次位置 a=2、b=1、c=3：

| i / 字符 | end | 行为 |
| --- | --- | --- |
| 0 / a | 2 | 必须至少延伸到 2 |
| 1 / b | 2 | 保持 |
| 2 / a | 2 | 切分，长度 3 |
| 3 / c | 3 | 切分，长度 1 |

得到 `[3,1]`。

## 为什么最多

当前片段起点固定后，任何合法片段必须包含其中每个字符的最后一次出现，否则该字符会跨两个片段。因此在扫描达到 end 之前，任何方案都不能更早切分；达到 end 时立即切分不会限制后续方案，而且保留了最多潜在切点。对子串重复这个最早合法切分即可。

## 实现

```ts
function partitionLabels(text: string): number[] {
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
```

时间 O(n)，额外字典空间 O(字符种类数)，输出另占 O(片段数)。题目字符集固定时字典空间可视为 O(1)，但返回数组不应被忘记。

## 易错点

长度是 end−start+1。更新 end 需取最大值，不能被中间字符较早的末次位置缩短。空串返回空数组，全部同字母只有一段，所有字母都不同则每段长度 1。

若扩展到 emoji 和组合字符，必须先定义“字符”的含义，不能无条件沿用 UTF-16 下标。见 [[projects/typescript/collections|集合与字符串语义]]。

测试遍历小字符串的全部切分方式，确认返回的片段数达到最优；经典样例结果为 `[9,7,8]`。

返回 [[projects/algorithms/index|项目目录]]。
