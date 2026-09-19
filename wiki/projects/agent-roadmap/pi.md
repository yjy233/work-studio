---
title: 第二站 · Pi 的事件、工具与会话
tags: [Agent, Pi, TypeScript]
---
# 第二站 · Pi 的事件、工具与会话

Pi 适合学习如何把一个 Agent 循环接成可交互的软件。先读核心循环，再读 CLI 的会话层，最后研究扩展。

## 分层地图

| 层 | 关注的边界 | 首先读 |
| --- | --- | --- |
| pi-ai | 不同模型提供商的请求、消息和流式输出 | [包职责表](https://github.com/earendil-works/pi/blob/36b60d2e8985899743c4cf5bd5f8929832a3f05d/README.md) |
| pi-agent-core | 状态、工具调用、事件与取消 | [agent-loop.ts](https://github.com/earendil-works/pi/blob/36b60d2e8985899743c4cf5bd5f8929832a3f05d/packages/agent/src/agent-loop.ts) |
| pi-coding-agent | CLI 模式、会话、压缩和扩展 | [AgentSession](https://github.com/earendil-works/pi/blob/36b60d2e8985899743c4cf5bd5f8929832a3f05d/packages/coding-agent/src/core/agent-session.ts) |
| 会话存储 | 消息如何持久化和恢复上下文 | [session-manager.ts](https://github.com/earendil-works/pi/blob/36b60d2e8985899743c4cf5bd5f8929832a3f05d/packages/coding-agent/src/core/session-manager.ts) |

## 跟踪一次 prompt

`agentLoop()` 构造事件流并驱动 `runAgentLoop()`，共享的 `runLoop()` 处理模型响应和工具结果。内层处理工具与 steering 消息；外层在即将结束时检查 follow-up 队列。返回给 UI 的事件与下次交给模型的消息不是同一个概念。

用两种颜色做笔记：一种标 `message_update` 等 UI 事件，另一种标真正追加到上下文中的消息。UI 可以显示“工具执行中”，但这种状态标签通常不需要原样喂给模型。

## 本次快照的三个值得研究的细节

1. `AgentMessage` 可以包含应用消息，调用模型前经转换收敛为模型支持的格式。研究 `transformContext` 与 `convertToLlm` 的先后关系。
2. 工具可以并行执行，但完成事件的顺序和持久化 toolResult 的顺序不同：结果消息仍按模型提出调用的顺序组织。对比一个快工具与一个慢工具。
3. CLI 的 `AgentSession` 同时服务 interactive、print、rpc 模式。模式负责 I/O，会话层处理状态与持久化，不必为每个界面复制循环。

以上行为来源：[Agent core 官方说明](https://github.com/earendil-works/pi/blob/36b60d2e8985899743c4cf5bd5f8929832a3f05d/packages/agent/README.md)。当前代码还包含新的 harness/session 实现；初学先限定以上调用链，不把新旧存储层混作一个类。

## 小实验：设计一个只读 Wiki 工具

输入约定为路径，输出为内容与版本。列出四种结果：成功、不存在、超出 wiki、取消。先在普通函数中写测试，再接到工具接口，最后把执行事件接到界面。不要直接从 React 组件调用文件系统。

扩展阅读：[Coding agent 文档入口](https://github.com/earendil-works/pi/blob/36b60d2e8985899743c4cf5bd5f8929832a3f05d/packages/coding-agent/README.md)。本次只做源码研究，没有替换工作台当前使用的 Codex Agent。

返回 [[projects/agent-roadmap/index|项目目录]]。
