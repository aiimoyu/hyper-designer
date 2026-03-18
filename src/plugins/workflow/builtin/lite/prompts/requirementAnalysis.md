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

**核心 Skills**: `ir-analysis`, `scenario-analysis`

请结合 5W2H 与场景分类方法，完成最小充分分析。聚焦单模块边界，避免跨模块扩散。

**核心参考资料**: 根据上下文搜集已收集的领域分析资料、外部参考资料等的结构化摘要和引用链接。

### 2. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **需求分析说明书.md** | `.hyper-designer/requirementAnalysis/需求分析说明书.md` | Markdown，严格遵循下述模板与长度限制 |

#### 输出模板

```markdown
# 需求分析说明书

## 1. 需求摘要
- 需求价值：[1-2 句话]
- 需求描述：[1-2 句话]
- 验收标准：[1-2 句话]

## 2. 5W2H
- What：[1-2 句话]
- Why：[1-2 句话]
- Who：[1-2 句话]
- When：[1-2 句话]
- Where：[1-2 句话]
- How：[1-2 句话]
- How Much：[1-2 句话]

## 3. 关键场景（最多 3 个）
### 场景 A
- 场景类型：业务/操作/维护/制造/其他
- 场景描述：[1-2 句话]
- 场景影响：[1-2 句话]
- 场景价值：[1-2 句话]

### 场景 B
...

### 场景 C
...

## 4. 下阶段输入摘要
- 单模块边界：[1 句话]
- 优先功能方向：[最多 3 条，每条 1 句话]
```

### 3. 质量要求

1. **场景数量限制**：不得输出超过 3 个关键场景。
2. **技术细节隔离**：不得把技术实现细节写入场景描述。
3. **信息缺失处理**：若信息缺失，提出最多 3 个微确认问题后再收敛输出。

### 4. 质量审查

**审查方式**：使用 `HD_TOOL_DELEGATE(subagent=HCritic)` 调用 HCritic 进行质量评审。

#### 审查提示词

```
# 文档审核任务
## 📁 审核目标
请对以下文档进行全面的质量审核：
**文件路径**: `.hyper-designer/requirementAnalysis/需求分析说明书.md`
---
## 🔍 审核维度
**参考规范**：请读取 `ir-analysis` 和 `scenario-analysis` skill 文件，理解该文档的撰写规范与模板要求。
在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **5W2H 完整性** | 所有七个维度是否都有明确描述？是否存在"TBD"条目或空白字段？ | 🔴 Critical |
| **场景数量合规** | 关键场景是否不超过 3 个？每个场景是否标注了场景类型？ | 🔴 Critical |
| **单模块边界清晰性** | 是否明确界定了单模块范围？是否避免了跨模块扩散？ | 🟡 Major |
| **规范性** | 文档结构是否符合模板要求？长度限制是否遵守？ | 🟡 Major |

## 📋 输出要求
- 严格遵循审核报告格式输出
- 在输出报告前调用 `hd_record_milestone` 工具记录质量门里程碑
- 专项维度中发现的问题须在最终报告的 Recommendations 中**明确标注所违反的专项维度名称**
```