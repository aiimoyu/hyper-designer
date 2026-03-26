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
- **核心 Skill**: `requirements-design`

### 执行要求
在开始生成内容前，必须严格按以下顺序执行：

1. 按 `hd-review-pipeline` 获取并执行当前阶段流程；
2. 按流程指引加载 `requirements-design`；
3. 读取参考文件：`requirements-design/references/s3-development-plan.md`。

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

`HD_TOOL_DELEGATE(subagent=HCritic, skill=requirements-design)`

并发送以下委托提示词：

```markdown
# 阶段评审任务：开发计划审核

## 审核目标
请作为资深架构评审员，对以下目录中的开发计划文档进行严格审核：
`.hyper-designer/developmentPlan/`

## 强制前置准备
在输出评审结果前，必须读取：
1. `requirements-design/references/reviewer.md`
2. `requirements-design/references/development-plan-checklist.md`

## 输出要求
请基于 Checklist 输出：
1. **评审总分**（0-100）
2. **缺陷与修改建议**（按 Blocker / Critical / Minor 分类）
3. **最终结论**（PASS / FAIL）

## 工具要求
评审完成后，必须调用 `hd_record_milestone` 记录质量门状态。
```
```

---

# 4. 进一步统一压缩版（推荐作为最终标准模板）

如果你希望三段提示词**风格更统一、长度更短**，可以采用下面这个标准化骨架，只替换阶段名、参考文件、交付物和 checklist。

---

## 标准阶段模板

```markdown
## 当前阶段：{阶段中文名}（{stageId}）

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="{stageId}"/>
    <pre_stage>{preStage}</pre_stage>
  </pipeline>
  <executing_agent>HDArchitect</executing_agent>
  <core_objective>
    {coreObjective}
  </core_objective>
</workflow_context>
```

### 执行角色
- **执行 Agent**: `HDArchitect`
- **流程 Skill**: `hd-review-pipeline`
- **核心 Skill**: `requirements-design`

### 执行要求
生成前必须按顺序执行：
1. 执行 `hd-review-pipeline`；
2. 按流程加载 `requirements-design`；
3. 读取参考文件：`requirements-design/references/{stageRef}`。

### 生成约束
仅可依据参考文件中的指南与模板生成文档：
- 不得跳过文档读取；
- 不得使用默认模板、自行改写结构或省略必要字段；
- 不得超出**单模块范围**。

### 质量审查
文档写入后，必须调用：
`HD_TOOL_DELEGATE(subagent=HCritic, skill=requirements-design)`

委托提示词如下：

```markdown
# 阶段评审任务：{阶段中文名}审核

## 审核目标
请作为资深架构评审员，对以下文档进行严格审核：
`{reviewTarget}`

## 审核流程

- [Proc1] 载入 Skill 获取评审标准
   **强制使用 `requirements-design` Skill 进行审核。**
- [Proc2] 阅读评审标准
   必须读取 Skill 参考文件：
   1. `[requirements-design]/references/reviewer.md`
   2. `[requirements-design]/references/development-plan-checklist.md`
- [Proc3] 执行评审
   1. 逐项检查文档内容，对照检查表的每一条规则
   2. 点亮里程碑
   3. 输出评审结果

## 输出要求
请基于 Checklist 输出：
1. **评审总分**（0-100）
2. **缺陷与修改建议**（按 Blocker / Critical / Minor 分类）
3. **最终结论**（PASS / FAIL）

## 工具要求
评审完成后，必须调用 `hd_record_milestone` 记录里程碑状态。
```