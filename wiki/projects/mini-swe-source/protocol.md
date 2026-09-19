---
title: mini 源码 02 · Model 与消息协议
tags: [源码, 协议]
---
# mini 源码 02 · Model 与消息协议

## 为什么需要适配层

模型提供商可能返回聊天式 tool_calls、Responses 格式或普通文本。Agent 只需要知道“要执行哪些行动”，不应该在循环中堆叠所有供应商分支。

当前 LiteLLM 实现先准备 API 消息，去掉仅供本地使用的 `extra`，调用模型，计算费用，解析行动，最后在回复中补上统一元数据。

```text
API reply
  → parse_toolcall_actions
  → extra.actions = [{command, tool_call_id}]
  → Environment.execute(action)
  → format_toolcall_observation_messages
  → 带 tool_call_id 的 tool 消息
```

这里 `tool_call_id` 连接行动请求与执行结果。如果 ID 丢失、重复或不对应，下一次模型请求可能被提供商拒绝，也可能产生难以追踪的错误归属。

## 逐函数阅读

- `_prepare_messages_for_api`：去掉 `extra`，处理供应商相关消息顺序与缓存标记。
- `_query`：向 LiteLLM 提供 `BASH_TOOL` 声明。工具的名字并不能证明底层一定运行 bash 二进制。
- `_parse_actions`：调用 `parse_toolcall_actions`。无调用、未知工具、JSON 参数无法解析、缺少 command 都是格式错误路径。
- `format_observation_messages`：把 output、returncode、exception_info 包装成下一轮可用的信息。

不要把协议校验当成完整执行授权。当前解析器检查的字段有限，例如“存在 command”并不等于所有可能的参数值都满足业务规则。真实应用仍需要自己的执行边界。

## 格式错误也会收费

API 已经返回内容，随后解析失败时，费用不会凭空消失。当前实现把 cost 和原始 response 放进 FormatError 携带消息的 extra 中；Agent 的专门异常分支负责累计费用。观察这条路径可以理解为什么只在成功回复里累加费用会漏算。

## 文本模式与 v2 的区别

`models/utils/actions_text.py` 处理文本行动；默认 LiteLLM 模型使用 tool-call 路径。它们共享 Agent 的动作结构。看到旧教程写“只解析一个 bash 代码块”，先确认正在读哪一种 Model 配置。

依据：[LiteLLM 适配器](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/models/litellm_model.py)、[工具行动与观察格式化](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/models/utils/actions_toolcall.py)、[文本行动适配器](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/models/utils/actions_text.py)。

返回 [[projects/mini-swe-source/index|项目目录]]。
