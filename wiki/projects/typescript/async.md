---
title: TS 04 · 模块、Promise 与取消
tags: [TypeScript, 异步]
---
# TS 04 · 模块、Promise 与取消

## 模块先看真实导入

`import type { WikiFile } from './types'` 只用于类型，编译后可被移除；`import { readFile } from 'node:fs/promises'` 是运行时代码。Node 后端模块不能直接放进浏览器组件。

## async 总是返回 Promise

```ts
async function loadLength(text: string): Promise<number> {
  return text.length;
}
const length = await loadLength('wiki');
```

函数内 throw 会让返回的 Promise 拒绝。调用者需要 await 或显式处理 rejection。写了 async 并不意味着内部同步计算自动移到其他线程。

## 并行、顺序与错误

| 写法 | 行为 | 常见误解 |
| --- | --- | --- |
| for...of + await | 逐项完成 | 不是并行 |
| Promise.all | 等待全部成功，某项拒绝时整体拒绝 | 不会自动取消其它任务 |
| Promise.allSettled | 收集成功与失败 | 仍需要检查每一项 |
| items.forEach(async ...) | 启动回调但外层不等待全部 | await forEach 也无济于事 |

如果必须限制并发数量，需要任务队列或分批处理；不要对几万个请求直接 Promise.all。

## 取消是协作机制

```ts
async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}
const controller = new AbortController();
// 把 controller.signal 传给任务；用户取消时 controller.abort()
```

AbortController 只发信号，需要底层操作配合。取消浏览器请求也不自动证明服务端已经取消写文件，因此仍要依靠版本、幂等或任务状态来处理竞态。`fetch` 的 HTTP 404 通常不会自动成为网络异常，要看 response.ok。

## 练习

读工作台 `src/lib/api.ts`，指出它何时抛出 ApiError；再读终端重连代码，查出旧连接的消息为什么不能继续更新新会话。该练习关注生命周期，不要求先学复杂框架。

依据：[模块](https://www.typescriptlang.org/docs/handbook/2/modules.html)、[函数与 Promise 类型](https://www.typescriptlang.org/docs/handbook/2/functions.html)。运行时行为参考 [MDN Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)、[MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)。

返回 [[projects/typescript/index|项目目录]]。
