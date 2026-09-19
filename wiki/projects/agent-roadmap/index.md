---
title: Agent 学习路线
tags: [Agent, 路线]
---
# Agent 学习路线

目标：读懂一个 Agent 如何调用工具、积累状态、判断结束，并能解释各层的取舍。主线是 **mini-SWE-agent → Pi → Hermes**。这是按学习复杂度安排的路线，不代表三个项目存在继承关系。

## 学习地图

| 阶段 | 核心问题 | 笔记 | 可交付的小成果 |
| --- | --- | --- | --- |
| 0 · 基础 | Agent 比普通聊天多了什么？ | [[projects/agent-roadmap/concepts|八个基本概念]] | 画出一次读文件的消息流 |
| 1 · 最小闭环 | 一次行动怎样变成下一次输入？ | [[projects/agent-roadmap/mini|mini-SWE-agent]] | 可离线运行的确定性轨迹 |
| 2 · 可扩展运行时 | 流式事件、工具与会话怎么组合？ | [[projects/agent-roadmap/pi|Pi]] | 一个可取消的只读工具 |
| 3 · 持续使用 | 记忆、技能与会话分别存什么？ | [[projects/agent-roadmap/hermes|Hermes]] | 一份有来源的知识整理技能 |
| 4 · 回到工作台 | 如何验证 Agent 真的完成了任务？ | [[projects/agent-roadmap/labs|实验与验收]] | 同一任务的三份轨迹比较 |

建议节奏是每周一个阶段，每天 45–60 分钟；这是学习安排，不是项目官方时间估计。先跑通一个小实验，再增加抽象。TypeScript 不熟时并行阅读 [[projects/typescript/index|语法项目]]，Python 细节可在源码页问 Codex。

## 里程碑

- [ ] 能用自己的话解释 model、tool、loop、context
- [ ] 完成 mini 的离线实验，找到一次 observation
- [ ] 解释 Pi 的事件流、取消信号和会话持久化
- [ ] 区分 Hermes 的会话、记忆与技能
- [ ] 用相同任务比较三种系统的失败处理

## 本次研究基线

核查日期：2026-09-19。mini 提交 `04d809ceab9d`；Pi 提交 `36b60d2e8985`；Hermes 提交 `03fee43ca344`。各笔记中的源码链接固定到提交；将来更新时应记录差异。

Pi 原地址 `badlogic/pi-mono` 当前重定向到 `earendil-works/pi`，本次快照使用 `@earendil-works/*` 包名。旧材料里的包名和文件位置需要核对。来源：[Pi 官方仓库](https://github.com/earendil-works/pi/blob/36b60d2e8985899743c4cf5bd5f8929832a3f05d/README.md)。
