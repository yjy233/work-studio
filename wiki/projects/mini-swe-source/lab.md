---
title: mini 源码 05 · 离线实验
tags: [源码, 实验]
---
# mini 源码 05 · 离线实验

这个实验使用官方确定性测试模型，**不发送 LLM 请求**。它能验证循环与执行协议，不能衡量模型解决实际问题的能力。

## 获取固定版本

在工作台终端中执行以下命令。`work/` 用于临时源码，不进入 Wiki；只在不存在同名目录时 clone。

```sh
mkdir -p work/checkouts
git clone https://github.com/SWE-agent/mini-swe-agent.git work/checkouts/mini-swe-agent
cd work/checkouts/mini-swe-agent
git checkout 04d809ceab9df28f9adaed044884180159172930
python3 -m venv .venv
.venv/bin/python -m pip install -e .
```

本次仓库要求 Python 3.10 或更高版本。这里只提供复现实验步骤，本次没有替你安装整套研究项目及其模型服务。

## 新建 experiment.py

```python
from pathlib import Path
from minisweagent.agents.default import DefaultAgent
from minisweagent.environments.local import LocalEnvironment
from minisweagent.models.test_models import DeterministicModel, make_output

model = DeterministicModel(outputs=[
    make_output("observe", [{"command": "printf 'hello\n'"}], cost=0.0),
    make_output("finish", [{"command": "printf 'COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT\ndone\n'"}], cost=0.0),
])
agent = DefaultAgent(
    model, LocalEnvironment(),
    system_template="You are a test agent.",
    instance_template="{{ task }}",
    step_limit=4, cost_limit=0,
    output_path=Path("trajectory.json"),
)
result = agent.run("Observe once, then finish")
assert result["exit_status"] == "Submitted"
assert agent.n_calls == 2
print(result)
```

运行 `.venv/bin/python experiment.py`，预期输出的状态为 Submitted，submission 为 `done` 加换行。代码只输出字符串并写 trajectory.json。

## 三个有答案的变体

| 改动 | 预期现象 | 原因 |
| --- | --- | --- |
| step_limit 改为 1 | LimitsExceeded，只有一次模型调用 | 第二次 query 前触发检查 |
| 第一个 command 改为 false | 观察包含非零返回码，仍可走第二步 | 命令失败不等于整个 Agent 自动退出 |
| 提交标记前加一行 prefix | 不会按提交标记结束，固定输出耗尽后可能异常 | 完成标记必须出现在有效输出首行 |

可以再给测试模型增加正常步骤来观察“不提交时直到步数耗尽”的路径，避免把模型输出列表耗尽误判成 Agent 设计的结束条件。

依据：[DeterministicModel 和 make_output](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/models/test_models.py)、[官方实验式测试](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/tests/agents/test_default.py)。

返回 [[projects/mini-swe-source/index|项目目录]]。
