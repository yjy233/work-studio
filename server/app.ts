import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { WikiStore, HttpError } from './storage.ts';
import { AgentService } from './agent.ts';
import type { TerminalService } from './terminal.ts';
import { getLint } from '../src/lib/wiki.ts';
export function createApp(store: WikiStore, terminal?: TerminalService) {
  const app = express();
  const agent = new AgentService(store);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const host = (req.headers.host || '').split(':')[0];
    if (!['localhost', '127.0.0.1', '[::1]'].includes(host))
      return res.status(403).json({ error: '仅允许本机访问' });
    const origin = req.headers.origin;
    if (origin && origin !== `http://${req.headers.host}`)
      return res.status(403).json({ error: '拒绝跨站访问' });
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
    if (
      req.path.startsWith('/api/') &&
      !['GET', 'HEAD'].includes(req.method) &&
      req.headers['x-studio-request'] !== '1'
    )
      return res.status(403).json({ error: '缺少工作台请求标识' });
    next();
  });
  app.use(express.json({ limit: '3mb' }));
  if (terminal)
    app.post('/api/terminal/session', (req, res) => {
      res.json(terminal.issue(req.body?.id, req.body?.restart === true));
    });
  app.get('/api/files', async (_req, res) => res.json(await store.list()));
  app.get('/api/document', async (req, res) =>
    res.json(await store.read(String(req.query.path || ''))),
  );
  app.put('/api/document', async (req, res) => {
    if (
      !Object.hasOwn(req.body, 'version') ||
      !(req.body.version === null || typeof req.body.version === 'string')
    )
      throw new HttpError(400, '缺少文档版本');
    res.json(await store.write(req.body.path, req.body.content, req.body.version));
  });
  app.delete('/api/document', async (req, res) =>
    res.json(await store.trash(req.body.path, req.body.version)),
  );
  app.get('/api/trash', async (_req, res) => res.json(await store.trashList()));
  app.post('/api/restore', async (req, res) => res.json(await store.restore(req.body.id)));
  app.get('/api/asset', async (req, res) => {
    const filename = await store.safe(String(req.query.path || ''), [
      'png',
      'jpg',
      'jpeg',
      'gif',
      'webp',
      'avif',
    ]);
    res.sendFile(filename);
  });
  app.get('/api/lint', async (_req, res) => res.json(getLint(await store.list())));
  app.get('/api/agent/status', async (_req, res) => res.json(await agent.status()));
  app.get('/api/agent/conversation/:id', async (req, res) =>
    res.json(await agent.get(req.params.id)),
  );
  app.post('/api/agent/chat', (req, res, next) => {
    agent.run(req, res).catch(next);
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: '接口不存在' }));
  const errors: ErrorRequestHandler = (err, _req, res, _next) => {
    if (res.headersSent) {
      res.end();
      return;
    }
    const status =
      err instanceof HttpError
        ? err.status
        : err.code === 'ENOENT'
          ? 404
          : err.status === 413
            ? 413
            : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? '操作未完成，请检查终端日志' : err.message });
  };
  app.use(errors);
  return app;
}
