---
title: mini 源码 01 · 入口与核心循环
tags: [源码, 循环]
---
# mini 源码 01 · 入口与核心循环

## 从入口开始

`hello_world.py` 的职责是装配 `LitellmModel`、`LocalEnvironment` 与 YAML 中的 agent 配置，再调用 `agent.run(task)`。它是阅读入口；运行真实 CLI 时还要看 `run/mini.py` 的模型和环境选择逻辑。

## 一轮到底做了什么

下面是教学伪代码，并非源码逐字复制：

```text
run(task)
  准备 task 等模板变量
  清空 messages，写入 system 与 user
  重复：
    query()：先检查限制，再请求模型并追加回复
    execute_actions(reply)：依次执行 actions
    把执行结果格式化成观察消息并追加
    处理异常，保存轨迹
    若最后一条消息的 role 是 exit，则结束
```

`step()` 把 `query()` 的返回值直接交给 `execute_actions()`。后者读取 `message.extra.actions`，按列表顺序执行，并调用 Model 的 `format_observation_messages`。**当前实现不是多工具并行执行器。**

## 手推一条轨迹

第一步模型选择 `printf 'hello'`，得到返回码 0 和输出 hello；第二步模型选择完成标记。

| 时点 | 消息列表新增 | 主导模块 |
| --- | --- | --- |
| 开始 | system、user | Agent + 模板 |
| 请求返回 | assistant，含 actions | Model → Agent |
| 执行完成 | observation | Environment → Model → Agent |
| 第二次请求 | assistant，含提交命令 | Model → Agent |
| 识别提交 | role=exit，extra 中有 submission | Environment 异常 → Agent |

注意第二次是通过 `Submitted` 改变控制流，不是靠模型回答“我完成了”直接退出。

## 一处容易忽略的状态

`run()` 清空消息，但当前构造器中初始化的 `cost`、`n_calls`、`_start_time` 没有在 `run()` 开头全部重置。因此将同一个 Agent 实例反复用于互不相关的任务，不能擅自假设预算和计时也重新开始。练习时每个案例新建实例。

## 自测

如果 `execute_actions` 中第二个命令触发提交，第三个命令会执行吗？不会，异常会跳出当前求值过程。若模型返回空 actions 呢？单看 Agent 循环不会自动宣告任务结束，具体是否拒绝取决于 Model 层。

依据：[入口源码](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/run/hello_world.py)、[run / step / query / execute_actions](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py)。

返回 [[projects/mini-swe-source/index|项目目录]]。
