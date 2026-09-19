# Work Studio

一个本地优先的个人工作台：左边写 Markdown，右边实时阅读；需要时，展开 Codex 一起思考。文档保存在项目的 `wiki/` 中，可直接用 Git 或其他编辑器管理。

## 启动

需要 Node.js 22.12+ 和 npm。项目已包含依赖锁文件。

```bash
cd /Users/bill/code/work-studio
npm install
npm run dev
```

打开 **http://localhost:4310**。前端与文件 API 使用同一个本地端口，默认仅监听 `127.0.0.1`。

生产模式：

```bash
npm run build
npm start
```

## 已实现

- CodeMirror Markdown 编辑器：语法高亮、行号、查找、格式工具栏。
- GFM 实时预览：任务列表、表格、代码高亮、本地与远程图片；编辑 / 双栏 / 阅读三种模式。
- 文件树、全文搜索（⌘/Ctrl K）、创建文档、Markdown 导出、每日笔记。
- 750ms 自动保存、⌘/Ctrl S、浏览器草稿恢复、外部修改检测、版本冲突保护。
- `[[path|标题]]` Wiki 链接、相对 Markdown 链接、反向链接、章节大纲。
- 删除进入 `.studio/trash/`；回收站支持恢复，同名文件不会被覆盖。
- LLM Wiki：导入 `.md` / `.markdown` / `.txt` 资料、整理任务、失效链接与孤立页面检查。
- 默认隐藏的 Codex 面板（⌘/Ctrl J）：流式消息、工具状态、停止执行、持久会话、当前文档上下文。
- 四个学习项目与 30 篇 Wiki：Agent 路线、mini-SWE-agent 源码、TypeScript、贪心与 DeepSeek 方向练习。
- 可收起的真实本地终端（Ctrl+反引号）：交互式 Shell、窗口尺寸同步、Ctrl+C、中断与重连。
- 桌面和窄屏适配；字体本地打包，无在线字体依赖。

## Codex

使用官方 `@openai/codex-sdk` 调用本机 Codex CLI，复用现有登录：

```bash
codex login
codex login status
npm run dev
```

如果终端找不到 CLI，可以用官方 npm 包安装，或显式指定本机路径：

```bash
CODEX_BIN=/path/to/codex npm run dev
```

- **只读问答**：read-only 沙箱，读取知识页并引用来源。
- **Wiki 维护**：workspace-write 沙箱，在 `wiki/` 中整理文档。点击「整理资料」会预填任务，发送后才运行。
- 切换模式会建立新的 Codex 上下文，避免沿用另一种权限的对话；聊天记录仍保留。
- 默认使用本机 Codex 配置中的模型；可通过 `CODEX_MODEL` 覆盖。
- Codex 在 Wiki 工作目录运行。`wiki/AGENTS.md` 定义原始资料只读、来源引用、索引与日志更新约定。
- 运行中关闭对话面板不会停止任务；「停止生成」会取消执行，已完成的文件操作保留。
- macOS 下自动复用现有系统 HTTPS 代理（仅传给 Codex 子进程），不修改任何系统设置。已有 `HTTPS_PROXY` / `ALL_PROXY` 优先；`STUDIO_SYSTEM_PROXY=0` 可禁用自动检测。
- 聊天调用需要网络及可用的 Codex 账户；Markdown 编辑、搜索与本地检查不需要模型服务。

参考：[Codex SDK 官方文档](https://developers.openai.com/codex/sdk/)。

## LLM Wiki 目录

```text
wiki/
  AGENTS.md           # Codex 维护约定
  index.md            # 知识地图
  welcome.md          # 工作台指南
  log.md              # 维护日志
  raw/                # 原始资料
  sources/            # 带出处的资料摘要
  concepts/           # 概念与交叉引用
  journal/            # YYYY-MM-DD.md 每日笔记
  projects/           # 学习项目，各有 index.md 和章节
    agent-roadmap/
    mini-swe-source/
    typescript/
    algorithms/
.studio/              # 本地会话与回收站，不提交 Git
```

导入资料 → LLM Wiki → 整理资料 → 检查任务和维护模式 → 发送。Codex 会归纳资料，建立知识页并更新索引与日志。没有配置数据库或向量数据库；文件就是数据源。

该工作流参考 [Karpathy 的 LLM Wiki 思路](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)。

## 学习项目与终端

从左侧「学习项目」进入四个项目，或打开 `http://localhost:4310/?section=research`。在项目首页编辑任务列表的 `[ ]` / `[x]` 记录学习进度，卡片会从磁盘笔记读取里程碑完成数。开源源码按 2026-09-19 查询到的提交固定引用；DeepSeek 练习没有冒称已核验面试真题。

```bash
npm run practice:typescript # 运行 TS 语法示例
npm run practice:greedy     # 贪心与穷举 / 最短路 / DP 参考比较
npm run practice:deepseek   # Softmax、argmax 和 Top-K 教学练习
```

终端默认不启动，首次点击右上角「终端」才连接。初始目录为本项目，Shell 使用本机 `SHELL`。隐藏面板保留进程；清空显示不影响进程；「结束并新建终端」会终止旧 Shell。可拖动上边缘调整高度，或点击放大按钮。

浏览器同一标签刷新后可恢复连接及最近输出，断开连接超过 30 分钟回收，工作台服务退出时回收。最多保留 8 个会话，每个会话缓存最近 131,072 个 JavaScript 字符单位的输出；它不是永久终端日志。

后端以 node-pty 创建本地 PTY，前端 xterm 按需加载。终端拥有启动工作台的本机用户权限，目录是起始位置而非隔离沙箱。连接仅接受同源 Origin，并需要通过受保护的 POST 接口领取短期、一次性 WebSocket 凭证。不要将本服务直接暴露到公网。

macOS 下 node-pty 1.1.0 的预编译 spawn-helper 缺少执行权限，项目 `postinstall` 会修正当前依赖中的该文件权限（[上游 issue #850](https://github.com/microsoft/node-pty/issues/850)）。若安装时跳过脚本，启动前执行 `node scripts/setup-pty.mjs`。

## 设计稿

`design/work-studio.svg` 和 `design/work-studio-agent.svg` 是开发前创建的可编辑矢量画板，可以拖入 Figma；`design/DESIGN.md` 记录布局、颜色与交互规范。

当前会话已确认 Figma 插件安装，但没有获得可调用的 Figma 读写接口，网页访问也超时。因此暂未生成 Figma 云端文件或链接；这里的 SVG 不是 `.fig` 文件。

## 配置

环境变量通过 shell 设置，`.env.example` 提供示例（不会自动读取 `.env`）：

| 变量 | 默认 |
| --- | --- |
| `PORT` | `4310` |
| `WIKI_DIR` | 项目内 `wiki/` |
| `CODEX_BIN` | PATH 中的 `codex` |
| `CODEX_MODEL` | 本机 Codex 默认模型 |
| `STUDIO_SYSTEM_PROXY` | macOS 自动检测，设为 `0` 关闭 |

## 验证

```bash
npm test          # 文件 / API、真实 PTY、算法穷举与数值计算，共 17 项
npm run build     # TypeScript 类型检查与生产构建
npm run check     # 两者一起
npm run test:agent # 可选：真实 Codex 整理测试，会消耗账户额度
```

应用面向个人、本机使用；没有多用户认证或公网部署配置。单个 Markdown 最大 2 MB。当前导入支持文本资料，不包含 PDF/网页抓取。图片可放入 wiki/assets/ 并使用相对路径引用（PNG/JPEG/GIF/WebP/AVIF）。预览不执行原始 HTML。
