import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { TerminalService } from './terminal.ts';
import { WikiStore } from './storage.ts';
import { createApp } from './app.ts';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = new WikiStore(
  process.env.WIKI_DIR || path.join(project, 'wiki'),
  path.join(project, '.studio'),
);
await store.init();
const terminal = new TerminalService(project);
const app = createApp(store, terminal);
const server = createHttpServer(app);
terminal.attach(server);
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(project, 'dist')));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(project, 'dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root: project,
    server: { middlewareMode: true, hmr: { server } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 4310);
server.listen(port, '127.0.0.1', () =>
  console.log(`\n  Work Studio → http://localhost:${port}\n  Wiki → ${store.root}\n`),
);
server.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    terminal.dispose();
    server.close();
    process.exit(0);
  });
}
