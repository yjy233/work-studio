import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WikiStore } from '../server/storage.ts';
import { createApp } from '../server/app.ts';
import { extractLinks, getLint, resolveLink } from '../src/lib/wiki.ts';
async function fixture(t: any) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'work-studio-test-'));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const store = new WikiStore(path.join(base, 'wiki'), path.join(base, 'state'));
  await store.init();
  return { base, store };
}
test('nested Markdown persists across store instances and metadata is parsed', async (t) => {
  const { store } = await fixture(t);
  await store.write(
    'concepts/思考.md',
    '---\ntitle: 一个想法\ntags: [记录]\n---\n# 内容\n[[index]]',
    null,
  );
  const fresh = new WikiStore(store.root, store.state);
  const files = await fresh.list();
  assert.equal(files[0].title, '一个想法');
  assert.deepEqual(files[0].tags, ['记录']);
  assert.deepEqual(files[0].links, ['index']);
  assert.equal((await fresh.read(files[0].path)).content, files[0].content);
});
test('stale and simultaneous saves cannot overwrite newer content', async (t) => {
  const { store } = await fixture(t);
  const initial = await store.write('note.md', 'initial', null);
  const results = await Promise.allSettled([
    store.write('note.md', 'first', initial.version),
    store.write('note.md', 'second', initial.version),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal((await store.read('note.md')).content, 'first');
  await fs.writeFile(path.join(store.root, 'note.md'), 'external edit');
  await assert.rejects(store.write('note.md', 'stale', initial.version), { status: 409 });
  assert.equal((await store.read('note.md')).content, 'external edit');
});
test('path traversal and symlinks are rejected for reads and writes', async (t) => {
  const { base, store } = await fixture(t);
  for (const bad of [
    '../outside.md',
    '/tmp/outside.md',
    'a/../outside.md',
    '.hidden/a.md',
    'a\\b.md',
    'a.txt',
    'a//b.md',
  ])
    await assert.rejects(store.read(bad), { status: 400 });
  const outside = path.join(base, 'outside.md');
  await fs.writeFile(outside, 'keep');
  await fs.symlink(outside, path.join(store.root, 'link.md'));
  await assert.rejects(store.read('link.md'), { status: 403 });
  await assert.rejects(store.write('link.md', 'overwrite', null), { status: 403 });
  await fs.symlink(base, path.join(store.root, 'escape'));
  await assert.rejects(store.write('escape/test.md', 'no', null), { status: 403 });
  assert.equal(await fs.readFile(outside, 'utf8'), 'keep');
});
test('trash survives restart and restores safely without overwriting', async (t) => {
  const { store } = await fixture(t);
  const note = await store.write('folder/note.md', 'original', null);
  const trash = await store.trash(note.path, note.version);
  await assert.rejects(store.read(note.path), { status: 404 });
  const fresh = new WikiStore(store.root, store.state);
  assert.equal((await fresh.trashList())[0].id, trash.id);
  await fresh.write(note.path, 'newer', null);
  await assert.rejects(fresh.restore(trash.id), { status: 409 });
  const newer = await fresh.read(note.path);
  await fresh.trash(newer.path, newer.version);
  assert.equal((await fresh.restore(trash.id)).content, 'original');
});
test('deleted documents cannot be accidentally recreated by autosave', async (t) => {
  const { store } = await fixture(t);
  const doc = await store.write('note.md', 'hi', null);
  await store.trash(doc.path, doc.version);
  await assert.rejects(store.write(doc.path, 'stale edits', doc.version), { status: 409 });
});
test('wiki links, relative links, ambiguity, code blocks, and lint', async (t) => {
  const { store } = await fixture(t);
  await store.write(
    'index.md',
    '# Index\n[[concepts/idea|想法]]\n[Other](other.md)\n[[missing]]\n`[[not-a-link]]`\n```md\n[[also-not]]\n```',
    null,
  );
  await store.write('concepts/idea.md', '# 想法\n[Index](../index.md)', null);
  await store.write('other.md', '# Other', null);
  await store.write('orphan.md', '# Orphan', null);
  const files = await store.list();
  assert.equal(resolveLink('../index.md', 'concepts/idea.md', files), 'index.md');
  assert.equal(resolveLink('想法', 'index.md', files), 'concepts/idea.md');
  assert.deepEqual(extractLinks('`[[x]]` [[y|Y]] [a](https://example.com) ![img](pic.png)'), ['y']);
  const result = getLint(files);
  assert.deepEqual(result.broken, [{ path: 'index.md', target: 'missing' }]);
  assert.deepEqual(result.orphans, ['orphan.md']);
});
test('API enforces same-origin writes and serves real file changes', async (t) => {
  const { store } = await fixture(t);
  const app = createApp(store);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.once('listening', r));
  t.after(() => new Promise<void>((r) => server.close(() => r())));
  const address = server.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}`;
  const headers = { 'Content-Type': 'application/json', 'X-Studio-Request': '1' };
  assert.equal(
    (
      await fetch(url + '/api/document', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
    ).status,
    403,
  );
  assert.equal(
    (await fetch(url + '/api/files', { headers: { Origin: 'https://attacker.invalid' } })).status,
    403,
  );
  const created = await fetch(url + '/api/document', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ path: 'note.md', content: '# Note', version: null }),
  });
  assert.equal(created.status, 200);
  const doc = await created.json();
  assert.equal(
    (await fetch(url + '/api/document?path=note.md').then((r) => r.json())).content,
    '# Note',
  );
  assert.equal(
    (
      await fetch(url + '/api/document', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...doc, content: '# Updated' }),
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(url + '/api/document', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...doc, content: '# Stale' }),
      })
    ).status,
    409,
  );
});
test('local image endpoint permits images and rejects Markdown or traversal', async (t) => {
  const { store } = await fixture(t);
  await fs.mkdir(path.join(store.root, 'assets'));
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9XcAAAAASUVORK5CYII=',
    'base64',
  );
  await fs.writeFile(path.join(store.root, 'assets', 'pixel.png'), pixel);
  await store.write('secret.md', '# note', null);
  const server = createApp(store).listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.once('listening', r));
  t.after(() => new Promise<void>((r) => server.close(() => r())));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const image = await fetch(url + '/api/asset?path=assets/pixel.png');
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type')!, /image\/png/);
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), pixel);
  assert.equal((await fetch(url + '/api/asset?path=secret.md')).status, 400);
  assert.equal((await fetch(url + '/api/asset?path=../outside.png')).status, 400);
});
