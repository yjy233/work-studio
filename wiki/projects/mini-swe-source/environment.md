---
title: mini 源码 03 · 执行环境与任务完成
tags: [源码, Shell]
---
# mini 源码 03 · 执行环境与任务完成

## 环境把行动变成事实

`LocalEnvironment.execute(action, cwd, timeout)` 取 command，确定 cwd，合并进程环境变量，然后交给 `_run`。正常结果包含 output、returncode 和 exception_info。错误路径会保留能够取得的部分输出，returncode 设为 -1，并记录异常类型。

## 每个行动独立启动

下面两条是两次独立行动，不是一个连续终端会话：

```sh
cd /tmp
pwd
```

第二次行动的 cwd 仍来自 execute 参数、环境配置或宿主进程 cwd。文件改动会持久化，因为它发生在文件系统；shell 内部的工作目录和临时变量则不会自然传给下一次 shell。

工作台的隐藏终端恰好相反：它是持续存在的 PTY，会保留 `cd`、环境变量和前台进程。对照两者有助于理解为什么“工具能执行 shell”还不足以说明其状态语义。

## 超时不是只杀一层

当前 `_run` 使用 `Popen`，合并 stderr 到 stdout，再 `communicate(timeout)`。在 POSIX 上创建新的 session；超时后调用 `killpg` 杀进程组，再收集剩余输出。这处理的是环境中的命令超时，与整个 Agent 的预算检查是两个机制。

源码使用 `shell=True`，未指定 bash 的 `executable`；POSIX 通常采用 `/bin/sh`。写实验时用可移植语法，或在命令里明确调用 bash。不要仅因工具叫 bash 就依赖 bash 专有语法。

## 完成标记的三个条件

`_check_finished` 检查去掉前导空白后的输出：第一行必须是完整标记 `COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT`，且返回码是 0；后续行成为 submission。

```sh
printf 'COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT
已完成
'
```

自然语言里包含这串字符、它出现在非首行、或命令返回非零，都不能按同样条件提交。该标记是程序协议，**不证明任务质量**；外部评估仍要检查实际文件与测试。

依据：[LocalEnvironment 与 _run](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/environments/local.py)、[Submitted 异常](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/exceptions.py)。

返回 [[projects/mini-swe-source/index|项目目录]]。
