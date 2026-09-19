# 验证记录

2026-09-19，本机验证。

- `npm run check`：8 项测试通过，TypeScript 检查与 Vite 生产构建通过。
- `tsc --noEmit --noUnusedLocals`：通过。
- 真实浏览器：创建 Markdown、编辑实时渲染、自动保存到磁盘、刷新持久化、全文搜索、Wiki 链接跳转、反向链接、LLM Wiki 检查、删除与回收站恢复。
- 窄屏：编辑器与预览上下排列，修复编辑器内容溢出遮挡预览的问题。
- 桌面：双栏视图与 Codex 展开面板均经截图检查。
- 真实 Codex 只读调用：成功读取 index.md 并返回带文档引用的回答。
- `npm run test:agent`：在独立临时 Wiki 中成功创建来源摘要、更新索引和日志，原始资料哈希保持不变。测试目录已清理。
- 本地 Markdown 与图片端点：拒绝跨目录访问和符号链接，检查并发版本冲突、跨站写入和回收站恢复冲突。
- Figma：插件安装状态已确认；本次会话没有暴露 Figma 创建或读写工具。网页打开超时。已完成 SVG 设计稿，尚未创建云端 Figma 文件。

## 2026-09-19 · 学习项目与终端

- 新增 30 篇学习笔记：Agent 路线 6 篇、mini-SWE-agent 源码 6 篇、TypeScript 7 篇、算法与 DeepSeek 方向 11 篇。
- Wiki 共 36 篇可见文档，实际 API 与存储检查均为 0 个失效链接、0 个孤立页面。
- `npm run check`：17 项测试通过，TypeScript 检查与生产构建通过。
- `npm run practice:typescript` 与 `tsc --noEmit --noUnusedLocals`：通过；Markdown 中 Python 实验代码经 AST 语法检查，未安装完整 mini-SWE-agent 依赖运行。
- 贪心题解与独立的穷举、最短路径、DP 参考比较；Softmax 检查大数、平移不变性、归一化；Top-K 检查平局与边界。
- 真实 PTY 集成测试：同源校验、一次性凭证、命令执行、环境变量保留、窗口尺寸、Ctrl+C、重连回放、结束后新建均通过。
- 修复 node-pty 1.1.0 macOS spawn-helper 缺少执行权限；安装脚本保证后续 npm install 可复现。
- 生产服务已重启到新版本。通过真实 HTTP + WebSocket 验证 30 篇项目文档、Wiki lint 和当前用户本地 Shell 的启动、输入、退出。
- 本轮新增页面的浏览器目视检查未完成：CUA 返回 Mac 已锁屏且自动解锁失败。已请求用户手动解锁，未以接口检查替代视觉验收。
