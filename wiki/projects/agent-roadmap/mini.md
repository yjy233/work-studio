---
title: 第一站 · mini-SWE-agent
tags: [Agent, 开源]
---
# 第一站 · mini-SWE-agent

这一站只追四个问题：任务从哪里进来，模型返回什么，命令在哪里执行，程序凭什么结束。

## 推荐阅读顺序

1. [hello_world.py](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/run/hello_world.py)：看模型、环境、配置如何注入 Agent。
2. [DefaultAgent](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py)：看 `run → step → query → execute_actions`。
3. [LocalEnvironment](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/environments/local.py)：看执行返回值和完成标记。
4. [LitellmModel](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/models/litellm_model.py)：看 API 格式怎样转成统一行动。
5. [官方测试](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/tests/agents/test_default.py)：把成功、超限与格式错误各走一遍。

细读在独立项目 [[projects/mini-swe-source/index|mini-SWE-agent 源码解读]]，这里负责把它放进整体学习路线。

## 本次版本的关键观察

v2 的 Agent 从消息的 `extra.actions` 读取行动；解析文本代码块或工具调用的工作由 Model 层完成。不要照着旧文章去找 Agent 自己的 `parse_action()`。默认 LiteLLM 模型使用 `bash` 工具声明，文本式适配器也仍存在。

LocalEnvironment 的当前 `_run` 使用 `subprocess.Popen` 配合 `communicate`，超时时清理进程组。README 对设计的简述仍提 `subprocess.run`；理解重点是**每个行动独立执行**，不应把介绍中的简写当成当前函数实现。

## 动手实验

先用确定性模型运行两步：第一步输出一个字符串，第二步提交完成标记。检查磁盘轨迹是否包括 system、user、assistant、observation、exit。这个实验不需要付费模型。

再把第一步改成失败命令，观察它是否自动结束；把 `step_limit` 改成 1，观察第二次模型调用是否被阻止。完整步骤见 [[projects/mini-swe-source/lab|离线实验]]。

## 进入下一站的标准

能解释“文件改动会保留，但上一条命令里的 cd 不会成为下一条命令的当前目录”，并能在轨迹中指出证据。不要以“读完文件”代替“能复述运行行为”。

返回 [[projects/agent-roadmap/index|项目目录]]。
