// Optional live test: uses the existing Codex account and consumes model usage.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { WikiStore } from '../server/storage.ts';
import { createApp } from '../server/app.ts';
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'work-studio-agent-'));
const store = new WikiStore(path.join(directory, 'wiki'), path.join(directory, 'state'));
await store.init();
await store.write(
  'AGENTS.md',
  '# Wiki rules\n仅修改当前 Wiki 中的 Markdown，raw/ 只读。不要创建子 agent。',
  null,
);
await store.write('raw/example.md', '# 测试资料\n每周回顾笔记，并为相关想法建立链接。', null);
await store.write('index.md', '# 索引\n', null);
await store.write('log.md', '# 维护记录\n', null);
const raw = await store.read('raw/example.md');
const app = createApp(store);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve) => server.once('listening', resolve));
const port = (server.address() as { port: number }).port;
try {
  const response = await fetch(`http://127.0.0.1:${port}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Studio-Request': '1' },
    body: JSON.stringify({
      mode: 'maintain',
      contextPath: 'raw/example.md',
      message:
        '这是隔离的功能测试。读取 raw/example.md；创建 sources/example.md，写一句摘要并用相对 Markdown 链接引用原文；在 index.md 添加摘要页链接；在 log.md 追加一行记录。不要修改其他文件。最后简短回复完成。',
    }),
    signal: AbortSignal.timeout(180000),
  });
  assert.equal(response.status, 200);
  let result = '';
  for await (const chunk of response.body!) {
    const text = new TextDecoder().decode(chunk);
    result += text;
    process.stdout.write(text);
  }
  assert.ok(result.includes('"type":"done"'), 'Agent must report successful completion');
  assert.equal(
    (await store.read('raw/example.md')).version,
    raw.version,
    'Original must remain unchanged',
  );
  assert.match((await store.read('sources/example.md')).content, /raw\/example\.md/);
  assert.match((await store.read('index.md')).content, /sources\/example/);
  assert.ok((await store.read('log.md')).content.length > '# 维护记录\n'.length);
  console.log(
    'PASS: real Codex ingestion, source citation, index/log updates, original preserved.',
  );
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await fs.rm(directory, { recursive: true, force: true });
}
