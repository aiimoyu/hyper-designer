# 阶段 1: 系统分析

```xml
<workflow_context>
  <pipeline>
    <pre_stage>null</pre_stage>
    <curr_stage id="systemAnalysis"/>
    <next_stage id="componentAnalysis"/>
  </pipeline>
</workflow_context>
```


## 重要说明

本阶段（system-analysis）是 **project-analysis** skill 的一部分。project-analysis 是一个项目分析工作流，包含2个阶段：

1. 系统分析（当前阶段）
2. 组件分析（禁止执行）

在使用本阶段提示词时，请确保理解整个 skill 的上下文和目标。

## 任务

分析目标项目并生成3个核心文档。

## 执行步骤

- [Proc1.1] 确认目标项目路径
- [Proc1.2] 读取 `project-analysis` skill 中的 `references/phase1-overview.md` 获取完整方法论`
- [Proc2] 按照 `references/phase1-system-analysis.md` 中的 S1-S8 阶段执行，禁止跳步。
- [Proc3.1] 确认用户意图（继续分析组件还是结束流程）
- [Proc3.2] 使用 `hd_handover` 工具将工作明确交接给 `component-analysis` 阶段或结束工作流。
- [Proc3.3] Stop

## 输出

1. `overview.md` — 项目概览
2. `architecture.md` — 系统架构
3. `modules.md` — 模块分析
4. `SKILL.md` — 技能文档（包含方法论和输出说明）

## 工作交接

**单一任务**：不具备执行 `component-analysis` 阶段的能力。由于你不是专业的组件分析师，使用`hd_handover`工具能够将工作明确交接给更专业的组件分析agent，避免你在组件分析阶段的无效尝试和可能的错误输出。
**工作交接**：NEVER 直接进入组件分析阶段，使用 `hd_handover` 工具进行明确交接，并停止任何工作。
**结束工作**：如果用户决定不进入下一阶段直接结束，必须使用 `hd_handover` 并传入参数 `end=true` 以结束工作流，否则会导致用户下次进入工作流时，之前的工作状态和上下文没有被正确清理，可能会引发混乱和错误。
