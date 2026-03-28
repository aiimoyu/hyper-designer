## 当前阶段：开发计划（developmentPlan）

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="developmentPlan"/>
    <pre_stage>requirementDesign</pre_stage>
  </pipeline>
  <executing_agent>HDArchitect</executing_agent>
  <core_objective>
    Convert the single-module design into an executable and verifiable SDD plan,
    including task waves, complexity, acceptance criteria, and TDD scenarios.
  </core_objective>
</workflow_context>
```

### 执行角色

- **执行 Agent**: `HDArchitect`
- **流程 Skill**: `hd-review-pipeline`
- **核心 Skill**: `requirements-designer`

### 执行要求

在开始生成内容前，必须严格按以下顺序执行：

1. 按 `hd-review-pipeline` 获取并执行当前阶段流程；
2. 按流程指引加载 `requirements-designer`；
3. 读取参考文件：`requirements-designer/references/s3-development-plan.md`。

### 生成约束

你只能依据上述参考文件中的**指南与模板**生成《开发计划》：

- 不得跳过文档读取；
- 不得使用默认模板、自行改写结构或省略必要字段；
- 不得生成超出**单模块范围**的开发任务。

### 阶段交付物

- **文件名**: `{模块名}-dev-plan.md`
- **输出路径**: `.hyper-designer/developmentPlan/{模块名}-dev-plan.md`
- **格式要求**: Markdown，且必须完整符合 Skill 模板结构。

### 质量审查

文档写入后，必须调用：

`HD_TOOL_DELEGATE(subagent=HCritic, skill=requirements-designer)`

并发送以下委托提示词：

```markdown
# 阶段评审任务：开发计划审核

## 审核目标
请作为资深架构评审员，对以下目录中的开发计划文档进行严格审核：
`.hyper-designer/developmentPlan/`

## 强制前置准备
在输出评审结果前，必须读取：
1. `requirements-designer/references/reviewer.md`
2. `requirements-designer/references/development-plan-review-checklist.md`

## 输出要求
请基于 Checklist 输出：
1. **评审总分**（0-100）
2. **缺陷与修改建议**（按 Blocker / Critical / Minor 分类）
3. **最终结论**（PASS / FAIL）

## 工具要求
评审完成后，必须调用 `hd_record_milestone` 记录里程碑状态。
**通过**与**条件通过**，均需要点亮里程碑。
```