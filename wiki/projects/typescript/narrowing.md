---
title: TS 02 · 联合类型与类型收窄
tags: [TypeScript, 类型收窄]
---
# TS 02 · 联合类型与类型收窄

## 用类型表达真实状态

如果成功时有 value、失败时有 error，可以用判别联合避免“成功却没有数据”的组合。

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function readTitle(input: unknown): Result<string> {
  if (typeof input !== 'object' || input === null ||
      !('title' in input) || typeof input.title !== 'string') {
    return { ok: false, error: 'title must be a string' };
  }
  return { ok: true, value: input.title };
}
```

这里每一步都在做真实运行时检查。`typeof null` 是 object，因此必须单独排除 null；`in` 只说明字段存在，不保证内容类型，所以还要检查 title。

## 为什么 if (value) 有时不合适

假设 value 是 `number | undefined`，`if (value)` 同时排除了 0。0 若是合法值，应写 `value !== undefined`。同理空字符串可能是有意义的数据，不能随意当成“缺失”。

## 穷尽性检查

```ts
type State = { kind: 'idle' } | { kind: 'running'; taskId: string };
function label(state: State): string {
  switch (state.kind) {
    case 'idle': return '空闲';
    case 'running': return state.taskId;
    default: { const unreachable: never = state; return unreachable; }
  }
}
```

将来加入 failed 分支而忘记处理时，never 检查会提示缺漏。它要求判别字段保持字面量类型。

## 类型断言的边界

`value as Note`、`value!` 都是告诉编译器“相信我”，不会检查内容。自定义 `x is Note` 函数也可能写错。对外部输入，要真正验证必须的字段及其嵌套结构。

练习：在 Result 加一个 `cancelled` 状态，改写调用者，确保不依赖 try/catch 猜测返回对象形状。Agent 的流式事件也很适合这种建模，参见 [[projects/agent-roadmap/pi|Pi 事件流]]。

依据：[类型收窄与判别联合](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)。

返回 [[projects/typescript/index|项目目录]]。
