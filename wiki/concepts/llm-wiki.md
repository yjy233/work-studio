---
title: LLM Wiki
tags: [知识管理, AI]
---
# 让知识持续生长

LLM Wiki 把资料整理成可维护的知识页。人收集资料、提出问题；Agent 阅读、归纳、建立连接。

## 三个层次

1. **原始资料**：放在 `raw/`，保留原文。
2. **知识页**：在 `sources/` 和 `concepts/` 中沉淀摘要与概念。
3. **维护约定**：`AGENTS.md` 告诉 Codex 如何整理、引用和检查。

## 在 Work Studio 中使用

打开左侧 **LLM Wiki**，导入 Markdown 资料，再点击 **整理资料**。助手切换到 Wiki 维护模式后，由你发送任务。

普通问答采用只读模式。维护模式可以编辑当前 Wiki，并更新 [[index|知识索引]] 和 [[log|维护记录]]。

## 下一步

尝试阅读 [[raw/first-source|第一份资料]]，让 Codex 提取一页摘要，再通过 [[concepts/links|双向链接]] 把它连接起来。

## 参考

- [Andrej Karpathy · LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
