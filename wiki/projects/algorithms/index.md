---
title: 算法题详解 · 从贪心开始
tags: [算法, 重点项目]
---
# 算法题详解 · 从贪心开始

重点项目。每题按“建模 → 局部选择 → 手推 → 证明 → 代码 → 边界 → 追问”学习，先练能讲清楚的正确解，再追速度。当前实现语言为 TypeScript。

## 贪心第一轮

| 顺序 | 题目 | 核心策略 | 难点 |
| --- | --- | --- | --- |
| 0 | [[projects/algorithms/greedy|怎样证明贪心]] | 交换、领先、不变量 | 不能只凭直觉 |
| 1 | [[projects/algorithms/cookies|455 · 分发饼干]] | 最小资源满足最小需求 | 交换论证 |
| 2 | [[projects/algorithms/intervals|435 · 无重叠区间]] | 优先结束最早 | 端点语义、错误排序 |
| 3 | [[projects/algorithms/jump|55 / 45 · 跳跃游戏]] | 最远覆盖、按层扩展 | “下一步最远”不是选最大元素 |
| 4 | [[projects/algorithms/gas|134 · 加油站]] | 失败区间整段排除 | 为什么中途不能当起点 |
| 5 | [[projects/algorithms/partition|763 · 划分字母区间]] | 延伸到所有已见字符的末次出现 | 何时可以安全切分 |
| 6 | [[projects/algorithms/stock|122 · 买卖股票 II]] | 收集正向相邻差 | 手续费和冷冻期会改变问题 |

## DeepSeek 方向

[[projects/algorithms/deepseek|DeepSeek 备考与来源核验]] 明确区分官方源码、经典练习与未核验面试题。[[projects/algorithms/inference|推理代码练习]] 从官方 DeepSeek-V3 的采样、argmax 和 MoE top-k 出发，训练数组、排序、数值稳定性与张量形状理解。

这里没有把经典题冒称为 DeepSeek 真题，也没有把某篇面经当作完整官方题库。你后续给出具体题目或面经链接，可以继续追加原题、约束和解读。

## 里程碑

- [ ] 能提出候选策略并给错误策略找反例
- [ ] 独立完成分发饼干与区间题
- [ ] 解释跳跃游戏的覆盖边界
- [ ] 写出加油站的失败区间证明
- [ ] 完成划分字母与股票题的边界检查
- [ ] 区分 token 贪心解码与全局最优序列
- [ ] 完成一次 45 分钟模拟讲题

## 如何运行

```sh
npm run practice:greedy
npm run practice:deepseek
```

参考实现：`examples/algorithms/greedy.ts` 与 `deepseek.ts`。测试通过穷举小输入、最短路参考或动态规划对照，而不只核对书上的样例。复盘模板在 [[projects/algorithms/review|错题与面试表达]]。
