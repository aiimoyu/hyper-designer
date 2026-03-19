## 当前阶段：需求分析与场景分析（轻量）

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="requirementAnalysis"/>
    <pre_stage>null</pre_stage>
  </pipeline>
  <executing_agent>HArchitect</executing_agent>
  <core_objective>
    Consolidate requirement analysis and scenario analysis within single-module scope,
    producing a streamlined output ready for downstream consumption.
  </core_objective>
</workflow_context>
```

**阶段标识**: `requirementAnalysis`  
**执行Agent**: HArchitect  
**核心目标**: 在单模块范围内完成需求分析和场景分析，形成下游可直接使用的精简输入。

### 1. 执行规范与 Skill 使用

**核心 Skills**: `lite-designer`

**⚠️ 强制前置步骤**：

在开始执行前，**必须先读取** `lite-designer` skill 的以下 reference 文件：

```
references/phase1-requirements-analysis.md
```

该文件包含：

- 完整的输出模板结构（§0 概要 → 5W2H → §3 业务功能与场景 → §6 验收方法 → §4 约束 → §7 边界）
- 各章节详细写作指南
- 功能清单优先级定义（P0/P1/P2）
- 主成功场景撰写规范
- 验收标准量化要求
- 质量自检清单

**严禁跳过此步骤，严禁使用简化模板或自行简化输出结构。**

---

### 2. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **需求分析说明书.md** | `.hyper-designer/requirementAnalysis/需求分析说明书.md` | Markdown，**严格遵循 phase1-requirements-analysis.md 中的完整模板** |

---

### 3. 质量要求

基于 `phase1-requirements-analysis.md` 中的质量自检清单：

1. **功能清单中每条都有优先级**（P0/P1/P2）
2. **主成功场景是具体操作流**，不是抽象描述
3. **验收标准有量化指标和测试方法**
4. **技术约束包含性能数值**
5. **Out of Scope 列出了关键排除项**
6. **所有内容基于用户提供的信息，无无据假设**

---

### 4. 质量审查

**审查方式**：使用 `HD_TOOL_DELEGATE(subagent=HCritic)` 调用 HCritic 进行质量评审。

#### 审查提示词

```markdown
# 文档审核任务

## 📁 审核目标
请对以下文档进行全面的质量审核：
**文件路径**: `.hyper-designer/requirementAnalysis/需求分析说明书.md`

---

## 🔍 审核维度

**参考规范**：
1. 请读取 `lite-designer` skill 文件
2. 请读取 `references/phase1-requirements-analysis.md`，理解该文档的撰写规范与模板要求

在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **模板结构完整性** | 是否包含 §0 概要、5W2H、§3 业务功能与场景、§6 验收方法、§4 约束、§7 边界？ | 🔴 Critical |
| **功能清单优先级** | 每条功能是否标注了 P0/P1/P2 优先级？ | 🔴 Critical |
| **主成功场景具体性** | 主成功场景是否是具体的操作流程？是否使用了具名角色？ | 🔴 Critical |
| **验收标准量化** | 验收标准是否包含量化指标？是否有测试方法？ | 🟡 Major |
| **边界定义清晰** | In Scope 和 Out of Scope 是否明确列出？ | 🟡 Major |

## 📋 输出要求
- 严格遵循审核报告格式输出
- 在输出报告前调用 `hd_record_milestone` 工具记录质量门里程碑
- 专项维度中发现的问题须在最终报告的 Recommendations 中**明确标注所违反的专项维度名称**
```
