import { ArrowUpRight, BookOpen, Code2, Route, TerminalSquare, Workflow } from 'lucide-react';
import type { WikiFile } from '../lib/types';
const projects = [
  {
    slug: 'agent-roadmap',
    number: '01',
    title: 'Agent 学习路线',
    en: 'FROM LOOP TO SYSTEM',
    description: '先理解最小循环，再读懂可扩展的 Agent 系统。',
    topics: ['mini-SWE-agent', 'Pi', 'Hermes'],
    icon: Route,
    start: 'concepts',
    goal: '概念 → 源码 → 小实验',
  },
  {
    slug: 'mini-swe-source',
    number: '02',
    title: 'mini-SWE-agent 源码解读',
    en: 'READ THE SOURCE',
    description: '沿一条真实调用链，拆开模型、环境与执行循环。',
    topics: ['v2 源码', '消息协议', '异常与测试'],
    icon: Workflow,
    start: 'loop',
    goal: '从入口追到任务退出',
  },
  {
    slug: 'typescript',
    number: '03',
    title: 'TypeScript 语法',
    en: 'LEARN BY BUILDING',
    description: '用工作台与 Agent 场景，掌握类型和 JavaScript 运行时。',
    topics: ['类型收窄', '泛型', '异步与集合'],
    icon: Code2,
    start: 'basics',
    goal: '读得懂，也写得对',
  },
  {
    slug: 'algorithms',
    number: '04',
    title: '算法题详解',
    en: 'THINK · PROVE · CODE',
    description: '从贪心开始，练习证明、反例与面试表达；延伸到 DeepSeek 源码。',
    topics: ['贪心专题', '逐步推演', 'DeepSeek 备考'],
    icon: BookOpen,
    start: 'greedy',
    goal: '每一个选择，都能说清为什么',
  },
];
export function ResearchHub({
  files,
  onOpen,
  onTerminal,
}: {
  files: WikiFile[];
  onOpen: (path: string) => void;
  onTerminal: () => void;
}) {
  return (
    <div className="research-hub">
      <div className="research-intro">
        <div>
          <p className="eyebrow">A LITTLE EVERY DAY</p>
          <h1>把好奇心，变成自己的能力。</h1>
          <p>四个学习项目。一边读，一边写，一边运行。</p>
        </div>
        <span className="research-symbol" aria-hidden="true">
          ✳
        </span>
      </div>
      <div className="research-projects">
        {projects.map((p) => {
          const prefix = `projects/${p.slug}/`;
          const pages = files.filter((f) => f.path.startsWith(prefix));
          const checks =
            pages
              .find((f) => f.path === prefix + 'index.md')
              ?.content.match(/^- \[[ xX]\] .+$/gm) || [];
          const done = checks.filter((s) => /^- \[[xX]\]/.test(s)).length;
          return (
            <button
              key={p.slug}
              className={`research-card project-${p.slug}`}
              onClick={() => onOpen(prefix + 'index.md')}
            >
              <div className="research-card-top">
                <span>
                  {p.number} / {p.en}
                </span>
                <p.icon size={20} />
              </div>
              <h2>{p.title}</h2>
              <p>{p.description}</p>
              <div className="research-topics">
                {p.topics.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="research-card-footer">
                <span>
                  {pages.length} 篇笔记 · {done}/{checks.length} 个里程碑
                </span>
                <ArrowUpRight size={18} />
              </div>
            </button>
          );
        })}
      </div>
      <div className="research-next">
        <div>
          <span className="eyebrow">TODAY'S FOCUS</span>
          <h2>从一道贪心题开始。</h2>
          <p>先画过程，再找反例，最后运行你的解答。</p>
        </div>
        <div>
          <button
            className="button primary"
            onClick={() => onOpen('projects/algorithms/cookies.md')}
          >
            开始：分发饼干 <ArrowUpRight size={14} />
          </button>
          <button className="button" onClick={onTerminal}>
            <TerminalSquare size={14} />
            打开终端
          </button>
        </div>
      </div>
      <p className="research-footnote">
        所有笔记保存在 wiki/projects/ · 在项目首页勾选里程碑，记录你的进度。
      </p>
    </div>
  );
}
