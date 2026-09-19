import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { WebSocket } from 'ws';
import { TerminalService } from '../server/terminal.ts';
import { WikiStore } from '../server/storage.ts';
import { createApp } from '../server/app.ts';

test(
  'terminal requires same-origin single-use ticket; PTY persists through reconnect and can be restarted',
  { timeout: 15000 },
  async (t) => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'studio-pty-'));
    const store = new WikiStore(path.join(dir, 'wiki'), path.join(dir, 'state'));
    await store.init();
    const terminal = new TerminalService(dir, '/bin/sh');
    const server = createServer(createApp(store, terminal));
    terminal.attach(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as { port: number }).port;
    const base = `http://127.0.0.1:${port}`;
    const sockets: WebSocket[] = [];
    t.after(async () => {
      for (const s of sockets) s.terminate();
      terminal.dispose();
      await new Promise<void>((r) => server.close(() => r()));
      await rm(dir, { recursive: true, force: true });
    });
    const ticket = async (body = {}) => {
      const response = await fetch(`${base}/api/terminal/session`, {
        method: 'POST',
        headers: { 'X-Studio-Request': '1', 'Content-Type': 'application/json', Origin: base },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 200);
      return response.json() as Promise<{ id: string; token: string }>;
    };
    const reject = async (token: string, origin: string) => {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/api/terminal/socket?token=${token}`, {
          origin,
        });
        ws.once('unexpected-response', (_req, res) => {
          assert.equal(res.statusCode, 403);
          res.resume();
          ws.terminate();
          resolve();
        });
        ws.on('error', () => {});
        ws.once('open', () => {
          ws.close();
          reject(new Error('Unauthorized websocket accepted'));
        });
      });
    };
    const connect = async (token: string) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/api/terminal/socket?token=${token}`, {
        origin: base,
      });
      sockets.push(ws);
      let output = '';
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'output') output += msg.data;
        if (msg.type === 'error') output += msg.message;
      });
      await new Promise<void>((resolve, reject) => {
        ws.once('open', resolve);
        ws.once('error', reject);
      });
      return { ws, output: () => output };
    };
    const until = async (get: () => string, expected: string) => {
      const start = Date.now();
      while (!get().includes(expected)) {
        if (Date.now() - start > 5000) throw new Error(`Missing ${expected} in ${get()}`);
        await new Promise((r) => setTimeout(r, 25));
      }
    };
    const noMarker = await fetch(`${base}/api/terminal/session`, { method: 'POST' });
    assert.equal(noMarker.status, 403);
    const a = await ticket();
    await reject(a.token, 'https://untrusted.example');
    await reject('invalid', base);
    const one = await connect(a.token);
    await reject(a.token, base);
    one.ws.send(
      JSON.stringify({
        type: 'input',
        data: 'export STUDIO_CHECK=kept; printf \'\\n%s\\n\' "$STUDIO_CHECK"; pwd\r',
      }),
    );
    await until(one.output, '\r\nkept\r\n');
    await until(one.output, dir);
    one.ws.send(JSON.stringify({ type: 'resize', cols: 93, rows: 17 }));
    one.ws.send(JSON.stringify({ type: 'input', data: 'stty size\r' }));
    await until(one.output, '17 93');
    await new Promise<void>((resolve) => {
      one.ws.once('close', () => resolve());
      one.ws.close();
    });
    const b = await ticket({ id: a.id });
    assert.equal(b.id, a.id);
    const two = await connect(b.token);
    await until(two.output, '\r\nkept\r\n'); // Replayed output.
    two.ws.send(
      JSON.stringify({ type: 'input', data: 'printf \'\\nRESUME_%s\\n\' "$STUDIO_CHECK"\r' }),
    );
    await until(two.output, '\r\nRESUME_kept\r\n');
    two.ws.send(JSON.stringify({ type: 'input', data: 'sleep 20\r' }));
    await new Promise((r) => setTimeout(r, 80));
    two.ws.send(JSON.stringify({ type: 'input', data: '\x03' }));
    two.ws.send(JSON.stringify({ type: 'input', data: "printf '\\nINTERRUPTED_OK\\n'\r" }));
    await until(two.output, '\r\nINTERRUPTED_OK\r\n');
    const c = await ticket({ id: b.id, restart: true });
    assert.notEqual(c.id, b.id);
    const three = await connect(c.token);
    three.ws.send(
      JSON.stringify({
        type: 'input',
        data: 'printf \'\\nFRESH_%s\\n\' "${STUDIO_CHECK:-empty}"\r',
      }),
    );
    await until(three.output, '\r\nFRESH_empty\r\n');
  },
);
