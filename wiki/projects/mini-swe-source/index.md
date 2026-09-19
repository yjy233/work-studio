---
title: mini-SWE-agent 源码解读
tags: [源码, mini-SWE-agent]
---
# mini-SWE-agent 源码解读

研究对象：官方 v2 源码，固定提交 `04d809ceab9df28f9adaed044884180159172930`，核查日期 2026-09-19。本文采用按调用链解释的方法，不机械翻译每一行。

## 章节

1. [[projects/mini-swe-source/loop|入口与核心循环]]：run、step、query 如何接起来。
2. [[projects/mini-swe-source/protocol|Model 与消息协议]]：行动和观察在哪里转换。
3. [[projects/mini-swe-source/environment|Environment 与任务完成]]：独立进程、超时、完成标记。
4. [[projects/mini-swe-source/failures|预算、异常与轨迹]]：成功退出和程序崩溃分别怎么记录。
5. [[projects/mini-swe-source/lab|不调用 LLM 的离线实验]]：用确定性模型验证自己的理解。

## 先记住这张职责表

| 模块 | 职责 | 不应混淆为 |
| --- | --- | --- |
| Agent | 组织循环与消息、计量、保存轨迹 | 所有模型协议的解析器 |
| Model | 请求适配、行动解析、观察格式化 | 真实命令执行器 |
| Environment | 执行、收集输出、识别提交 | 模型推理过程 |
| Run / Config | 装配、参数、提示模板 | 核心循环本身 |

## 里程碑

- [ ] 在源码标出完整调用链
- [ ] 看懂 extra.actions 和 tool_call_id 的用途
- [ ] 实验确认 cd 不跨行动保留
- [ ] 复现步数超限与完成提交
- [ ] 根据轨迹解释一次失败

源码目录来源：[Model / Environment 协议](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/__init__.py)、[DefaultAgent](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py)。学习定位参见 [[projects/agent-roadmap/mini|路线第一站]]。
