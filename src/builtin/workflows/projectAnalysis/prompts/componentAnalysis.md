# 阶段 2: 组件分析

```xml
<workflow_context>
  <pipeline>
    <pre_stage id="systemAnalysis"/>
    <curr_stage id="componentAnalysis"/>
    <next_stage>null</next_stage>
  </pipeline>
</workflow_context>
```

## 重要说明

本阶段是 **project-analysis** skill 的一部分。project-analysis 是一个项目分析工作流，包含2个阶段：

1. 系统分析
2. 组件分析（当前阶段）

在使用本阶段提示时，请确保理解整个 skill 的上下文和目标。

## 任务

深入分析阶段1中识别的每个模块/组件，生成单独的组件详情文件。

## 执行步骤

- [Proc1.1] 确认目标项目路径
- [Proc1.2] 读取 `project-analysis` skill 中的 `references/phase2-component-analysis.md` 获取完整方法论`
- [Proc1.3] 载入 `overview.md`、`architecture.md` 和 `modules.md` 以获取组件列表和相关信息
- [Proc2] 按照 `references/phase2-component-analysis.md` 中的 S1-S8 阶段执行，禁止跳步。
- [Proc3.1] 使用 `hd_handover` 工具结束工作流。
- [Proc3.2] Stop


## 输出

`components/` 目录下的组件分析文件（如 `C001-Core.md`）

## 工作交接

你是该工作流最后一个阶段，完成后请通知用户分析已完成，进入结束流程。

**工作交接**：NEVER 不使用 `hd_handover` 结束工作流而停止任何工作。

如果你完成了工作不使用 `hd_handover` 进行明确结束工作流，会导致用户下次进入工作流时，之前的工作状态和上下文没有被正确清理，可能会引发混乱和错误。
