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

---

### 2. 执行规范与 Skill 使用

**核心 Skills**: `lite-designer`

**⚠️ 强制前置步骤**：

在开始执行前，**必须先读取** `lite-designer` skill 的以下 reference 文件：

```
references/phase3-sdd-plan.md
```

该文件包含：

- 完整的输出模板结构（§0 概要 → §1 执行前准备 → §2 开发任务列表 → §3 依赖关系 → §4 测试计划 → §5 风险 → §6 执行说明）
- 任务编号格式（T-{里程碑编号}{序号:02d}）
- 每个任务的完整卡片格式（对应AR、功能点清单、实现要点、验收条件）
- 任务依赖与执行顺序图示
- 测试计划要求（单元测试、集成测试、回归测试）
- 给开发 Agent 的执行说明

**严禁跳过此步骤，严禁使用简化模板或自行简化输出结构。**

---

### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **开发计划.md** | `.hyper-designer/developmentPlan/开发计划.md` | Markdown，**严格遵循 phase3-sdd-plan.md 中的完整模板** |

---

### 4. 质量要求

基于 `phase3-sdd-plan.md` 中的质量自检清单：

1. **每个 AR 都对应至少一个开发任务**
2. **每个任务的功能点清单直接来自 AR 功能点**
3. **每个任务有可客观判断的验收条件**（不依赖主观判断）
4. **任务依赖关系已完整标注**
5. **修改围栏已在执行说明中体现**
6. **测试计划覆盖主成功场景和关键异常场景**

---

### 5. 质量审查

**审查方式**：使用 `HD_TOOL_DELEGATE(subagent=HCritic)` 调用 HCritic 进行质量评审。

#### 审查提示词

```markdown
# 文档审核任务

## 📁 审核目标
请对以下文档进行全面的质量审核：
**文件路径**: `.hyper-designer/developmentPlan/开发计划.md`

---

## 🔍 审核维度

**参考规范**：
1. 请读取 `lite-designer` skill 文件
2. 请读取 `references/phase3-sdd-plan.md`，理解该文档的撰写规范与模板要求

在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **模板结构完整性** | 是否包含 §0 概要、§1 执行前准备、§2 开发任务列表、§3 依赖关系、§4 测试计划、§5 风险、§6 执行说明？ | 🔴 Critical |
| **AR 任务覆盖** | 每个 AR 是否都有对应的开发任务？ | 🔴 Critical |
| **验收条件客观性** | 每个任务的验收条件是否可客观判断？是否避免了模糊词汇？ | 🔴 Critical |
| **功能点清单追溯** | 任务的功能点是否来自 AR 功能点？是否有遗漏或越界？ | 🟡 Major |
| **依赖关系完整性** | 任务依赖关系是否已标注？是否有循环依赖？ | 🟡 Major |

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
