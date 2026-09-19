---
title: mini 源码 04 · 预算、异常与轨迹
tags: [源码, 调试]
---
# mini 源码 04 · 预算、异常与轨迹

## 四种停止，不是一回事

| 路径 | 触发点 | 应检查什么 |
| --- | --- | --- |
| Submitted | 环境识别完成标记 | submission 是否可信、输出是否达标 |
| LimitsExceeded | 下一次 query 前检查步数与累计费用 | 为什么结束、是否留下部分成果 |
| TimeExceeded | 下一次 query 前检查累计时间 | 是否只是检查点超时，而非请求强制取消 |
| 未捕获异常 | run 的普通异常分支 | traceback、exit_status；异常还会继续抛出 |

`FormatError` 是可恢复路径：把纠错消息加入上下文，让模型下一轮调整。连续次数达到 `max_consecutive_format_errors` 后追加 RepeatedFormatError exit；干净的一步会清零连续计数。配置 0 表示不启用这个次数限制。

## 预算边界要准确

`step_limit` 在发起下一次模型请求前与 `n_calls` 比较。费用限制同样在请求前根据**已经花掉的费用**判断，因此最后一次请求可能让累计费用超过阈值；它不是严格的预付费上限。

`wall_time_limit_seconds` 也在 query 前检查。如果单个网络请求或执行步骤阻塞很久，循环里的这次检查不会自动中断它；要分别看 API 层与 Environment 层的超时机制。

## finally 中保存意味着什么

`run` 在每轮的 `finally` 中调用 `save`。`serialize` 包含消息、配置、统计、版本以及 exit_status / submission 等。即使出现异常，也尽量保存可诊断的轨迹。

但 `save` 自己若遭遇磁盘错误仍然可能失败；源码保存使用普通文件写入，不能因此推断它具有数据库事务或崩溃一致性保证。

## 看轨迹的五步

1. 核对配置与模型，确认读的是同一次运行。
2. 找最后的 exit_status，区分正常提交、超限和异常。
3. 向前找到最后一个动作与真实 returncode。
4. 找到模型当时实际看到的 observation。
5. 再判断问题位于模型选择、协议解析、执行环境还是目标测试。

依据：[限制、异常和 serialize/save](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py)、[官方控制流测试](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/tests/agents/test_default.py)。

返回 [[projects/mini-swe-source/index|项目目录]]。
