import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import matter from 'gray-matter';
import { extractLinks, stripFrontmatter } from '../src/lib/wiki.ts';
import type { WikiFile } from '../src/lib/types.ts';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export class WikiStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    public root: string,
    public state: string,
  ) {
    this.root = path.resolve(root);
    this.state = path.resolve(state);
  }
  async init() {
    await fs.mkdir(this.root, { recursive: true });
    await fs.mkdir(this.state, { recursive: true });
  }
  validate(relative: unknown, extensions = ['md', 'markdown']): string {
    if (
      typeof relative !== 'string' ||
      relative.length > 500 ||
      !extensions.includes(relative.split('.').pop()!.toLowerCase()) ||
      relative.includes('\\') ||
      relative.includes('\0') ||
      path.isAbsolute(relative) ||
      relative.split('/').some((p) => !p || p === '.' || p === '..' || p.startsWith('.'))
    )
      throw new HttpError(400, '仅支持 wiki 内的 Markdown 文件路径');
    return relative;
  }
  async safe(relative: unknown, extensions?: string[]) {
    const valid = this.validate(relative, extensions);
    let current = this.root;
    for (const part of ['', ...valid.split('/')]) {
      current = path.join(current, part);
      try {
        const stat = await fs.lstat(current);
        if (stat.isSymbolicLink()) throw new HttpError(403, '不允许通过符号链接访问文件');
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }
    }
    return path.join(this.root, valid);
  }
  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation);
    this.queue = next.catch(() => undefined);
    return next;
  }
  async read(relative: string) {
    const filename = await this.safe(relative);
    try {
      const stat = await fs.stat(filename);
      if (!stat.isFile()) throw new HttpError(400, '目标不是文件');
      if (stat.size > 2 * 1024 * 1024) throw new HttpError(413, '文件超过 2 MB，请拆分后再编辑');
      const content = await fs.readFile(filename, 'utf8');
      return { path: relative, content, version: hash(content) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') throw new HttpError(404, '文档不存在');
      throw err;
    }
  }
  async list(): Promise<WikiFile[]> {
    const result: WikiFile[] = [];
    const walk = async (directory: string) => {
      for (const entry of await fs.readdir(path.join(this.root, directory), {
        withFileTypes: true,
      })) {
        if (entry.name.startsWith('.') || entry.isSymbolicLink() || entry.name === 'AGENTS.md')
          continue;
        const relative = path.posix.join(directory, entry.name);
        if (entry.isDirectory()) {
          await walk(relative);
          continue;
        }
        if (!entry.isFile() || !/\.(md|markdown)$/i.test(entry.name)) continue;
        try {
          const document = await this.read(relative);
          const stat = await fs.stat(await this.safe(relative));
          let data: Record<string, unknown> = {};
          try {
            data = matter(document.content).data;
          } catch {
            /* malformed YAML remains editable */
          }
          const body = stripFrontmatter(document.content);
          const title =
            typeof data.title === 'string'
              ? data.title
              : (body.match(/^#\s+(.+)$/m)?.[1] ?? entry.name.replace(/\.(md|markdown)$/i, ''));
          const tags = Array.isArray(data.tags)
            ? data.tags.filter((t): t is string => typeof t === 'string')
            : [];
          result.push({
            ...document,
            title,
            tags,
            excerpt: body
              .replace(/[#*>`\[\]_]/g, '')
              .replace(/\s+/g, ' ')
              .slice(0, 160),
            updatedAt: stat.mtime.toISOString(),
            links: extractLinks(document.content),
          });
        } catch (err) {
          if (!(err instanceof HttpError && [404, 413].includes(err.status))) throw err;
        }
      }
    };
    await walk('');
    return result.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));
  }
  async write(relative: string, content: string, expected: string | null) {
    if (typeof content !== 'string' || Buffer.byteLength(content) > 2 * 1024 * 1024)
      throw new HttpError(413, '内容必须是 2 MB 以内的文本');
    return this.serial(async () => {
      const filename = await this.safe(relative);
      let current;
      try {
        current = await this.read(relative);
      } catch (err) {
        if (!(err instanceof HttpError && err.status === 404)) throw err;
      }
      if (current ? expected !== current.version : expected !== null)
        throw new HttpError(409, '文件已在外部更新或删除。草稿已保留，请重新加载或另存为。');
      await fs.mkdir(path.dirname(filename), { recursive: true });
      await this.safe(relative);
      const temporary = `${filename}.${randomUUID()}.tmp`;
      try {
        await fs.writeFile(temporary, content, { flag: 'wx' });
        await fs.rename(temporary, filename);
      } finally {
        await fs.rm(temporary, { force: true });
      }
      return { path: relative, content, version: hash(content) };
    });
  }
  async trash(relative: string, version: string) {
    return this.serial(async () => {
      if (relative === 'AGENTS.md') throw new HttpError(403, '请在代码编辑器中修改 Wiki 规则');
      const document = await this.read(relative);
      if (document.version !== version) throw new HttpError(409, '文件已更新，请重新加载后删除');
      const id = randomUUID();
      const directory = path.join(this.state, 'trash');
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(
        path.join(directory, `${id}.json`),
        JSON.stringify({ ...document, id, deletedAt: new Date().toISOString() }),
      );
      await fs.unlink(await this.safe(relative));
      return { id, path: relative };
    });
  }
  async restore(id: string) {
    if (!/^[a-f\d-]{36}$/.test(id)) throw new HttpError(400, '无效的恢复记录');
    const filename = path.join(this.state, 'trash', `${id}.json`);
    const document = JSON.parse(await fs.readFile(filename, 'utf8'));
    const restored = await this.write(document.path, document.content, null);
    await fs.unlink(filename);
    return restored;
  }
  async trashList() {
    const directory = path.join(this.state, 'trash');
    await fs.mkdir(directory, { recursive: true });
    const entries = await fs.readdir(directory);
    return Promise.all(
      entries
        .filter((f) => f.endsWith('.json'))
        .map(async (f) => {
          const {
            id,
            path: filePath,
            deletedAt,
          } = JSON.parse(await fs.readFile(path.join(directory, f), 'utf8'));
          return { id, path: filePath, deletedAt };
        }),
    );
  }
}
