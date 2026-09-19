---
title: TS 03 · 泛型与类型变换
tags: [TypeScript, 泛型]
---
# TS 03 · 泛型与类型变换

## 泛型保存“输入与输出的关系”

普通 `unknown` 能表示任意值，却不能表达“返回的就是输入那种类型”。泛型用一个变量连接两者。

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}
function getField<T, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}
const page = { title: 'Wiki', words: 100 };
const title = getField(page, 'title'); // string
const words = getField(page, 'words'); // number
```

这里 T 代表对象类型，keyof T 是可用键的联合，K 只能从中选，T[K] 是选定字段的类型。泛型参数应有实际关系，只有一个参数出现一次的泛型经常没有必要。

## 常用类型变换

| 工具 | 作用 | 示例 |
| --- | --- | --- |
| Pick<T, K> | 选一部分字段 | 列表只需要标题和路径 |
| Omit<T, K> | 排除字段 | 创建参数排除服务器生成的版本 |
| Partial<T> | 第一层字段可选 | 补丁对象，不是运行时合并器 |
| Readonly<T> | 第一层只读 | 防止通过当前引用改字段 |
| Record<K, V> | 从键到值的类型映射 | 状态名到中文文案 |
| ReturnType<F> | 提取函数返回类型 | 复用返回结构 |

```ts
type Doc = { path: string; content: string; version: string };
type Draft = Omit<Doc, 'version'>;
type Patch = Partial<Pick<Doc, 'content'>>;
```

## as const 与 satisfies

`as const` 保留字面量并将字面量数组/对象属性视为只读；它不会深度冻结运行时值。`satisfies` 检查表达式是否符合目标类型，同时避免直接把变量整体强制标成目标类型而丢掉一些具体信息；上下文类型仍可能影响推断。

```ts
const modes = ['read', 'edit'] as const;
type Mode = typeof modes[number];
const labels = { read: '阅读', edit: '编辑' } satisfies Record<Mode, string>;
```

练习：为 `groupBy<T>(items, getKey)` 标注类型，返回 Map<string, T[]>。先追求清晰，暂不需要递归条件类型。

依据：[泛型](https://www.typescriptlang.org/docs/handbook/2/generics.html)、[keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)、[工具类型](https://www.typescriptlang.org/docs/handbook/utility-types.html)、[satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)。

返回 [[projects/typescript/index|项目目录]]。
