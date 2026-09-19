import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  X,
  Sparkles,
  FileText,
  Plus,
  Square,
  ChevronDown,
  LoaderCircle,
  Check,
  TriangleAlert,
} from 'lucide-react';
import { api, local } from '../lib/api';
import type { AgentStatus, ChatMessage, Conversation, WikiFile } from '../lib/types';
import { Markdown } from './Markdown';
export interface AgentDraft {
  text: string;
  mode: 'ask' | 'maintain';
  key: number;
}
export function AgentPanel({
  open,
  onClose,
  current,
  files,
  draft,
  beforeSend,
  onRefresh,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  current: string;
  files: WikiFile[];
  draft: AgentDraft | null;
  beforeSend: () => Promise<boolean>;
  onRefresh: () => void;
  onNavigate: (target: string) => void;
}) {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'ask' | 'maintain'>('ask');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [activity, setActivity] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const [session, setSession] = useState<string | null>(local.get('conversation'));
  const [ready, setReady] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!session) {
      setReady(true);
      return;
    }
    api<Conversation>(`/agent/conversation/${session}`)
      .then((chat) => {
        setMessages(chat.messages);
        setMode(chat.mode);
      })
      .catch(() => {
        local.remove('conversation');
        setSession(null);
      })
      .finally(() => setReady(true));
    // Load only the conversation saved when this panel mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (open)
      api<AgentStatus>('/agent/status')
        .then(setStatus)
        .catch((e) => setError(e.message));
  }, [open]);
  useEffect(() => {
    if (draft) {
      setInput(draft.text);
      setMode(draft.mode);
    }
  }, [draft]);
  useEffect(() => {
    if (open && (messages.length || activity))
      bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activity, open]);
  useEffect(() => () => abort.current?.abort(), []);
  async function send() {
    if (!input.trim() || running || !ready) return;
    if (!(await beforeSend())) {
      setError('请先解决当前文档的保存冲突。');
      return;
    }
    const message = input.trim();
    setInput('');
    setError('');
    setRunning(true);
    setActivity('正在连接 Codex…');
    setDetail('');
    setMessages((old) => [...old, { id: crypto.randomUUID(), role: 'user', content: message }]);
    const controller = new AbortController();
    abort.current = controller;
    let done = false;
    let failed = false;
    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Studio-Request': '1' },
        body: JSON.stringify({
          message,
          mode,
          contextPath: current || undefined,
          conversationId: session,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error((await response.json()).error);
      if (!response.body) throw new Error('浏览器无法读取流式响应');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === 'session') {
          setSession(event.id);
          local.set('conversation', event.id);
        }
        if (event.type === 'message')
          setMessages((old) =>
            old.some((m) => m.id === event.id)
              ? old.map((m) => (m.id === event.id ? { ...m, content: event.text } : m))
              : [...old, { id: event.id, role: 'assistant', content: event.text }],
          );
        if (event.type === 'activity') {
          setActivity(event.text);
          setDetail(event.detail || '');
        }
        if (event.type === 'error') {
          failed = true;
          setError(event.message);
        }
        if (event.type === 'done') done = true;
      };
      while (true) {
        const { value, done: ended } = await reader.read();
        if (ended) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach(consume);
      }
      buffer += decoder.decode();
      if (buffer.trim()) consume(buffer);
      if (!done && !failed) throw new Error('连接提前结束，可以重试本次问题');
    } catch (e) {
      if (!controller.signal.aborted) {
        setError((e as Error).message);
        setInput(message);
      } else setActivity('已停止，已完成的文件操作会保留');
    } finally {
      setRunning(false);
      abort.current = null;
      if (done) setActivity('本次任务已完成');
      onRefresh();
    }
  }
  function newChat() {
    if (running) return;
    setMessages([]);
    setSession(null);
    local.remove('conversation');
    setError('');
    setActivity('');
  }
  return (
    <aside className={`agent-panel ${open ? 'open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="agent-heading">
        <div>
          <div className="agent-title">
            <Sparkles size={19} />
            <strong>Codex</strong>
            <span className={`connection-dot ${status?.loggedIn ? 'connected' : ''}`} />
          </div>
          <p>一起思考，让知识生长</p>
        </div>
        <button className="icon-button" title="新对话" onClick={newChat} disabled={running}>
          <Plus size={17} />
        </button>
        <button className="icon-button" title="关闭助手" onClick={onClose}>
          <X size={17} />
        </button>
      </div>
      {current && (
        <div className="context-chip">
          <FileText size={13} />
          <span>上下文 · {files.find((f) => f.path === current)?.title || current}</span>
        </div>
      )}
      <div className="chat-scroll">
        {!messages.length && (
          <div className="agent-welcome">
            <div className="agent-emblem">
              <Sparkles size={25} />
            </div>
            <h2>从一个问题开始</h2>
            <p>
              阅读你的 Wiki，连接零散的想法。
              <br />
              为下一步思考，留一点空间。
            </p>
            <div className="suggestions">
              {[
                '总结当前文档的要点',
                '找出当前文档与其他笔记的联系',
                '检查知识库中的失效链接和缺失来源',
              ].map((text) => (
                <button
                  key={text}
                  onClick={() => {
                    setInput(text);
                    setMode('ask');
                  }}
                >
                  {text}
                  <span>↗</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div className={`message ${m.role}`} key={m.id}>
            <div className="message-label">
              {m.role === 'user' ? (
                '你'
              ) : (
                <>
                  <Sparkles size={12} /> Codex
                </>
              )}
            </div>
            <div className="message-body markdown">
              <Markdown content={m.content} path={current} files={files} onNavigate={onNavigate} />
            </div>
          </div>
        ))}
        {activity && (
          <details className="agent-activity">
            <summary>
              {running ? <LoaderCircle className="spin" size={13} /> : <Check size={13} />}{' '}
              {activity}
              {detail && <ChevronDown size={12} />}
            </summary>
            {detail && <pre>{detail}</pre>}
          </details>
        )}
        {error && (
          <div className="agent-error">
            <TriangleAlert size={15} />
            <span>{error}</span>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div className="composer-area">
        {status && !status.loggedIn && (
          <div className="setup-note">
            {status.detail}
            <button onClick={() => api<AgentStatus>('/agent/status').then(setStatus)}>
              重新检查
            </button>
          </div>
        )}
        <div className="composer">
          <textarea
            aria-label="向 Codex 提问"
            placeholder="有什么想一起探索的？"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <div className="composer-actions">
            <select
              aria-label="Codex 工作模式"
              value={mode}
              disabled={running}
              onChange={(e) => setMode(e.target.value as 'ask' | 'maintain')}
            >
              <option value="ask">◉ 只读问答</option>
              <option value="maintain">✧ Wiki 维护</option>
            </select>
            {running ? (
              <button
                className="send-button stop"
                title="停止生成"
                onClick={() => abort.current?.abort()}
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                className="send-button"
                title="发送消息"
                disabled={!input.trim() || !ready || !status?.loggedIn}
                onClick={() => void send()}
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
        </div>
        <p className="composer-caption">
          {mode === 'maintain'
            ? '维护模式 · Codex 可以修改 wiki/ 中的文档'
            : 'Codex · 只读你的本地知识库'}
          <span>↵ 发送</span>
        </p>
      </div>
    </aside>
  );
}
