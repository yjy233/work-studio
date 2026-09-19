import assert from 'node:assert/strict';
type Note = { title: string; tags: string[]; archived?: boolean };
type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export function readTitle(input: unknown): Result<string> {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('title' in input) ||
    typeof input.title !== 'string'
  )
    return { ok: false, error: 'title must be a string' };
  return { ok: true, value: input.title };
}
export function getField<T, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}
export function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k) ?? [];
    group.push(item);
    groups.set(k, group);
  }
  return groups;
}
const note = { title: 'Agent', tags: ['learn'], archived: false } satisfies Note;
assert.equal(getField(note, 'title'), 'Agent');
assert.deepEqual(readTitle(null), { ok: false, error: 'title must be a string' });
const result = readTitle(note);
if (result.ok) assert.equal(result.value, 'Agent');
const groups = groupBy(
  [
    { topic: 'agent', id: 1 },
    { topic: 'ts', id: 2 },
    { topic: 'agent', id: 3 },
  ],
  (item) => item.topic,
);
assert.deepEqual(
  groups.get('agent')?.map((item) => item.id),
  [1, 3],
);
assert.deepEqual(
  [10, 2, 1].sort((a, b) => a - b),
  [1, 2, 10],
);
const answers = await Promise.all([Promise.resolve('read'), Promise.resolve('write')]);
assert.deepEqual(answers, ['read', 'write']);
console.log('TypeScript 练习通过：运行时校验、联合类型、泛型、Map、排序与 Promise。');
