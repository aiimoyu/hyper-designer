## 当前阶段：SDD 开发计划生成（轻量）

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="developmentPlan"/>
    <pre_stage>ModuleDesign</pre_stage>
  </pipeline>
  <executing_agent>HEngineer</executing_agent>
  <core_objective>
    Convert single-module design into an executable, distributable, and verifiable
    SDD plan with task wave partitioning, complexity rating, acceptance criteria,
    and TDD test scenarios.
  </core_objective>
</workflow_context>
```

**阶段标识**: `developmentPlan`  
**执行Agent**: HEngineer  
**核心目标**: 将单模块设计转换为可执行、可分发、可验证的 SDD 计划。

### 1. 输入与资料收集

**在开始执行前，必须读取前阶段产出的模块设计文档。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **模块设计资料**<br>(前阶段输出) | 需求设计说明书.md | 必需 | 任务分解的主要输入：功能列表、SR映射、接口定义 |

**核心参考资料**: 根据上下文搜集已收集的前置阶段交付物的结构化摘要和引用链接。

### 2. 执行规范与 Skill 使用

**核心 Skill**: `sdd-plan-generator`

保持轻量：只输出当前模块必需任务。按照精简模板输出，严格长度限制。

### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **开发计划.md** | `.hyper-designer/developmentPlan/开发计划.md` | Markdown，严格遵循下述模板与长度限制 |

#### 输出模板

```markdown
# 开发计划

## 1. TL;DR
- 目标：[1 句话]
- 交付件：[最多 5 条，每条 1 句话]
- 并行模式：单 agent / 多 agent

## 2. 覆盖矩阵（最多 10 行）
| 功能 | 任务 | SR | 验收标准 |
|---|---|---|---|
| F-001 | T-01 | SR-001 | [1 句话] |

## 3. 波次计划（最多 4 个波次）
- Wave 1（基础层）：[最多 3 个任务]
- Wave 2（核心实现）：[最多 5 个任务]
- Wave 3（集成层）：[最多 3 个任务]
- Wave FINAL（验收）：[最多 2 个任务]

## 4. 任务卡片（每个任务 3-5 行）
### T-01 {任务名} [quick/medium/deep/integration/review]
- 要做什么：[1-2 句话]
- 不要做什么：[1 句话]
- 验收标准：[1 句话]
- QA 场景：正常路径 1 条 + 异常路径 1 条（每条 1 句话）

## 5. 风险与回滚
- 关键风险：[最多 3 条，每条 1 句话]
- 回滚策略：[1-2 句话]
```

### 4. 质量要求

1. **任务粒度控制**：每个任务限制 1 个关注点，触碰 1-4 个文件。
2. **QA 场景完整性**：不得缺少 QA 场景（正常+异常）。
3. **波次依赖无环**：波次依赖必须无环。

### 5. 质量审查

**审查方式**：使用 `HD_TOOL_DELEGATE(subagent=HCritic)` 调用 HCritic 进行质量评审。

#### 审查提示词

```
# 文档审核任务
## 📁 审核目标
请对以下文档进行全面的质量审核：
**文件路径**: `.hyper-designer/developmentPlan/开发计划.md`
---
## 🔍 审核维度
**参考规范**：请读取 `sdd-plan-generator` skill 文件，理解该文档的撰写规范与模板要求。
在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **QA 场景完整性** | 每个任务是否都有正常路径和异常路径的 QA 场景？ | 🔴 Critical |
| **功能覆盖完整性** | 功能覆盖矩阵是否涵盖所有功能？无遗漏？ | 🔴 Critical |
| **波次依赖合理性** | Wave 1 是否为纯基础层？波次依赖关系是否无循环？ | 🟡 Major |
| **任务粒度合规** | 是否有任务触碰 5+ 不相关文件而未拆分？ | 🟡 Major |
| **规范性** | 文档结构是否符合模板要求？长度限制是否遵守？ | 🟡 Major |

## 📋 输出要求
- 严格遵循审核报告格式输出
- 在输出报告前调用 `hd_record_milestone` 工具记录质量门里程碑
- 专项维度中发现的问题须在最终报告的 Recommendations 中**明确标注所违反的专项维度名称**
```

---

### 6. 阶段完成提示

**本阶段是工作流的最后一个阶段。**

完成所有任务并生成开发计划后，请：

1. **确认所有交付物已完成**：检查 `.hyper-designer/developmentPlan/开发计划.md` 文件是否已生成且内容完整
2. **向用户汇报完成状态**：明确告知用户"工作流已执行完毕，所有阶段已完成"
3. **进入 idle 状态**：工作流将自动进入 idle 状态，等待用户下一步指示

**完成话术示例**：
> 工作流已执行完毕。所有阶段（需求分析与场景分析 → 功能列表与模块设计 → 开发计划生成）已成功完成。开发计划已生成，可供 subagent 执行。感谢使用！