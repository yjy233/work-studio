import type { WikiFile } from './types';
export function stripFrontmatter(text: string) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
}
export function extractLinks(content: string): string[] {
  const body = stripFrontmatter(content).replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`/g, '');
  return [
    ...new Set(
      [
        ...Array.from(body.matchAll(/\[\[([^\]\n]+)\]\]/g), (m) => m[1].split('|')[0].trim()),
        ...Array.from(body.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g), (m) => m[1]),
      ].filter((x) => x && !/^(?:[a-z]+:|#|\/\/)/i.test(x)),
    ),
  ];
}
function normalized(path: string) {
  const result: string[] = [];
  for (const part of path.split('/')) {
    if (part === '..') result.pop();
    else if (part !== '.' && part) result.push(part);
  }
  return result.join('/');
}
export function resolveLink(
  target: string,
  current: string,
  files: Pick<WikiFile, 'path' | 'title'>[],
) {
  let clean: string;
  try {
    clean = decodeURIComponent(target.split('#')[0]);
  } catch {
    return undefined;
  }
  if (!clean) return files.find((f) => f.path === current)?.path;
  clean = clean.replace(/^wiki\//, '');
  const withExt = /\.md(?:own|arkdown)?$/i.test(clean) ? clean : `${clean}.md`;
  const relative = normalized(`${current.split('/').slice(0, -1).join('/')}/${withExt}`);
  const exact =
    files.find((f) => f.path === relative) ??
    files.find((f) => f.path === withExt.replace(/^\//, ''));
  if (exact) return exact.path;
  const matches = files.filter((f) => f.path.split('/').pop() === withExt || f.title === clean);
  return matches.length === 1 ? matches[0].path : undefined;
}
export function getLint(files: WikiFile[]) {
  const incoming = new Set<string>();
  const broken: { path: string; target: string }[] = [];
  for (const file of files)
    for (const target of file.links) {
      const resolved = resolveLink(target, file.path, files);
      if (resolved) incoming.add(resolved);
      else broken.push({ path: file.path, target });
    }
  return {
    total: files.length,
    broken,
    orphans: files
      .filter(
        (f) =>
          !incoming.has(f.path) &&
          !['index.md', 'log.md', 'AGENTS.md'].includes(f.path) &&
          !f.path.startsWith('raw/'),
      )
      .map((f) => f.path),
  };
}
