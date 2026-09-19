import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Eraser, Maximize2, Minimize2, RotateCcw, TerminalSquare, X } from 'lucide-react';
import { api } from '../lib/api';
import '@xterm/xterm/css/xterm.css';

export default function TerminalPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fit = useRef<FitAddon | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const [connection, setConnection] = useState('连接中');
  const [error, setError] = useState('');
  const [cwd, setCwd] = useState('work-studio');
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState(290);
  const [attempt, setAttempt] = useState(0);
  const restart = useRef(false);
  const drag = useRef<{ y: number; height: number } | null>(null);

  useEffect(() => {
    const term = new Terminal({
      fontFamily: '"SFMono-Regular", Consolas, monospace',
      fontSize: 12,
      lineHeight: 1.35,
      cursorBlink: true,
      screenReaderMode: true,
      scrollback: 5000,
      convertEol: false,
      theme: {
        background: '#18241f',
        foreground: '#d9e3d9',
        cursor: '#bfd8a8',
        selectionBackground: '#52634f80',
        black: '#18241f',
        red: '#e79e98',
        green: '#b1cc9a',
        yellow: '#dcc992',
        blue: '#94b8d0',
        magenta: '#c6add5',
        cyan: '#92c8c1',
        white: '#d9e3d9',
      },
    });
    const addon = new FitAddon();
    term.loadAddon(addon);
    term.open(host.current!);
    term.textarea?.setAttribute('aria-label', '终端输入');
    terminal.current = term;
    fit.current = addon;
    const observer = new ResizeObserver(() => {
      if (host.current?.offsetHeight) addon.fit();
    });
    observer.observe(host.current!);
    const input = term.onData((data) => {
      if (socket.current?.readyState === WebSocket.OPEN)
        socket.current.send(JSON.stringify({ type: 'input', data }));
    });
    const resize = term.onResize(({ cols, rows }) => {
      if (socket.current?.readyState === WebSocket.OPEN)
        socket.current.send(JSON.stringify({ type: 'resize', cols, rows }));
    });
    return () => {
      observer.disconnect();
      input.dispose();
      resize.dispose();
      term.dispose();
      terminal.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | undefined;
    const abort = new AbortController();
    setConnection('连接中');
    setError('');
    const shouldRestart = restart.current;
    restart.current = false;
    let id: string | undefined;
    try {
      id = sessionStorage.getItem('studio:terminal') || undefined;
    } catch {
      /* Private mode. */
    }
    void api<{ id: string; token: string; cwd: string }>('/terminal/session', {
      method: 'POST',
      body: JSON.stringify({ id, restart: shouldRestart }),
      signal: abort.signal,
    })
      .then((session) => {
        if (cancelled) return;
        try {
          sessionStorage.setItem('studio:terminal', session.id);
        } catch {
          /* Still usable. */
        }
        setCwd(session.cwd);
        terminal.current?.reset();
        ws = new WebSocket(
          `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/terminal/socket?token=${session.token}`,
        );
        socket.current = ws;
        ws.onopen = () => {
          if (cancelled) {
            ws?.close();
            return;
          }
          setConnection('已连接');
          fit.current?.fit();
          const term = terminal.current;
          if (term) ws?.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
          if (host.current?.offsetHeight) term?.focus();
        };
        ws.onmessage = (event) => {
          if (cancelled) return;
          const message = JSON.parse(event.data);
          if (message.type === 'output') terminal.current?.write(message.data);
          if (message.type === 'exit') {
            setConnection('已退出');
            terminal.current?.writeln(
              `\r\n[进程已退出，状态码 ${message.code}。点击右上角重新启动。]`,
            );
          }
          if (message.type === 'error') {
            setError(message.message);
            setConnection('启动失败');
          }
        };
        ws.onclose = () => {
          if (!cancelled) setConnection((s) => (s === '已退出' ? s : '已断开'));
        };
        ws.onerror = () => {
          if (!cancelled) setError('终端连接失败，可点击重连。');
        };
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setConnection('连接失败');
        }
      });
    return () => {
      cancelled = true;
      abort.abort();
      ws?.close();
      socket.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    if (open)
      requestAnimationFrame(() => {
        fit.current?.fit();
        terminal.current?.focus();
      });
  }, [open, expanded]);

  return (
    <section
      className={`terminal-panel ${expanded ? 'expanded' : ''}`}
      hidden={!open}
      aria-label="工作台终端"
      style={{ height: expanded ? 'min(65vh, 640px)' : height }}
    >
      <div
        className="terminal-resize"
        role="separator"
        aria-label="调整终端高度"
        aria-orientation="horizontal"
        aria-valuemin={170}
        aria-valuemax={600}
        aria-valuenow={height}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            setExpanded(false);
            setHeight((h) => Math.max(170, Math.min(600, h + (e.key === 'ArrowUp' ? 20 : -20))));
          }
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          setExpanded(false);
          drag.current = {
            y: e.clientY,
            height: e.currentTarget.parentElement!.getBoundingClientRect().height,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current && e.currentTarget.hasPointerCapture(e.pointerId))
            setHeight(
              Math.max(
                170,
                Math.min(
                  window.innerHeight * 0.7,
                  drag.current.height + drag.current.y - e.clientY,
                ),
              ),
            );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      />
      <header className="terminal-toolbar">
        <TerminalSquare size={14} />
        <strong>终端</strong>
        <span className={`terminal-dot ${connection === '已连接' ? 'connected' : ''}`} />
        <span>{connection}</span>
        <span className="terminal-cwd" title={cwd}>
          {cwd.replace(/^.*\/code\//, '~/code/')}
        </span>
        <div className="terminal-actions">
          {connection !== '已连接' && connection !== '连接中' && connection !== '已退出' && (
            <button onClick={() => setAttempt((v) => v + 1)}>重连</button>
          )}
          <button title="清空终端显示" onClick={() => terminal.current?.clear()}>
            <Eraser size={14} />
          </button>
          <button
            title="结束并新建终端"
            onClick={() => {
              restart.current = true;
              setAttempt((v) => v + 1);
            }}
          >
            <RotateCcw size={14} />
          </button>
          <button
            title={expanded ? '还原终端高度' : '展开终端高度'}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button title="隐藏终端（保留进程）" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </header>
      {error && (
        <div className="terminal-error" role="alert">
          {error}
        </div>
      )}
      <div className="terminal-host" ref={host} />
      <footer className="terminal-hint">
        本地 Shell · 隐藏后继续运行<span>Ctrl+C 中断 · Ctrl+` 显示 / 隐藏</span>
      </footer>
    </section>
  );
}
