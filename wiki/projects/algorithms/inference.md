---
title: DeepSeek 源码练习 · argmax、Softmax 与 Top-K
tags: [DeepSeek, 数值计算, Top-K]
---
# DeepSeek 源码练习 · argmax、Softmax 与 Top-K

这些是**依据官方推理代码设计的教学练习**，不是已核验面试真题，也不是完整模型实现。不需要下载模型权重或 GPU。

## 1 · 贪心解码不保证整句概率最大

官方 `generate.py` 在 temperature > 0 时采样，否则用 logits.argmax 选择 token。argmax 只找当前步的最大值。

一个两步反例：第一步 A 的概率 0.6、B 为 0.4；选 A 后最可能的后继概率 0.5，选 B 后最可能后继为 0.9。贪心走 A 的完整路径概率是 0.30，但 B 路径可到 0.36。因此不要把“逐步选概率最大”误认为对整个序列完成了全局最优证明。

练习函数 `greedyToken` 扫描 logits，时间 O(V)、额外空间 O(1)。相同最大分数时本练习选择首次出现位置；在推理系统里要核对具体算子的平局行为。

## 2 · 数值稳定的 Softmax

直接计算 exp(1000) 会溢出。先减去所有 logits 的最大值 m，再计算 `exp(x-m)/Σexp(x-m)`。分子分母同除 exp(m)，理论上概率不变；减去 m 后指数非正，最大一项为 1。

```ts
function stableSoftmax(logits: readonly number[]): number[] {
  if (!logits.length || logits.some((x) => !Number.isFinite(x)))
    throw new Error('Expected nonempty finite logits');
  const max = logits.reduce((a, b) => Math.max(a, b), -Infinity);
  const weights = logits.map((x) => Math.exp(x - max));
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((x) => x / sum);
}
```

时间 O(V)，额外空间 O(V)。本练习限定有限数值，不处理包含 −∞ 的注意力 mask；如果一整行都被 mask，需要另行定义行为，不能把 0/0 当正常概率。

检查：每项有限且非负，总和约等于 1；`[1000,1001,1002]` 与 `[0,1,2]` 输出近似相同；单元素应为 `[1]`。浮点断言采用误差容限。

## 3 · Top-K 与 MoE 路由

普通 Top-K 问题只取分数最高的 k 项，本项目实现可读的排序基线 O(V log V)、O(V) 空间，平分按原下标顺序。后续可以扩展大小为 k 的小根堆到 O(V log k)，但那不等于复刻完整 Gate。

官方 `Gate.forward` 先算路由分数，再按配置进行组筛选与专家 top-k；可能添加 bias 用于选择，却从 original_scores 收集最终权重；sigmoid 分支还会归一化权重，最后乘 route_scale。只写 `topk(scores)` 会遗漏这些步骤。

## Python / PyTorch 语法阅读卡

| 代码形态 | 含义 | 要写在纸上的问题 |
| --- | --- | --- |
| `tokens[:, prev_pos:cur_pos]` | 保留批次维，对序列维切片 | 输入是 [B,T]，输出长度是多少？ |
| `argmax(dim=-1)` | 沿最后维取最大下标 | [B,V] 会变为 [B] |
| `torch.where(mask, a, b)` | 按布尔 mask 逐元素选择 | 三者能否广播到同一形状？ |
| `topk(k, dim=-1)` | 返回值与索引 | 是 token 候选还是专家候选？ |
| `gather(1, indices)` | 按索引从第 1 维收集 | [N,E] 与 [N,K] 得到 [N,K] |
| `keepdim=True` | 归约后保留长度 1 的维 | [N,K] 求和变 [N,1]，便于广播 |

这里的语法解释可以帮助阅读，但若要手写注意力，还需补齐 Q/K/V、缩放、因果 mask 与稳定 softmax；不要把本页三种数组函数称为完整 Attention 实现。

终端运行 `npm run practice:deepseek`，代码在 `examples/algorithms/deepseek.ts`。来源：[sample / generate](https://github.com/deepseek-ai/DeepSeek-V3/blob/9b4e9788e4a3a731f7567338ed15d3ec549ce03b/inference/generate.py)、[Gate.forward](https://github.com/deepseek-ai/DeepSeek-V3/blob/9b4e9788e4a3a731f7567338ed15d3ec549ce03b/inference/model.py)。

返回 [[projects/algorithms/index|项目目录]]。
