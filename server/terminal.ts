import { randomBytes, randomUUID } from 'node:crypto';
import os from 'node:os';
import type { Server } from 'node:http';
import { spawn, type IPty } from 'node-pty';
import { WebSocket, WebSocketServer } from 'ws';
import { HttpError } from './storage.ts';

type Session = {
  id: string;
  pty?: IPty;
  socket?: WebSocket;
  output: string;
  exitCode?: number;
  cleanup?: ReturnType<typeof setTimeout>;
};
const DIMENSION = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isInteger(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;

/** One local PTY per browser tab. Hiding the panel does not interrupt its process. */
export class TerminalService {
  private sessions = new Map<string, Session>();
  private tickets = new Map<string, { id: string; expires: number }>();
  private wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
  constructor(
    public cwd: string,
    private shell = process.env.SHELL || os.userInfo().shell || '/bin/zsh',
  ) {}

  issue(id?: string, restart = false) {
    for (const [key, ticket] of this.tickets) {
      if (ticket.expires < Date.now()) this.tickets.delete(key);
    }
    if (this.tickets.size >= 128) throw new HttpError(429, '终端连接过于频繁，请稍后再试');
    let session = typeof id === 'string' ? this.sessions.get(id) : undefined;
    if (restart && session) {
      this.destroy(session);
      session = undefined;
    }
    if (!session) {
      if (this.sessions.size >= 8) throw new HttpError(429, '终端会话已满，请关闭不使用的终端');
      session = { id: randomUUID(), output: '' };
      this.sessions.set(session.id, session);
      this.expire(session, 60_000);
    }
    const token = randomBytes(32).toString('hex');
    this.tickets.set(token, { id: session.id, expires: Date.now() + 60_000 });
    return { id: session.id, token, cwd: this.cwd, shell: this.shell };
  }

  attach(server: Server) {
    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '/', 'http://localhost');
      if (url.pathname !== '/api/terminal/socket') return;
      const host = request.headers.host || '';
      const token = url.searchParams.get('token') || '';
      const ticket = this.tickets.get(token);
      if (
        !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ||
        request.headers.origin !== `http://${host}` ||
        !ticket ||
        ticket.expires < Date.now() ||
        !this.sessions.has(ticket.id)
      ) {
        socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        return;
      }
      this.tickets.delete(token);
      this.wss.handleUpgrade(request, socket, head, (ws) =>
        this.connect(ws, this.sessions.get(ticket.id)!),
      );
    });
    server.once('close', () => this.dispose());
  }

  private send(session: Session, payload: object) {
    const socket = session.socket;
    if (socket?.readyState !== WebSocket.OPEN) return;
    if (socket.bufferedAmount > 1024 * 1024) {
      socket.close(1013, '输出过快，请重连');
      return;
    }
    socket.send(JSON.stringify(payload));
  }

  private connect(socket: WebSocket, session: Session) {
    clearTimeout(session.cleanup);
    session.socket?.close(1000, '已在另一个页面连接');
    session.socket = socket;
    this.send(session, { type: 'ready', cwd: this.cwd, shell: this.shell });
    if (session.output) this.send(session, { type: 'output', data: session.output });
    if (session.exitCode !== undefined)
      this.send(session, { type: 'exit', code: session.exitCode });
    else if (!session.pty) {
      try {
        const env = Object.fromEntries(
          Object.entries(process.env).filter(
            (e): e is [string, string] => typeof e[1] === 'string',
          ),
        );
        const pty = spawn(this.shell, ['-l'], {
          name: 'xterm-256color',
          cols: 100,
          rows: 20,
          cwd: this.cwd,
          env: { ...env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
        });
        session.pty = pty;
        pty.onData((data) => {
          session.output = (session.output + data).slice(-128 * 1024);
          this.send(session, { type: 'output', data });
        });
        pty.onExit(({ exitCode }) => {
          session.exitCode = exitCode;
          session.pty = undefined;
          this.send(session, { type: 'exit', code: exitCode });
        });
      } catch (error) {
        session.exitCode = -1;
        this.send(session, { type: 'error', message: `终端启动失败：${(error as Error).message}` });
      }
    }
    socket.on('message', (data, binary) => {
      if (binary || session.socket !== socket) return socket.close(1003);
      try {
        const message = JSON.parse(data.toString());
        if (
          message.type === 'input' &&
          typeof message.data === 'string' &&
          message.data.length <= 32 * 1024
        )
          session.pty?.write(message.data);
        else if (message.type === 'resize')
          session.pty?.resize(
            DIMENSION(message.cols, 100, 2, 500),
            DIMENSION(message.rows, 20, 2, 200),
          );
      } catch {
        socket.close(1003, '无效的终端消息');
      }
    });
    let alive = true;
    const heartbeat = setInterval(() => {
      if (!alive) return socket.terminate();
      alive = false;
      socket.ping();
    }, 30_000);
    heartbeat.unref();
    socket.on('pong', () => {
      alive = true;
    });
    socket.on('error', () => socket.terminate());
    socket.on('close', () => {
      clearInterval(heartbeat);
      if (session.socket !== socket) return;
      session.socket = undefined;
      this.expire(session, 30 * 60_000);
    });
  }

  private expire(session: Session, delay: number) {
    clearTimeout(session.cleanup);
    session.cleanup = setTimeout(() => this.destroy(session), delay);
    session.cleanup.unref();
  }
  private destroy(session: Session) {
    clearTimeout(session.cleanup);
    session.socket?.close();
    session.socket = undefined;
    try {
      session.pty?.kill();
    } catch {
      /* Already exited. */
    }
    this.sessions.delete(session.id);
  }
  dispose() {
    for (const session of this.sessions.values()) this.destroy(session);
    this.tickets.clear();
    this.wss.close();
  }
}
