---
title: TypeScript 语法学习
tags: [TypeScript, 路线]
---
# TypeScript 语法学习

目标：能读懂 Pi 和工作台代码，用 TypeScript 写可靠的小工具与算法。先区分 JavaScript 的运行时行为与 TypeScript 的静态检查，再学习类型组合。

## 章节与顺序

| 顺序 | 主题 | 练习产物 |
| --- | --- | --- |
| 1 | [[projects/typescript/basics|基础类型、对象与函数]] | 描述一篇 Wiki 文档 |
| 2 | [[projects/typescript/narrowing|联合类型与收窄]] | 验证外部输入并返回 Result |
| 3 | [[projects/typescript/generics|泛型与类型变换]] | 写不丢失类型的字段读取器 |
| 4 | [[projects/typescript/async|模块、Promise 与取消]] | 可解释失败行为的异步流程 |
| 5 | [[projects/typescript/collections|数组、Map、Set 与算法坑]] | 正确排序、计数、遍历 |
| 6 | [[projects/typescript/exercises|练习与自测]] | 运行项目内示例并改写 |

## 里程碑

- [ ] 能说清类型检查与运行时校验的区别
- [ ] 能用判别联合表达成功和失败
- [ ] 能写 T / keyof / 索引访问类型
- [ ] 能解释 Promise.all 与 for-await 的差别
- [ ] 能避开排序、引用共享与整数精度的坑
- [ ] 跑通示例并独立完成 groupBy

终端运行 `npm run practice:typescript`。类型检查运行 `npx tsc --noEmit`；执行器 tsx 不代替类型检查。示例在 `examples/typescript.ts`，按本项目锁定的 TypeScript 版本验证。

官方学习入口：[Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)、[Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)。进阶应用见 [[projects/agent-roadmap/pi|Pi]]、[[projects/algorithms/index|算法项目]]。
