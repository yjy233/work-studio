---
title: 开始使用
tags: [指南, 工作台]
---
# 欢迎来到 Work Studio

> 一个安静的地方，用来思考、记录与连接。

## 从一页笔记开始

这里是你的个人 Wiki。所有内容都是普通的 **Markdown 文件**，保存在项目的 `wiki/` 文件夹中。

你可以随时编辑，也可以交给 Codex，一起让想法变得更清晰。

## 建立你的知识网络

- 用 [[concepts/llm-wiki|LLM Wiki]] 整理原始资料
- 用 [[concepts/links|双向链接]] 连接相关想法
- 在每日笔记里，记录正在发生的事

## 今天的小事

- [x] 建立自己的工作空间
- [ ] 写下第一个想法
- [ ] 邀请 Codex 一起思考

## 为思考留一点空间

```markdown
# 一个新的想法

今天，我在思考……

相关笔记：[[index|知识索引]]
```

| 快捷键 | 用途 |
| --- | --- |
| ⌘ / Ctrl + K | 搜索知识库 |
| ⌘ / Ctrl + S | 保存当前文档 |
| ⌘ / Ctrl + J | 展开 Codex 助手 |

---

不必一次整理完。知识会慢慢生长。

## 学习项目与终端

左侧「学习项目」有四个入口：Agent 路线、mini-SWE-agent 源码、TypeScript、算法题详解。先读项目首页，再按章节练习；在 Markdown 中把里程碑的 `[ ]` 改为 `[x]` 可记录进度。

点击右上角「终端」，或按 Ctrl + 反引号，展开本地 Shell。可以拖动上边缘调整高度，Ctrl+C 中断当前命令。隐藏面板时进程继续运行；刷新可重连，断开超过 30 分钟或工作台服务重启后不会保留旧进程。

在项目根目录运行 `npm run practice:greedy` 可验证贪心题解；`npm run practice:typescript` 运行语法示例。学习目录从 [[projects/agent-roadmap/index|Agent 学习路线]] 或 [[projects/algorithms/index|算法题详解]] 开始。
