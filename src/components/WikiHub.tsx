import { useState } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  Upload,
  Files,
  Network,
  ScanLine,
  Check,
  FileText,
  ArrowRight,
  Plus,
  CalendarDays,
  Link2,
} from 'lucide-react';
import type { LintResult, WikiFile } from '../lib/types';
import { api } from '../lib/api';
import type { AgentDraft } from './AgentPanel';
export function WikiHub({
  files,
  onOpen,
  onImport,
  onAsk,
}: {
  files: WikiFile[];
  onOpen: (path: string) => void;
  onImport: () => void;
  onAsk: (draft: AgentDraft) => void;
}) {
  const [lint, setLint] = useState<LintResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const raw = files.filter((f) => f.path.startsWith('raw/'));
  const knowledge = files.filter((f) => /^(concepts|sources)\//.test(f.path));
  async function check() {
    setBusy(true);
    setError('');
    try {
      setLint(await api<LintResult>('/lint'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const ask = (text: string, mode: 'ask' | 'maintain') => onAsk({ text, mode, key: Date.now() });
  return (
    <div className="hub-scroll">
      <div className="hub-content">
        <div className="hub-intro">
          <div className="section-eyebrow">
            <Sparkles size={14} /> KNOWLEDGE, GROWING
          </div>
          <h1>让资料，成为自己的知识。</h1>
          <p>你负责好奇，Codex 帮你阅读、归纳和建立连接。</p>
          <button className="button primary" onClick={onImport}>
            <Upload size={15} />
            导入资料
          </button>
        </div>
        <div className="pipeline">
          <div>
            <span className="step-icon">
              <Files size={21} />
            </span>
            <small>01 · 收集</small>
            <h3>留下原始材料</h3>
            <p>文章、灵感、阅读笔记</p>
            <code>wiki/raw/</code>
          </div>
          <ArrowRight className="pipeline-arrow" size={18} />
          <div>
            <span className="step-icon">
              <Sparkles size={21} />
            </span>
            <small>02 · 整理</small>
            <h3>和 Codex 一起提炼</h3>
            <p>保留出处，生成摘要与概念</p>
            <code>wiki/sources/</code>
          </div>
          <ArrowRight className="pipeline-arrow" size={18} />
          <div>
            <span className="step-icon">
              <Network size={21} />
            </span>
            <small>03 · 连接</small>
            <h3>让知识慢慢生长</h3>
            <p>交叉引用，持续更新知识地图</p>
            <code>wiki/concepts/</code>
          </div>
        </div>
        <div className="hub-section-heading">
          <div>
            <h2>
              资料收件箱 <span>{raw.length}</span>
            </h2>
            <p>每一份资料，都可能是新想法的起点。</p>
          </div>
          <button className="text-button" onClick={onImport}>
            <Plus size={14} /> 添加资料
          </button>
        </div>
        <div className="source-list">
          {raw.length ? (
            raw.map((f) => (
              <div className="source-row" key={f.path}>
                <div className="source-icon">
                  <FileText size={19} />
                </div>
                <button className="source-title" onClick={() => onOpen(f.path)}>
                  <strong>{f.title}</strong>
                  <span>{f.path}</span>
                </button>
                <span className="source-date">
                  {new Date(f.updatedAt).toLocaleDateString('zh-CN')}
                </span>
                <button
                  className="button"
                  onClick={() =>
                    ask(
                      `请整理原始资料 ${f.path}：提炼一页带来源引用的摘要，更新相关概念页、index.md 和 log.md，保留原始资料不变。`,
                      'maintain',
                    )
                  }
                >
                  <Sparkles size={14} />
                  整理资料
                  <ArrowUpRight size={13} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state small">
              <Files size={28} />
              <h3>知识，从一份资料开始</h3>
              <p>导入 Markdown 或文本文件，让 Codex 帮你整理。</p>
              <button className="button" onClick={onImport}>
                导入第一份资料
              </button>
            </div>
          )}
        </div>
        <div className="health-section">
          <div className="health-heading">
            <span className="step-icon">
              <ScanLine size={21} />
            </span>
            <div>
              <h2>给知识库做一次小检查</h2>
              <p>
                {files.length} 个文档 · {knowledge.length} 个知识页 ·{' '}
                {files.reduce((s, f) => s + f.links.length, 0)} 条连接
              </p>
            </div>
            <button className="button" onClick={() => void check()} disabled={busy}>
              {busy ? '检查中…' : '检查知识库'}
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
          {lint && (
            <div className="lint-results">
              <p className="lint-summary">
                <Check size={15} />
                检查完成：{lint.broken.length} 个失效链接，{lint.orphans.length} 个未被引用的页面
              </p>
              {lint.broken.map((b, i) => (
                <button key={i} onClick={() => onOpen(b.path)}>
                  <Link2 size={13} />
                  <span>
                    {b.path} → {b.target}
                  </span>
                  <small>失效链接</small>
                </button>
              ))}
              {lint.orphans.map((p) => (
                <button key={p} onClick={() => onOpen(p)}>
                  <FileText size={13} />
                  <span>{p}</span>
                  <small>尚未被引用</small>
                </button>
              ))}
              {(lint.broken.length > 0 || lint.orphans.length > 0) && (
                <button
                  className="text-button"
                  onClick={() =>
                    ask(
                      '请检查 Wiki 的失效链接、孤立页面和缺失来源，先列出具体问题与修复建议。不要修改文件。',
                      'ask',
                    )
                  }
                >
                  和 Codex 一起检查 <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          )}
        </div>
        <p className="hub-footnote">原始资料保留在本地。每次整理，都会为知识多添一条连接。</p>
      </div>
    </div>
  );
}
export function Journal({
  files,
  onOpen,
  onToday,
}: {
  files: WikiFile[];
  onOpen: (path: string) => void;
  onToday: () => void;
}) {
  const notes = files
    .filter((f) => f.path.startsWith('journal/'))
    .sort((a, b) => b.path.localeCompare(a.path));
  return (
    <div className="hub-scroll">
      <div className="hub-content">
        <div className="hub-intro">
          <div className="section-eyebrow">
            <CalendarDays size={14} /> A LITTLE, EVERY DAY
          </div>
          <h1>把今天，留在这里。</h1>
          <p>记录做过的事、冒出的想法，以及还没有答案的问题。</p>
          <button className="button primary" onClick={onToday}>
            <Plus size={15} />
            写今天的笔记
          </button>
        </div>
        <div className="journal-list">
          {notes.map((f) => (
            <button key={f.path} onClick={() => onOpen(f.path)}>
              <div className="journal-date">
                <CalendarDays size={19} />
                <span>{f.path.split('/').pop()?.replace('.md', '')}</span>
              </div>
              <h2>{f.title}</h2>
              <p>{f.excerpt}</p>
              <ArrowUpRight size={17} />
            </button>
          ))}
          {!notes.length && (
            <div className="empty-state">
              <div className="empty-illustration">✳</div>
              <h2>今天，也有值得记下的事。</h2>
              <p>不需要完美的开头。一句话，也是一篇笔记。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
