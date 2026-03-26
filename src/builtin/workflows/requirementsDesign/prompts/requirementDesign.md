# 2. 需求设计阶段提示词（优化版）

```markdown
## 当前阶段：需求设计（requirementDesign）

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="requirementDesign"/>
    <pre_stage>requirementAnalysis</pre_stage>
  </pipeline>
  <executing_agent>HDArchitect</executing_agent>
  <core_objective>
    Based on requirement scenario analysis, produce a single-module implementable
    function list and a concise functional design summary.
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
3. 读取参考文件：`requirements-design/references/s2-requirements-design.md`。

### 生成约束
你只能依据上述参考文件中的**指南与模板**生成《需求设计说明书》：
- 不得跳过文档读取；
- 不得使用默认模板、自行改写结构或省略必要字段；
- 不得生成超出**单模块范围**的功能需求。

### 阶段交付物
- **文件名**: `需求设计说明书.md`
- **输出路径**: `.hyper-designer/requirementDesign/需求设计说明书.md`
- **格式要求**: Markdown，且必须完整符合 Skill 模板结构。

### 质量审查
文档写入后，必须调用：

`HD_TOOL_DELEGATE(subagent=HCritic, skill=requirements-design)`

并发送以下委托提示词：

```markdown
# 阶段评审任务：需求设计说明书审核

## 审核目标
请作为资深架构评审员，对以下文档进行严格审核：
`.hyper-designer/requirementDesign/需求设计说明书.md`

## 审核流程

- [Proc1] 载入 Skill 获取评审标准
   **强制使用 `requirements-design` Skill 进行审核。**
- [Proc2] 阅读评审标准
   必须读取 Skill 参考文件：
   1. `[requirements-design]/references/reviewer.md`
   2. `[requirements-design]/references/requirements-design-checklist.md`
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