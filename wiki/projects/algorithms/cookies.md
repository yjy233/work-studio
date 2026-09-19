---
title: 455 · 分发饼干
tags: [算法, 贪心, 交换论证]
---
# 455 · 分发饼干

## 问题与建模

每个孩子有一个最低需求，每块饼干有尺寸；一个孩子最多得到一块饼干，一块饼干只能分给一个孩子。尺寸达到需求才算满足，目标是满足最多孩子。题目来源：[LeetCode · Assign Cookies](https://leetcode.com/problems/assign-cookies/)。

## 局部选择

孩子需求与饼干尺寸都升序排列。拿当前最小饼干尝试满足需求最小的未满足孩子：太小就丢弃这块饼干，足够则匹配并移动孩子指针。

示例：需求 `[1,2,4]`，饼干 `[1,3]`。

| 饼干 | 当前孩子需求 | 动作 | 已满足 |
| --- | --- | --- | --- |
| 1 | 1 | 匹配 | 1 |
| 3 | 2 | 匹配 | 2 |
| 无 | 4 | 结束 | 2 |

## 为什么正确

太小的饼干连最小需求都满足不了，对剩余任何孩子都没用。若它足够，考虑一个最优匹配：若最小孩子未被满足，可以把这块饼干的接收者换为该孩子而不减少匹配数；若孩子已有更大饼干，把饼干交换后，原来接收小饼干的孩子也能接受那块更大饼干。于是存在一个最优解包含当前贪心匹配，剩余问题仍相同。

错误策略“先把最大饼干给需求最小的孩子”的反例：需求 `[1,2]`，饼干 `[1,2]`。先给需求 1 的孩子尺寸 2，剩下尺寸 1 无法满足需求 2，只得到 1 个；正确可得到 2 个。

## TypeScript 实现

```ts
function findContentChildren(greed: readonly number[], cookies: readonly number[]): number {
  const children = [...greed].sort((a, b) => a - b);
  const available = [...cookies].sort((a, b) => a - b);
  let child = 0;
  for (const size of available) {
    if (child < children.length && size >= children[child]) child++;
  }
  return child;
}
```

排序时间 O(n log n + m log m)，扫描 O(m)，数组复制额外 O(n+m)。这里保留了调用者输入。

## 边界与追问

空孩子或空饼干得到 0；重复需求按独立孩子处理；饼干用完立即结束。输入示例 `g=[2,3], s=[1,1]` 应返回 0。

追问：若一人可以拿多块饼干并把尺寸相加，还能这么做吗？不能直接沿用证明，因为资源可以组合，原有一对一交换不再覆盖所有情况。

终端：`npm run practice:greedy`。测试将小输入与穷举分配对照。下一题 [[projects/algorithms/intervals|无重叠区间]]。

返回 [[projects/algorithms/index|项目目录]]。
