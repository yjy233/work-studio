---
title: TS 01 · 基础类型、对象与函数
tags: [TypeScript, 基础]
---
# TS 01 · 基础类型、对象与函数

## 类型与值是两层

`const count: number = 3` 中 number 参与编译期检查，运行时只剩值 3。`as SomeType` 也不会把 JSON 转换成安全对象。相比之下 class、普通函数和对象是真实运行时值。

```ts
type Note = {
  title: string;
  tags: string[];
  archived?: boolean;
};

const note: Note = { title: 'Agent', tags: ['learn'] };
function rename(note: Note, title: string): Note {
  return { ...note, title };
}
```

`archived?` 表示字段可以缺省。读取时必须考虑 undefined。`{ ...note }` 只浅拷贝第一层，tags 仍引用原数组；需要独立 tags 时再复制它。

## 先掌握这些写法

| 写法 | 含义 | 适用场景 |
| --- | --- | --- |
| string / number / boolean | 基本类型 | 标题、计数、状态 |
| T[] / Array<T> | 同类元素数组 | 文档列表 |
| readonly [number, number] | 只读二元元组 | 算法区间 |
| (x: number) => number | 函数类型 | 排序或转换策略 |
| unknown | 尚未验证的任意输入 | JSON、错误对象 |
| never | 不应出现的分支或无正常返回 | 穷尽分支检查 |

`void` 表达调用者不使用返回值，不等于任何函数都不能返回数据；`never` 则不能正常得到返回值。避免一开始用 any 绕过所有报错，它会把很多错误推迟到运行时。

## type 与 interface

对象形状通常两者都能描述。type 还常用于联合、元组、类型运算；interface 支持声明合并。练习阶段按照团队风格使用，不必把二者背成优劣排名。

`readonly` 是类型层面的限制，不会自动冻结对象。`Object.freeze` 是运行时行为，也默认只处理第一层。

## 练习

给函数 `summarize(note)` 标注输入输出类型：它返回标题和标签数量，但不修改原 note。再尝试把 tags 误写成字符串，观察编译错误。最后从 JSON.parse 读取对象，解释为什么“编译通过”还不够。

依据：[常用类型](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)、[对象类型](https://www.typescriptlang.org/docs/handbook/2/objects.html)、[函数类型](https://www.typescriptlang.org/docs/handbook/2/functions.html)。

返回 [[projects/typescript/index|项目目录]]。
