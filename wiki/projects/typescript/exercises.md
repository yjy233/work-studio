---
title: TS 06 · 小练习与自测
tags: [TypeScript, 练习]
---
# TS 06 · 小练习与自测

## 项目内已准备的示例

打开终端，在 work-studio 根目录运行：

```sh
npm run practice:typescript
npx tsc --noEmit
```

第一条执行 `examples/typescript.ts` 内的运行时断言；第二条检查类型。两者解决不同问题。示例包含 unknown 输入校验、Result 联合、泛型字段读取、groupBy、数字排序和 Promise.all。

## 六道练习

| 题目 | 输入 / 输出 | 自测要点 |
| --- | --- | --- |
| 1 · parseTitle | unknown → Result<string> | null、数字、缺字段、空标题 |
| 2 · uniqueTags | readonly string[] → string[] | 去重且保留首次出现顺序 |
| 3 · groupBy | T[] + key 函数 → Map<string,T[]> | 空输入、同组多项 |
| 4 · patchDoc | Doc + Patch → Doc | 原对象不变，version 不被随意修改 |
| 5 · describeEvent | 判别联合 → string | 增加分支时编译器能提醒 |
| 6 · loadAll | 多个异步任务 → 结果列表 | 顺序、失败和取消的行为可解释 |

## 提示与答案路线

1. 不要先 `as`，用 typeof、null 检查和 in 缩小范围；考虑空标题是类型合法但业务可能不合法。
2. `[...new Set(tags)]` 可以保留插入顺序，但标签大小写归一化属于另一项需求。
3. 先找到 key，再取已有组，不存在则新建数组，push 后写回；已实现版本可对照 examples/typescript.ts。
4. 使用对象展开，明确允许覆盖哪些字段；嵌套值需另行复制。
5. 用 kind 作判别字段，default 分支赋给 never。
6. 想保留所有错误用 allSettled；想尽早抛错用 all，同时说明其他任务可能仍在执行。

## 建议验收

合上答案重新实现 1、3、5。然后向 Codex 解释自己写的类型关系，请它只给反例与问题。算法练习继续 [[projects/algorithms/index|贪心专题]]。

返回 [[projects/typescript/index|项目目录]]。
