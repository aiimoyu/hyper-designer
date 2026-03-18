## 当前阶段：功能列表与模块设计（轻量）

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="ModuleDesign"/>
    <pre_stage>requirementAnalysis</pre_stage>
  </pipeline>
  <executing_agent>HEngineer</executing_agent>
  <core_objective>
    Based on requirement scenario analysis, produce a single-module implementable
    function list and module functional design summary within strict length limits.
  </core_objective>
</workflow_context>
```

**阶段标识**: `ModuleDesign`  
**执行Agent**: HEngineer  
**核心目标**: 基于需求场景分析，产出单模块可实现的功能列表和模块功能设计摘要。

### 1. 输入与资料收集

**在开始执行前，必须读取前阶段产出的需求分析文档。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **系统需求分析资料**<br>(前阶段输出) | 需求分析说明书.md | 必需 | 功能提取与模块边界定义 |

**核心参考资料**: 根据上下文搜集已收集的前置阶段交付物的结构化摘要和引用链接。

### 2. 执行规范与 Skill 使用

**核心 Skills**: `functional-refinement`, `functional-design`

聚焦单模块，避免跨模块扩散。按照精简模板输出，严格长度限制。

### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **需求设计说明书.md** | `.hyper-designer/ModuleDesign/需求设计说明书.md` | Markdown，严格遵循下述模板与长度限制 |

#### 输出模板

```markdown
# 需求设计说明书

## 1. 功能列表（最多 8 个）
| 编号 | 功能名 | 类型(新增/修改) | 描述 | 优先级 |
|---|---|---|---|---|
| F-001 | ... | ... | [1-2 句话] | Must/Should/Could |

## 2. SR 映射（最多 8 条）
| SR 编号 | SR 描述 | 关联功能 |
|---|---|---|
| SR-001 | [1-2 句话] | F-001 |

## 3. 模块设计摘要
- 模块职责：[1-2 句话]
- 模块边界：[1-2 句话]
- 核心接口（最多 3 个）：
  - 接口1：[输入/输出各 1 句话]
  - 接口2：...
  - 接口3：...

## 4. DFX/NFR 约束（最多 5 条）
- [每条 1 句话，带可验证指标]

## 5. 测试策略摘要
- 单元测试策略：[1-2 句话]
- 集成测试策略：[1-2 句话]
```

### 4. 质量要求

1. **功能数量限制**：功能条目超过 8 个时，必须合并同类项或降级到 classic 流程。
2. **接口可测性**：接口描述必须可测，不得使用"尽量""较好"等模糊词。
3. **SR 覆盖完整性**：所有 SR 至少映射一个功能。

### 5. 质量审查

**审查方式**：使用 `HD_TOOL_DELEGATE(subagent=HCritic)` 调用 HCritic 进行质量评审。

#### 审查提示词

```
# 文档审核任务
## 📁 审核目标
请对以下文档进行全面的质量审核：
**文件路径**: `.hyper-designer/ModuleDesign/需求设计说明书.md`
---
## 🔍 审核维度
**参考规范**：请读取 `functional-refinement` 和 `functional-design` skill 文件，理解该文档的撰写规范与模板要求。
在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **功能数量合规** | 功能条目是否不超过 8 个？是否标注了类型（新增/修改）和优先级？ | 🔴 Critical |
| **SR 映射完整性** | 每个 SR 是否映射到至少一个功能？是否存在 SR 覆盖盲区？ | 🔴 Critical |
| **接口定义清晰性** | 接口描述是否可测？是否避免了模糊词汇？ | 🟡 Major |
| **DFX 可验证性** | DFX/NFR 约束是否包含可验证指标？ | 🟡 Major |
| **规范性** | 文档结构是否符合模板要求？长度限制是否遵守？ | 🟡 Major |

## 📋 输出要求
- 严格遵循审核报告格式输出
- 在输出报告前调用 `hd_record_milestone` 工具记录质量门里程碑
- 专项维度中发现的问题须在最终报告的 Recommendations 中**明确标注所违反的专项维度名称**
```