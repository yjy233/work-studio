# Work Studio — 设计方案 v1

先完成界面设计，再实现功能。Figma 插件已安装，但当前会话未暴露创建或写入工具；本地保留可直接导入 Figma 的 SVG，不能将其描述为已创建的 Figma 云端文件。

## 方向

温暖、安静、有秩序的个人工作台。米白画布、深绿强调色、轻边框、紧凑的工具栏与宽松的正文。中文界面，文件名保留原样。

## 布局

1440 × 960 桌面画布。244px 左侧导航；顶部 64px 路径栏；文档标题与操作区；源代码/预览左右双栏。AI 默认关闭，点击 Codex 按钮从右侧展开 368px 面板，小屏使用覆盖层。左侧包括知识库、每日笔记、LLM Wiki，以及按目录分组的 Markdown 文件。

## 视觉变量

- Canvas #FFFFFF，Sidebar #F7F8F5，Muted surface #F4F5F1
- Text #242C27，Secondary #7A827A，Border #E7EAE3
- Accent #355C48，Accent subtle #EAF0E8，Warm note #F7F2E7
- UI 字体 DM Sans / system-ui / PingFang SC；代码 SFMono-Regular / monospace
- 基础字号 13px；正文 15px / 1.9；标题 28px
- Radius: 6 / 10 / 14；Spacing: 4 / 8 / 12 / 16 / 24 / 32

## 交互

- Markdown 自动保存到 wiki/；保存冲突时保留草稿，用户选择重新加载或保存副本。
- 文档模式：编辑、双栏、阅读；源代码支持行号、语法高亮、查找。
- Cmd/Ctrl+K 全文搜索；Cmd/Ctrl+S 保存；Cmd/Ctrl+J 展开助手。
- Wiki 链接 [[文件名|标题]] 可跳转，反向链接列出引用当前页的文档。
- 导入 Markdown 到 raw/；通过 Codex 整理成知识页，保留来源、更新 index.md 和 log.md。
- Codex 问答默认只读，维护模式允许修改 wiki/，显示工具动作与执行状态，支持停止。
- 删除移入 .studio/trash，可恢复；外部文件更新通过版本校验避免覆盖。

## 画板

- work-studio.svg：默认双栏写作界面
- work-studio-agent.svg：Codex 对话展开状态
