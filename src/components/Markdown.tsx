import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { visit } from 'unist-util-visit';
import { resolveLink, stripFrontmatter } from '../lib/wiki';
import type { WikiFile } from '../lib/types';
function wikiLinks() {
  return (tree: any) => {
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined || parent.type === 'link' || !node.value.includes('[['))
        return;
      const nodes: any[] = [];
      let last = 0;
      for (const match of node.value.matchAll(/\[\[([^\]\n]+)\]\]/g)) {
        if (match.index > last)
          nodes.push({ type: 'text', value: node.value.slice(last, match.index) });
        const [target, label] = match[1].split('|');
        nodes.push({
          type: 'link',
          url: `/__wiki/${encodeURIComponent(target.trim())}`,
          children: [{ type: 'text', value: label || target }],
        });
        last = match.index + match[0].length;
      }
      if (!nodes.length) return;
      if (last < node.value.length) nodes.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...nodes);
      return index + nodes.length;
    });
  };
}
export function Markdown({
  content,
  path,
  files,
  onNavigate,
}: {
  content: string;
  path: string;
  files: WikiFile[];
  onNavigate: (target: string) => void;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, wikiLinks]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        a({ href, children }) {
          let target = href || '';
          const isWiki = target.startsWith('/__wiki/');
          if (isWiki) {
            try {
              target = decodeURIComponent(target.slice(8));
            } catch {
              /* keep original */
            }
          }
          const internal = isWiki || (target && !/^(?:[a-z]+:|#|\/\/)/i.test(target));
          if (internal) {
            const resolved = resolveLink(target, path, files);
            return (
              <button
                className={`wiki-link ${resolved ? '' : 'missing'}`}
                title={resolved || `未找到：${target}`}
                onClick={() => onNavigate(target)}
              >
                {children}
                {!resolved && <sup>?</sup>}
              </button>
            );
          }
          return (
            <a href={href} target={href?.startsWith('#') ? undefined : '_blank'} rel="noreferrer">
              {children}
            </a>
          );
        },
        img({ src, alt }) {
          if (!src) return null;
          if (/^https?:\/\//i.test(src))
            return <img src={src} alt={alt || ''} loading="lazy" referrerPolicy="no-referrer" />;
          const parts = (
            src.startsWith('/') ? src.slice(1) : `${path.split('/').slice(0, -1).join('/')}/${src}`
          ).split('/');
          const normalized: string[] = [];
          for (const part of parts) {
            if (part === '..') normalized.pop();
            else if (part && part !== '.') normalized.push(part);
          }
          return (
            <img
              src={`/api/asset?path=${encodeURIComponent(normalized.join('/'))}`}
              alt={alt || ''}
              loading="lazy"
            />
          );
        },
        h2({ children }) {
          return <h2 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h2>;
        },
      }}
    >
      {stripFrontmatter(content)}
    </ReactMarkdown>
  );
}
