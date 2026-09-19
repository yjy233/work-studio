import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Search, FileText, ArrowUpRight, X, Plus, RotateCcw } from 'lucide-react';
import type { WikiFile } from '../lib/types';
export function Dialog({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button className="icon-button" title="关闭" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function SearchDialog({
  files,
  onOpen,
  onClose,
}: {
  files: WikiFile[];
  onOpen: (path: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const results = query.trim()
    ? files
        .filter((f) =>
          `${f.title}\n${f.path}\n${f.content}`.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 30)
    : [...files].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);
  function select(path: string) {
    onOpen(path);
    onClose();
  }
  return (
    <Dialog title="搜索知识库" onClose={onClose} className="search-dialog">
      <div className="search-input">
        <Search size={19} />
        <input
          autoFocus
          placeholder="搜索标题、内容、标签…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, results.length - 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            }
            if (e.key === 'Enter' && results[index]) select(results[index].path);
          }}
        />
        <kbd>ESC</kbd>
      </div>
      <div className="search-results">
        <p className="section-eyebrow">{query ? `${results.length} 个匹配结果` : '最近编辑'}</p>
        {results.map((f, i) => (
          <button
            className={i === index ? 'focused' : ''}
            key={f.path}
            onClick={() => select(f.path)}
            onMouseEnter={() => setIndex(i)}
          >
            <FileText size={17} />
            <div>
              <strong>{f.title}</strong>
              <span>{f.path}</span>
              <p>{query ? excerpt(f.content, query) : f.excerpt}</p>
            </div>
            <ArrowUpRight size={15} />
          </button>
        ))}
        {!results.length && (
          <div className="empty-state small">
            <Search size={28} />
            <h3>还没有找到这个想法</h3>
            <p>换一个关键词，或创建一页新笔记。</p>
          </div>
        )}
      </div>
      <footer className="dialog-footer">
        ↑ ↓ 选择 <span>↵ 打开文档</span>
      </footer>
    </Dialog>
  );
}
function excerpt(content: string, query: string) {
  const at = content.toLowerCase().indexOf(query.toLowerCase());
  return content.slice(Math.max(0, at - 25), Math.max(0, at - 25) + 130).replace(/\n/g, ' ');
}
export function NewDialog({
  initial = '',
  onCreate,
  onClose,
}: {
  initial?: string;
  onCreate: (path: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onCreate(/\.(md|markdown)$/i.test(name) ? name : `${name}.md`);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="给一个想法安个家" onClose={onClose}>
      <form className="new-form" onSubmit={submit}>
        <p>写下一页笔记。你也可以用 / 创建目录。</p>
        <label htmlFor="new-path">文件路径</label>
        <div className="path-input">
          <span>wiki /</span>
          <input
            id="new-path"
            autoFocus
            placeholder="concepts/我的新想法.md"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <small>保存为普通 Markdown 文件，随时可以用其他编辑器打开。</small>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={busy || !name.trim()}>
            <Plus size={15} />
            {busy ? '正在创建…' : '创建文档'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function TrashDialog({
  entries,
  onRestore,
  onClose,
}: {
  entries: { id: string; path: string; deletedAt: string }[];
  onRestore: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [error, setError] = useState('');
  return (
    <Dialog title="回收站" onClose={onClose}>
      <div className="trash-list">
        {!entries.length && <p className="empty-small">回收站是空的。删除的文档会暂存在这里。</p>}
        {entries.map((e) => (
          <div key={e.id}>
            <FileText size={17} />
            <span>
              <strong>{e.path}</strong>
              <small>{new Date(e.deletedAt).toLocaleString('zh-CN')}</small>
            </span>
            <button
              className="button"
              onClick={() => onRestore(e.id).catch((err) => setError(err.message))}
            >
              <RotateCcw size={14} />
              恢复
            </button>
          </div>
        ))}
        {error && <p className="form-error">{error}</p>}
      </div>
    </Dialog>
  );
}
