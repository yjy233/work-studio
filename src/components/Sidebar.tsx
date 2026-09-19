import { useState } from 'react';
import {
  Search,
  BookOpen,
  LibraryBig,
  CalendarDays,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  ChevronsUpDown,
  Trash2,
  PanelLeftClose,
} from 'lucide-react';
import type { WikiFile } from '../lib/types';
interface Props {
  files: WikiFile[];
  selected: string;
  section: string;
  onOpen: (path: string) => void;
  onSection: (section: string) => void;
  onSearch: () => void;
  onNew: () => void;
  onTrash: () => void;
  onClose: () => void;
}
export function Sidebar(p: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(
    new Set([
      'raw',
      'sources',
      'projects/agent-roadmap',
      'projects/mini-swe-source',
      'projects/typescript',
      'projects/algorithms',
    ]),
  );
  const [treeQuery, setTreeQuery] = useState('');
  function tree(prefix = '', depth = 0) {
    const children = new Map<string, WikiFile | null>();
    for (const file of p.files.filter(
      (f) =>
        f.path.startsWith(prefix) &&
        (!treeQuery || `${f.title} ${f.path}`.toLowerCase().includes(treeQuery.toLowerCase())),
    )) {
      const rest = file.path.slice(prefix.length);
      const slash = rest.indexOf('/');
      if (slash < 0) children.set(rest, file);
      else children.set(rest.slice(0, slash), null);
    }
    return [...children]
      .sort(([a, fa], [b, fb]) => Number(!!fa) - Number(!!fb) || a.localeCompare(b))
      .map(([name, file]) => {
        const key = prefix + name;
        if (file)
          return (
            <button
              key={key}
              className={`tree-file ${p.selected === key && p.section === 'wiki' ? 'selected' : ''}`}
              style={{ paddingLeft: 19 + depth * 15 }}
              onClick={() => p.onOpen(key)}
              title={key}
            >
              <FileText size={15} />
              <span>{file.title}</span>
              {file.path.startsWith('raw/') && <span className="file-dot" />}
            </button>
          );
        const expanded = treeQuery || !collapsed.has(key);
        return (
          <div key={key}>
            <button
              className="tree-folder"
              style={{ paddingLeft: 16 + depth * 15 }}
              onClick={() =>
                setCollapsed((old) => {
                  const next = new Set(old);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <Folder size={15} />
              <span>{name}</span>
            </button>
            {expanded && tree(key + '/', depth + 1)}
          </div>
        );
      });
  }
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          w<span>·</span>
        </div>
        <strong>Work Studio</strong>
        <button className="icon-button sidebar-close" title="收起侧栏" onClick={p.onClose}>
          <PanelLeftClose size={16} />
        </button>
      </div>
      <p className="brand-caption">你的个人知识工作台</p>
      <button className="search-trigger" onClick={p.onSearch}>
        <Search size={15} />
        <span>搜索你的知识</span>
        <kbd>⌘ K</kbd>
      </button>
      <nav className="primary-nav">
        <button
          className={p.section === 'research' ? 'active' : ''}
          onClick={() => p.onSection('research')}
        >
          <LibraryBig size={17} />
          <span>学习项目</span>
          <small>4</small>
        </button>
        <button
          className={p.section === 'wiki' ? 'active' : ''}
          onClick={() => p.onSection('wiki')}
        >
          <BookOpen size={17} />
          <span>知识库</span>
          <small>{p.files.length}</small>
        </button>
        <button
          className={p.section === 'journal' ? 'active' : ''}
          onClick={() => p.onSection('journal')}
        >
          <CalendarDays size={17} />
          <span>每日笔记</span>
        </button>
        <button className={p.section === 'llm' ? 'active' : ''} onClick={() => p.onSection('llm')}>
          <Sparkles size={17} />
          <span>LLM Wiki</span>
          <small className="beta">BETA</small>
        </button>
      </nav>
      <div className="workspace-label">
        <span>工作空间</span>
        <button className="icon-button" title="新建文档" onClick={p.onNew}>
          <Plus size={16} />
        </button>
      </div>
      <div className="tree-root">
        <Folder size={15} />
        <strong>wiki</strong>
        <span>{p.files.length} 个文档</span>
      </div>
      <input
        className="tree-filter"
        aria-label="筛选文件"
        placeholder="筛选文件…"
        value={treeQuery}
        onChange={(e) => setTreeQuery(e.target.value)}
      />
      <div className="file-tree">
        {tree()}
        {!p.files.length && <p className="empty-small">还没有文档，写下第一个想法吧。</p>}
      </div>
      <div className="sidebar-note">
        <span className="sprout">✳</span>
        <p>让每一个想法，有迹可循。</p>
        <small>本地文件 · 持续积累</small>
      </div>
      <div className="workspace-footer">
        <span className="online-dot" />
        <span>本地工作空间</span>
        <button className="icon-button" title="回收站" onClick={p.onTrash}>
          <Trash2 size={14} />
        </button>
        <ChevronsUpDown size={12} />
      </div>
    </aside>
  );
}
