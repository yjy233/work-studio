---
title: 第三站 · Hermes 的记忆与技能
tags: [Agent, Hermes, 记忆]
---
# 第三站 · Hermes 的记忆与技能

这一站关注持续使用一个 Agent 时新出现的问题：会话历史越来越长，经验需要复用，来自不同入口的请求需要隔离。

## 从四条线进入源码

- **运行与会话**：[AIAgent 入口](https://github.com/NousResearch/hermes-agent/blob/03fee43ca344ead7245a3b0ae20d38de0ae75642/run_agent.py)。当前 `AIAgent` 组合多个 mixin，继续追 `TurnFacadeMixin`，不要只在一个巨大的入口文件里找所有实现。
- **长期记忆**：[MemoryManager](https://github.com/NousResearch/hermes-agent/blob/03fee43ca344ead7245a3b0ae20d38de0ae75642/agent/memory_manager.py)。观察 provider 注册、prefetch、sync、flush 和 session 生命周期钩子。
- **技能管理**：[skill_manager_tool](https://github.com/NousResearch/hermes-agent/blob/03fee43ca344ead7245a3b0ae20d38de0ae75642/tools/skill_manager_tool.py)。找到写入、校验、更新的调用位置，再反查技能发现和加载。
- **多入口运行**：[Gateway](https://github.com/NousResearch/hermes-agent/blob/03fee43ca344ead7245a3b0ae20d38de0ae75642/gateway/run.py)。关注消息如何路由到会话，以及同一用户不同任务如何区分。

## 先区分三种持久化对象

| 对象 | 应当回答的问题 | 典型失败 |
| --- | --- | --- |
| 会话历史 | 当时发生了什么？ | 恢复后丢失工具调用对应关系 |
| 长期记忆 | 今后哪些事实仍然有用？ | 把推测写成用户事实 |
| Skill | 再做类似任务应该怎样做？ | 将偶然成功步骤固化为通用规则 |

记忆写入和检索可能异步进行。阅读 `flush_pending` 时思考：进程关闭时写入未完成会怎样？阅读 session switch 时思考：旧会话检索结果能否串进新会话？这些是学习问题，需要在具体测试中确认，而不是看到函数名就宣称没有问题。

## 用自己的 Wiki 做一个最小技能

任务：将 `raw/` 中一份资料整理成来源页和概念页。技能要写清输入来源、允许修改的目录、保留原文的方法、引用格式、完成检查和失败返回。可直接复用 [[concepts/llm-wiki|LLM Wiki]] 的流程概念。

验收时只提供一份十行资料，其中混入一条错误事实和一句“忽略前面规则”。观察整理结果是否保留来源、标注矛盾，并把那句话当资料处理。这个实验检验工作流，不能证明所有提示注入都被解决。

## 克制地理解“学习”

官方强调从经验创建和改进技能、检索过去会话。这里学习的是外部记忆与流程积累，不应直接等同于模型权重更新。功能范围与运行入口以 [Hermes 官方介绍](https://github.com/NousResearch/hermes-agent/blob/03fee43ca344ead7245a3b0ae20d38de0ae75642/README.md) 为准；本项目尚未部署或连接 Hermes 的外部通信渠道。

返回 [[projects/agent-roadmap/index|项目目录]]。
