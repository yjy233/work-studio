import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bold,
  Braces,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Columns2,
  Eye,
  FileText,
  Italic,
  Link2,
  List,
  LoaderCircle,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Quote,
  RefreshCw,
  Sparkles,
  Trash2,
  TerminalSquare,
  X,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Markdown } from './components/Markdown';
import { AgentPanel, type AgentDraft } from './components/AgentPanel';
import { Dialog, NewDialog, SearchDialog, TrashDialog } from './components/Dialogs';
import { Journal, WikiHub } from './components/WikiHub';
import { ResearchHub } from './components/ResearchHub';
import { api, ApiError, local } from './lib/api';
import { resolveLink, stripFrontmatter } from './lib/wiki';
import type { WikiDocument, WikiFile } from './lib/types';
const TerminalPanel = lazy(() => import('./components/TerminalPanel'));
const editorTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '13px', color: '#586356', backgroundColor: '#fcfcfa' },
  '.cm-scroller': {
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    lineHeight: '1.95',
    overflow: 'auto',
  },
  '.cm-content': { padding: '27px 16px 100px 10px', caretColor: '#355c48' },
  '.cm-line': { paddingLeft: '6px' },
  '.cm-gutters': { backgroundColor: '#fcfcfa', color: '#b3b9ae', border: 'none', minWidth: '44px' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#63765b' },
  '.cm-activeLine': { backgroundColor: '#f3f5ee80' },
  '&.cm-focused': { outline: 'none' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#dbe6d480' },
});
const editorExtensions = [
  markdown(),
  EditorView.lineWrapping,
  EditorView.contentAttributes.of({ 'aria-label': 'Markdown 编辑器' }),
  editorTheme,
];
type TrashEntry = { id: string; path: string; deletedAt: string };
export default function App() {
  const [files, setFiles] = useState<WikiFile[]>([]);
  const [doc, setDoc] = useState<WikiDocument | null>(null);
  const current = useRef<WikiDocument | null>(null);
  const saved = useRef('');
  const [section, setSection] = useState('wiki');
  const [view, setView] = useState<'edit' | 'split' | 'read'>(
    (local.get('view') as 'split') || 'split',
  );
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalMounted, setTerminalMounted] = useState(false);
  useEffect(() => {
    if (terminalOpen) setTerminalMounted(true);
  }, [terminalOpen]);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentDraft, setAgentDraft] = useState<AgentDraft | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newPath, setNewPath] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'dirty' | 'saving' | 'error'>('saved');
  const [conflict, setConflict] = useState(false);
  const conflictRef = useRef(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [trash, setTrash] = useState<TrashEntry[] | null>(null);
  const [split, setSplit] = useState(48);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const editor = useRef<EditorView | null>(null);
  const panes = useRef<HTMLDivElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const pending = useRef<Promise<boolean> | null>(null);
  const loadingId = useRef(0);
  const docMeta = files.find((f) => f.path === doc?.path);
  const title =
    doc?.content.match(/^#\s+(.+)$/m)?.[1] ||
    docMeta?.title ||
    doc?.path.split('/').pop() ||
    '知识库';
  const displayTitle = docMeta?.title || title;
  const backlinks = useMemo(
    () =>
      files.filter(
        (f) =>
          f.path !== doc?.path && f.links.some((l) => resolveLink(l, f.path, files) === doc?.path),
      ),
    [files, doc?.path],
  );
  const headings = useMemo(
    () =>
      stripFrontmatter(doc?.content || '')
        .replace(/```[\s\S]*?```/g, '')
        .match(/^##\s+.+$/gm)
        ?.map((h) => h.replace(/^##\s+/, '')) || [],
    [doc?.content],
  );
  const words = (stripFrontmatter(doc?.content || '').match(/[\u3400-\u9fff]|[\w-]+/g) || [])
    .length;
  const setConflictFlag = (value: boolean) => {
    conflictRef.current = value;
    setConflict(value);
  };
  const updateDoc = (value: WikiDocument) => {
    current.current = value;
    setDoc(value);
  };
  const refresh = useCallback(async () => {
    const data = await api<WikiFile[]>('/files');
    setFiles(data);
    const active = current.current;
    if (active && !pending.current) {
      const latest = data.find((f) => f.path === active.path);
      if (
        latest &&
        latest.version !== active.version &&
        active.content === saved.current &&
        !conflictRef.current
      ) {
        saved.current = latest.content;
        current.current = latest;
        setDoc(latest);
        setSaveState('saved');
      }
    }
    return data;
  }, []);
  const save = useCallback(async (): Promise<boolean> => {
    if (pending.current) {
      const result = await pending.current;
      if (!result) return false;
    }
    const captured = current.current;
    if (!captured || captured.content === saved.current) return !conflictRef.current;
    if (conflictRef.current) return false;
    setSaveState('saving');
    const operation = (async () => {
      try {
        const result = await api<WikiDocument>('/document', {
          method: 'PUT',
          body: JSON.stringify(captured),
        });
        if (current.current?.path === captured.path) {
          saved.current = captured.content;
          const next = { ...current.current, version: result.version };
          current.current = next;
          setDoc(next);
          const clean = next.content === captured.content;
          if (clean) local.remove(`draft:${captured.path}`);
          else local.set(`draft:${captured.path}`, JSON.stringify(next));
          setSaveState(clean ? 'saved' : 'dirty');
          setError('');
        }
        void refresh().catch(() => {});
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          conflictRef.current = true;
          setConflict(true);
        }
        setSaveState('error');
        setError((err as Error).message);
        return false;
      }
    })();
    pending.current = operation;
    const result = await operation;
    if (pending.current === operation) pending.current = null;
    if (result && current.current && current.current.content !== saved.current) return save();
    return result;
  }, [refresh]);
  async function openFile(path: string, skipSave = false) {
    if (!skipSave && !(await save())) {
      setToast('请先解决保存问题。当前草稿已保留。');
      return;
    }
    const id = ++loadingId.current;
    setLoading(true);
    try {
      const result = await api<WikiDocument>(`/document?path=${encodeURIComponent(path)}`);
      if (id !== loadingId.current) return;
      saved.current = result.content;
      setConflictFlag(false);
      setError('');
      const cached = local.get(`draft:${path}`);
      let draft: WikiDocument | null = null;
      if (cached)
        try {
          draft = JSON.parse(cached);
        } catch {
          local.remove(`draft:${path}`);
        }
      if (draft && typeof draft.content === 'string' && draft.content !== result.content) {
        updateDoc({ ...result, content: draft.content });
        setSaveState('dirty');
        setToast('已恢复上次未保存的草稿');
        if (draft.version !== result.version) {
          setConflictFlag(true);
          setSaveState('error');
          setError('磁盘文档已更新，恢复的草稿需要另存为或重新加载。');
        }
      } else {
        updateDoc(result);
        setSaveState('saved');
      }
      setSection('wiki');
      local.set('last-file', path);
      setOutlineOpen(false);
      if (window.innerWidth < 850) setSidebarOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (id === loadingId.current) setLoading(false);
    }
  }
  useEffect(() => {
    let disposed = false;
    refresh()
      .then((data) => {
        if (disposed) return;
        const last = local.get('last-file');
        const path = data.some((f) => f.path === last)
          ? last!
          : data.find((f) => f.path === 'welcome.md')?.path || data[0]?.path;
        if (path)
          void openFile(path, true).then(() => {
            if (new URLSearchParams(location.search).get('section') === 'research')
              setSection('research');
          });
        else setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
    const timer = setInterval(() => void refresh().catch(() => {}), 5000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
    // Initial loading and external file polling share this refresh function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);
  useEffect(() => {
    if (!doc || doc.content === saved.current || conflict) return;
    const timer = setTimeout(() => void save(), 750);
    return () => clearTimeout(timer);
  }, [doc?.content, conflict, save]);
  useEffect(() => {
    preview.current?.scrollTo({ top: 0 });
  }, [doc?.path]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.code === 'Backquote') {
        e.preventDefault();
        setTerminalOpen((v) => !v);
        return;
      }
      if (e.target instanceof Element && e.target.closest('.terminal-panel')) return;
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save();
      }
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAgentOpen((v) => !v);
      }
    };
    const leave = (e: BeforeUnloadEvent) => {
      if (current.current && current.current.content !== saved.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('beforeunload', leave);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('beforeunload', leave);
    };
  }, [save]);
  function change(content: string) {
    if (!current.current) return;
    const next = { ...current.current, content };
    updateDoc(next);
    local.set(`draft:${next.path}`, JSON.stringify(next));
    setSaveState(content === saved.current ? 'saved' : 'dirty');
  }
  async function create(path: string, content?: string) {
    if (!(await save())) throw new Error('请先解决当前文档的保存问题');
    const name = path
      .split('/')
      .pop()!
      .replace(/\.(md|markdown)$/i, '');
    await api('/document', {
      method: 'PUT',
      body: JSON.stringify({
        path,
        content: content || `---\ntitle: ${JSON.stringify(name)}\ntags: []\n---\n# ${name}\n\n`,
        version: null,
      }),
    });
    await refresh();
    await openFile(path, true);
    setToast('新文档已创建');
  }
  async function navigate(target: string) {
    const resolved = resolveLink(target, current.current?.path || '', files);
    if (resolved) {
      await openFile(resolved);
      if (target.includes('#'))
        setTimeout(
          () =>
            document
              .getElementById(decodeURIComponent(target.split('#')[1]))
              ?.scrollIntoView({ behavior: 'smooth' }),
          100,
        );
    } else {
      setNewPath(target.split('#')[0].replace(/^wiki\//, ''));
      setToast('链接的文档尚不存在，可以现在创建');
    }
  }
  function insert(before: string, after = '', placeholder = '') {
    if (view === 'read') {
      setToast('请切换到编辑或双栏模式');
      return;
    }
    const cm = editor.current;
    if (!cm) return;
    const selection = cm.state.selection.main;
    const selected = cm.state.sliceDoc(selection.from, selection.to) || placeholder;
    cm.dispatch({
      changes: { from: selection.from, to: selection.to, insert: before + selected + after },
      selection: {
        anchor: selection.from + before.length,
        head: selection.from + before.length + selected.length,
      },
    });
    cm.focus();
  }
  async function remove() {
    if (!doc || !(await save())) return;
    try {
      await api('/document', {
        method: 'DELETE',
        body: JSON.stringify({ path: doc.path, version: current.current?.version }),
      });
      local.remove(`draft:${doc.path}`);
      current.current = null;
      saved.current = '';
      setDoc(null);
      setDeleteOpen(false);
      const data = await refresh();
      if (data[0]) await openFile(data[0].path, true);
      setToast('文档已移入回收站，可随时恢复');
    } catch (err) {
      setError((err as Error).message);
      setDeleteOpen(false);
    }
  }
  async function importFiles(items: FileList | null) {
    if (!items) return;
    let count = 0;
    try {
      for (const file of Array.from(items)) {
        if (file.size > 2 * 1024 * 1024) throw new Error(`${file.name} 超过 2 MB`);
        if (!/\.(md|markdown|txt)$/i.test(file.name)) throw new Error('仅支持 Markdown 和文本资料');
        const name = file.name.replace(/\.(md|markdown|txt)$/i, '').replace(/[\\/\0]/g, '-');
        let path = `raw/${name}.md`;
        if (files.some((f) => f.path === path)) path = `raw/${name}-${Date.now()}.md`;
        await api('/document', {
          method: 'PUT',
          body: JSON.stringify({ path, content: await file.text(), version: null }),
        });
        count++;
      }
      await refresh();
      setToast(`已导入 ${count} 份原始资料`);
      setSection('llm');
    } catch (err) {
      await refresh();
      setError(`${count ? `已导入 ${count} 份；` : ''}${(err as Error).message}`);
    } finally {
      if (importInput.current) importInput.current.value = '';
    }
  }
  async function today() {
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const path = `journal/${date}.md`;
    if (files.some((f) => f.path === path)) await openFile(path);
    else
      await create(
        path,
        `---\ntitle: ${date} · 每日笔记\ntags: [日记]\n---\n# ${date}\n\n> 今天，也有值得记下的事。\n\n## 今天的想法\n\n\n## 正在做的事\n\n- [ ] \n\n## 值得留下的连接\n\n[[index|知识索引]]\n`,
      ).catch((e) => setError(e.message));
  }
  async function showTrash() {
    try {
      setTrash(await api<TrashEntry[]>('/trash'));
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  async function saveCopy() {
    if (!doc) return;
    const path = doc.path.replace(/\.(md|markdown)$/i, `-草稿-${Date.now()}.md`);
    try {
      await api('/document', {
        method: 'PUT',
        body: JSON.stringify({ path, content: doc.content, version: null }),
      });
      local.remove(`draft:${doc.path}`);
      setConflictFlag(false);
      await refresh();
      await openFile(path, true);
      setToast('草稿已另存为新文件');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function download() {
    if (!doc) return;
    const url = URL.createObjectURL(
      new Blob([doc.content], { type: 'text/markdown;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = doc.path.split('/').pop()!;
    anchor.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  }
  return (
    <div className={`app ${sidebarOpen ? '' : 'sidebar-hidden'} ${agentOpen ? 'with-agent' : ''}`}>
      {sidebarOpen && (
        <Sidebar
          files={files}
          selected={doc?.path || ''}
          section={section}
          onOpen={(p) => void openFile(p)}
          onSection={(s) => {
            setSection(s);
            if (window.innerWidth < 850) setSidebarOpen(false);
          }}
          onSearch={() => setSearchOpen(true)}
          onNew={() => setNewPath('')}
          onTrash={() => void showTrash()}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      <div className="workspace-main">
        <header className="topbar">
          <button
            className="icon-button"
            title={sidebarOpen ? '收起侧栏' : '展开侧栏'}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <PanelLeft size={17} />
          </button>
          <div className="breadcrumb">
            <span>
              {section === 'research'
                ? '学习项目'
                : section === 'llm'
                  ? 'LLM Wiki'
                  : section === 'journal'
                    ? '每日笔记'
                    : '知识库'}
            </span>
            <ChevronRight size={12} />
            <span>
              {section === 'wiki'
                ? `wiki${doc?.path.includes('/') ? ' / ' + doc.path.split('/').slice(0, -1).join(' / ') : ''}`
                : '工作空间'}
            </span>
            {section === 'wiki' && (
              <>
                <ChevronRight size={12} />
                <strong>{displayTitle}</strong>
              </>
            )}
          </div>
          <span className="topbar-spacer" />
          <button
            className={`terminal-toggle ${terminalOpen ? 'active' : ''}`}
            aria-label="切换终端"
            aria-expanded={terminalOpen}
            title="终端 (Ctrl+`)"
            onClick={() => setTerminalOpen((v) => !v)}
          >
            <TerminalSquare size={15} />
            <span>终端</span>
          </button>
          <button
            className={`agent-toggle ${agentOpen ? 'active' : ''}`}
            onClick={() => setAgentOpen((v) => !v)}
          >
            <Sparkles size={15} />
            <span>Codex</span>
            <kbd>⌘ J</kbd>
          </button>
        </header>
        <div className="workspace-body">
          <main className="workspace-content">
            {error && (
              <div className="error-banner" role="alert">
                <span>{error}</span>
                {conflict ? (
                  <>
                    <button
                      onClick={() => {
                        if (doc) {
                          local.remove(`draft:${doc.path}`);
                          void openFile(doc.path, true);
                        }
                      }}
                    >
                      重新加载磁盘版本
                    </button>
                    <button onClick={() => void saveCopy()}>草稿另存为</button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setError('');
                      void save();
                    }}
                  >
                    <RefreshCw size={13} />
                    重试保存
                  </button>
                )}
              </div>
            )}
            {section === 'research' ? (
              <ResearchHub
                files={files}
                onOpen={(p) => void openFile(p)}
                onTerminal={() => setTerminalOpen(true)}
              />
            ) : section === 'llm' ? (
              <WikiHub
                files={files}
                onOpen={(p) => void openFile(p)}
                onImport={() => importInput.current?.click()}
                onAsk={(d) => {
                  setAgentDraft(d);
                  setAgentOpen(true);
                }}
              />
            ) : section === 'journal' ? (
              <Journal
                files={files}
                onOpen={(p) => void openFile(p)}
                onToday={() => void today()}
              />
            ) : doc ? (
              <>
                <div className="document-header">
                  <div>
                    <div className="section-eyebrow">
                      WORKSPACE <span>/</span>{' '}
                      {doc.path.startsWith('journal/')
                        ? 'JOURNAL'
                        : doc.path.startsWith('raw/')
                          ? 'SOURCES'
                          : 'MY WIKI'}
                    </div>
                    <div className="document-title">
                      <h1>{displayTitle}</h1>
                      {docMeta?.tags.slice(0, 2).map((tag) => (
                        <span className="tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="document-meta">
                      <span>
                        <FileText size={12} />
                        {doc.path}
                      </span>
                      <i>·</i>
                      <span>{words} 字</span>
                      <i>·</i>
                      <span>
                        <Clock3 size={12} />
                        {docMeta
                          ? new Date(docMeta.updatedAt).toLocaleDateString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '今天'}
                      </span>
                    </div>
                  </div>
                  <div className="document-actions">
                    <button
                      className={`save-status ${saveState}`}
                      onClick={() => void save()}
                      title="保存文档 (⌘S)"
                    >
                      {saveState === 'saving' ? (
                        <LoaderCircle className="spin" size={13} />
                      ) : saveState === 'saved' ? (
                        <Check size={13} />
                      ) : (
                        <span className="unsaved-dot" />
                      )}
                      <span>
                        {
                          {
                            saved: '已保存到本地',
                            dirty: '有未保存的修改',
                            saving: '保存中…',
                            error: '保存未完成',
                          }[saveState]
                        }
                      </span>
                    </button>
                    <div className="menu-wrap">
                      <button
                        className="icon-button"
                        title="文档操作"
                        onClick={() => setMenuOpen((v) => !v)}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menuOpen && (
                        <>
                          <button
                            className="menu-dismiss"
                            aria-label="关闭菜单"
                            onClick={() => setMenuOpen(false)}
                          />
                          <div className="document-menu">
                            <button onClick={download}>
                              <ArrowDownToLine size={14} />
                              导出 Markdown
                            </button>
                            <button
                              onClick={() => {
                                void saveCopy();
                                setMenuOpen(false);
                              }}
                            >
                              <Plus size={14} />
                              保存副本
                            </button>
                            <button
                              className="danger"
                              onClick={() => {
                                setDeleteOpen(true);
                                setMenuOpen(false);
                              }}
                            >
                              <Trash2 size={14} />
                              移入回收站
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="editor-tabs">
                  <div className="file-tab">
                    <FileText size={14} />
                    <span>{doc.path.split('/').pop()}</span>
                    {saveState === 'dirty' && <span className="unsaved-dot" />}
                  </div>
                  <div className="mode-switch">
                    {(
                      [
                        { key: 'edit', icon: Code2, label: '编辑' },
                        { key: 'split', icon: Columns2, label: '双栏' },
                        { key: 'read', icon: Eye, label: '阅读' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.key}
                        className={view === m.key ? 'selected' : ''}
                        onClick={() => {
                          setView(m.key);
                          local.set('view', m.key);
                        }}
                      >
                        <m.icon size={13} />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    className={`icon-button outline-toggle ${outlineOpen ? 'selected' : ''}`}
                    title="文档大纲"
                    onClick={() => setOutlineOpen((v) => !v)}
                  >
                    <List size={16} />
                  </button>
                </div>
                <div
                  className={`editing-area view-${view}`}
                  ref={panes}
                  style={{ '--split': `${split}%` } as React.CSSProperties}
                >
                  {view !== 'read' && (
                    <section className="source-pane">
                      <div className="pane-toolbar">
                        <span>MARKDOWN</span>
                        <div>
                          {[
                            {
                              icon: Bold,
                              label: '粗体',
                              before: '**',
                              after: '**',
                              sample: '文字',
                            },
                            {
                              icon: Italic,
                              label: '斜体',
                              before: '*',
                              after: '*',
                              sample: '文字',
                            },
                            {
                              icon: Link2,
                              label: '插入 Wiki 链接',
                              before: '[[',
                              after: ']]',
                              sample: 'index',
                            },
                            {
                              icon: Quote,
                              label: '引用',
                              before: '\n> ',
                              after: '\n',
                              sample: '引用文字',
                            },
                            {
                              icon: Braces,
                              label: '代码块',
                              before: '\n```\n',
                              after: '\n```\n',
                              sample: 'code',
                            },
                          ].map((b) => (
                            <button
                              className="icon-button"
                              title={b.label}
                              key={b.label}
                              onClick={() => insert(b.before, b.after, b.sample)}
                            >
                              <b.icon size={13} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <CodeMirror
                        key={doc.path}
                        value={doc.content}
                        height="100%"
                        extensions={editorExtensions}
                        onChange={change}
                        readOnly={loading}
                        onCreateEditor={(v) => {
                          editor.current = v;
                        }}
                        basicSetup={{
                          foldGutter: false,
                          highlightActiveLine: true,
                          highlightSelectionMatches: true,
                          autocompletion: false,
                        }}
                      />
                    </section>
                  )}
                  {view === 'split' && (
                    <div
                      className="pane-divider"
                      role="separator"
                      aria-label="调整编辑器宽度"
                      aria-valuemin={30}
                      aria-valuemax={70}
                      aria-valuenow={split}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft') setSplit((v) => Math.max(30, v - 2));
                        if (e.key === 'ArrowRight') setSplit((v) => Math.min(70, v + 2));
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerMove={(e) => {
                        if (e.currentTarget.hasPointerCapture(e.pointerId) && panes.current) {
                          const rect = panes.current.getBoundingClientRect();
                          setSplit(
                            Math.max(
                              30,
                              Math.min(70, ((e.clientX - rect.left) / rect.width) * 100),
                            ),
                          );
                        }
                      }}
                    >
                      <span />
                    </div>
                  )}
                  {view !== 'edit' && (
                    <section className="preview-pane">
                      <div className="pane-toolbar">
                        <span>
                          <Eye size={13} /> 预览
                        </span>
                        <span className="live-label">
                          <i />
                          实时渲染
                        </span>
                      </div>
                      <div className="preview-scroll" ref={preview}>
                        <article className="markdown document-markdown">
                          <Markdown
                            content={doc.content}
                            path={doc.path}
                            files={files}
                            onNavigate={(target) => void navigate(target)}
                          />
                          <div className="backlinks">
                            <div className="backlinks-heading">
                              <Link2 size={14} />
                              <span>反向链接</span>
                              <small>{backlinks.length}</small>
                            </div>
                            {backlinks.length ? (
                              backlinks.map((f) => (
                                <button key={f.path} onClick={() => void openFile(f.path)}>
                                  <FileText size={13} />
                                  <span>{f.title}</span>
                                  <ArrowUpRight size={13} />
                                </button>
                              ))
                            ) : (
                              <p>还没有其他页面链接到这里。</p>
                            )}
                          </div>
                        </article>
                      </div>
                    </section>
                  )}
                  {outlineOpen && (
                    <div className="outline-popover">
                      <h3>文档大纲</h3>
                      {headings.length ? (
                        headings.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (view === 'edit') setView('split');
                              setTimeout(() => {
                                const target = Array.from(
                                  preview.current?.querySelectorAll('h2') || [],
                                ).find((e) => e.textContent === h);
                                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 30);
                            }}
                          >
                            {h}
                          </button>
                        ))
                      ) : (
                        <p>使用 ## 添加章节标题</p>
                      )}
                    </div>
                  )}
                </div>
                <footer className="statusbar">
                  <span>
                    <FileText size={11} />
                    Markdown
                  </span>
                  <span>UTF-8</span>
                  <span>{doc.content.split('\n').length} 行</span>
                  <span className="statusbar-right">
                    写下来，才会发生。 <span className="tiny-sprout">✳</span>
                  </span>
                </footer>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-illustration">✳</div>
                <h2>{loading ? '正在打开你的工作台…' : '把第一个想法，写在这里。'}</h2>
                <p>{loading ? '读取本地 Wiki 文件' : '一页 Markdown，就是一切的开始。'}</p>
                {!loading && (
                  <button className="button primary" onClick={() => setNewPath('')}>
                    <Plus size={15} />
                    新建文档
                  </button>
                )}
              </div>
            )}
          </main>
          <AgentPanel
            open={agentOpen}
            onClose={() => setAgentOpen(false)}
            current={doc?.path || ''}
            files={files}
            draft={agentDraft}
            beforeSend={save}
            onRefresh={() => void refresh()}
            onNavigate={(target) => void navigate(target)}
          />
        </div>
        {terminalMounted && (
          <Suspense
            fallback={terminalOpen ? <div className="terminal-loading">正在载入终端…</div> : null}
          >
            <TerminalPanel open={terminalOpen} onClose={() => setTerminalOpen(false)} />
          </Suspense>
        )}
      </div>
      <input
        ref={importInput}
        type="file"
        multiple
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        hidden
        onChange={(e) => void importFiles(e.target.files)}
      />
      {searchOpen && (
        <SearchDialog
          files={files}
          onOpen={(p) => void openFile(p)}
          onClose={() => setSearchOpen(false)}
        />
      )}
      {newPath !== null && (
        <NewDialog initial={newPath} onCreate={create} onClose={() => setNewPath(null)} />
      )}
      {trash && (
        <TrashDialog
          entries={trash}
          onClose={() => setTrash(null)}
          onRestore={async (id) => {
            await api('/restore', { method: 'POST', body: JSON.stringify({ id }) });
            await refresh();
            await showTrash();
            setToast('文档已恢复');
          }}
        />
      )}
      {deleteOpen && (
        <Dialog title="把这页笔记移入回收站？" onClose={() => setDeleteOpen(false)}>
          <div className="new-form">
            <p>「{displayTitle}」会移入本地回收站，之后可以恢复。</p>
            <div className="form-actions">
              <button className="button" onClick={() => setDeleteOpen(false)}>
                保留文档
              </button>
              <button className="button danger-button" onClick={() => void remove()}>
                <Trash2 size={14} />
                移入回收站
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={15} />
          {toast}
          <button className="icon-button" title="关闭提示" onClick={() => setToast('')}>
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
