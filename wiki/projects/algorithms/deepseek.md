---
title: DeepSeek 备考 · 先核对来源
tags: [DeepSeek, 备考, 来源]
---
# DeepSeek 备考 · 先核对来源

当前把“DeepSeek 的语法题”暂按**面试算法 / 编程题方向**整理，示例用 TypeScript；Python / PyTorch 语法补充放在关联源码练习中。若你的意思是另一套具体题单，本页可继续补充。

## 已核验与待核验

| 材料 | 当前状态 | 如何使用 |
| --- | --- | --- |
| 本专题 LeetCode 题 | 官方题面可追溯 | 用于贪心基础训练，不能据此称 DeepSeek 真题 |
| DeepSeek-V3 inference 源码 | 官方仓库、固定提交 | 用于采样、top-k、张量语法阅读 |
| 网络面经题单 | 本次没有取得可确认的官方题库 | 暂不标注“DeepSeek 高频”或“必考” |
| 你提供的具体题目 | 待补充 | 保留原约束、日期、岗位与出处，再写题解 |

本次检索看到第三方面经和培训题库，但无法据此确认某道贪心题确实在 DeepSeek 面试出现。宁可把出处留待核验，也不把普通练习改个公司名。

## 针对这一方向的练习安排

1. **通用算法**：先完成本专题，证明局部选择正确；随后再补堆 / Top-K、二分、哈希、滑窗、DP。这是准备建议，不是已确认的招聘题型比例。
2. **代码表达**：用 TS 练边界、类型与实现；读官方推理实现时切换到 Python / PyTorch，并写出每个张量的形状。
3. **模型工程基本功**：从 argmax 与采样的区别、stable softmax、MoE top-k 进入。详细代码见 [[projects/algorithms/inference|推理代码练习]]。
4. **面试说明**：先复述约束，再讲不变量和复杂度，最后用小反例验证。不要先背模板代码。

## 题目来源登记模板

```markdown
- 标题 / 原题描述：
- 原始链接：
- 日期 / 岗位 / 笔试或面试：
- 来源类型：官方 / 当事人记录 / 二次转载 / 未核验
- 已明确的输入约束：
- 缺失信息：
- 我采用的假设：
- 题解与测试：
```

官方源码入口：[生成与采样](https://github.com/deepseek-ai/DeepSeek-V3/blob/9b4e9788e4a3a731f7567338ed15d3ec549ce03b/inference/generate.py)、[模型与 Gate](https://github.com/deepseek-ai/DeepSeek-V3/blob/9b4e9788e4a3a731f7567338ed15d3ec549ce03b/inference/model.py)。固定提交 `9b4e9788e4a3`，核查日期 2026-09-19。

返回 [[projects/algorithms/index|项目目录]]。
