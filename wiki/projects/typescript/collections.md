---
title: TS 05 · 集合与算法常见坑
tags: [TypeScript, 算法]
---
# TS 05 · 集合与算法常见坑

## 数字排序必须有比较器

```ts
const sorted = [...values].sort((a, b) => a - b);
```

默认 sort 按字符串顺序排列，`[2, 10, 1]` 会变成 `[1, 10, 2]`。sort 会修改原数组，先复制能让算法函数更容易复用和测试。复制是 O(n) 额外空间，不应在复杂度里隐藏。

## Map、Set 与遍历

```ts
const counts = new Map<string, number>();
for (const ch of 'abaca') {
  counts.set(ch, (counts.get(ch) ?? 0) + 1);
}
const unique = new Set([1, 1, 2]);
```

Map.get 可能返回 undefined。`??` 只处理 null/undefined，`||` 还会替换 0、空字符串和 false。`for...of` 取值，`for...in` 取可枚举键，数组算法通常需要前者或普通下标循环。

## 二维数组不要共享同一个内层数组

```ts
const bad = Array(3).fill([]); // 三行指向同一个数组
const good = Array.from({ length: 3 }, () => [] as number[]);
```

改 bad[0] 会影响其它行，这是引用共享，不是 TypeScript 编译器问题。类似地，对象 key 在 Map 中按引用身份匹配，两个外观相同的对象不一定是同一个键。

## 刷题前的边界清单

- number 是双精度浮点数；安全整数范围有限，超出 Number.MAX_SAFE_INTEGER 要考虑 bigint。number 和 bigint 不能直接混合算术。
- 位运算通常会把 number 转成 32 位整数；不要随意用 `|0` 当通用取整。
- 对大型数组避免 `Math.max(...nums)`，参数展开可能超过引擎调用限制；循环或 reduce 更稳妥。
- 反复 shift 实现队列可能搬移元素；使用数组加 head 下标。
- JS 字符串下标按 UTF-16 码元。英文题可按题意用下标；含 emoji 时先明确你要处理码元、码点还是字素。
- 递归深度可能受调用栈限制。大规模 DFS 可以改为显式栈。

练习：找出 [[projects/algorithms/intervals|区间算法]] 为什么复制数组，[[projects/algorithms/partition|划分字母区间]] 为什么对输入字符集作约定。

参考：[MDN Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)、[MDN Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)、[MDN 安全整数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)。

返回 [[projects/typescript/index|项目目录]]。
