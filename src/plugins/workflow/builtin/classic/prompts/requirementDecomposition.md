## 当前阶段：需求分解

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="requirementDecomposition"/>
    <pre_stage>functionalRefinement</pre_stage>
  </pipeline>
  <executing_agent>HEngineer</executing_agent>
  <core_objective>
    Apply Domain-Driven Design (DDD) to refine system-level requirements (SR)
    into module-level requirements and executable implementation requirements (AR),
    defining subsystem interfaces and dependencies.
  </core_objective>
</workflow_context>
```

**阶段标识**: `requirementDecomposition`  
**执行Agent**: HEngineer  
**核心目标**: 应用领域驱动设计（DDD）将系统级需求（SR）细化为模块级需求与可执行实现要求（AR），定义子系统接口与依赖关系。

### 1. 输入与资料收集

**在开始执行前，必须通过读取资料清单和自主搜集完成资料收集。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **系统需求分析资料**<br>(前阶段输出-IR) | 需求信息（需求信息.md） | 必需 | 理解需求背景、约束与业务目标 |
| **系统需求分析资料**<br>(前阶段输出-功能列表) | 功能列表（{功能名}功能列表.md） | 必需 | 分解的权威输入，建立SR-AR映射 |
| **系统设计资料**<br>(现有架构) | 现有系统架构文档 | 如有则必需 | 重构/迁移项目的部署拓扑与模块清单 |
| **领域资料**<br>(技术约束) | 部署环境、性能要求 | 必需 | 确定技术边界与设计约束 |
| **代码库资料**<br>(参考模式) | 参考项目架构模式 | 可选 | 架构参考、最佳实践 |
**资料收集流程**（详见"单阶段处理流程 Step 2"）：

1. **读取资料清单**：读取项目根目录 `REFERENCE.md` 中相关 Section，解析用户填写的资料信息。
2. **确认完整性**：检查必需资料是否已填写，向用户汇报状态并确认是否需要补充。
3. **搜集与解析**：根据资料清单信息读取本地文件和URL，使用 `explore`/`librarian` 自主搜集补充资料。

**核心参考资料**: 根据上下文搜集已收集的前置阶段交付物、系统需求分析资料、领域资料、代码库资料等的结构化摘要和引用链接。

### 2. 执行规范与 Skill 使用

**核心 Skills**:

- `sr-ar-decomposition` - SR→AR 分解方法论与模板
- `ir-sr-ar-traceability` - 建立并验证 IR→SR→AR 的追溯链

### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **sr-ar-decomposition.md** | `.hyper-designer/requirementDecomposition/sr-ar-decomposition.md` | Markdown，包含 SR 列表、对应 AR、模块接口定义、依赖矩阵与优先级 |
| **traceability-report.md** | `.hyper-designer/requirementDecomposition/traceability-report.md` | Markdown，IR→SR→AR 追溯链验证报告 |

#### 审查提示词

```
# 文档审核任务
## 📁 审核目标
请对以下文档进行全面的质量审核：
**文件路径**: `.hyper-designer/requirementDecomposition/sr-ar-decomposition.md` 和 `.hyper-designer/requirementDecomposition/traceability-report.md`
---
## 🔍 审核维度
**参考规范**：请读取 `sr-ar-decomposition` 和 `ir-sr-ar-traceability` skill 文件，理解该文档的撰写规范与模板要求。
在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **SR-AR 分解合理性** | 每个 SR 是否被完整且恰当地映射为一个或多个 AR，且无明显遗漏？ | 🔴 Critical |
| **模块边界清晰性** | 模块职责、接口与依赖是否明确，是否遵循低耦合高内聚原则？ | 🟡 Major |
| **追溯链完整性** | 从 IR → SR → AR 的追溯链是否完整、可验证，并记录了来源与决策理由？ | 🟡 Major |
| **规范性** | 文档结构是否符合 `sr-ar-decomposition` skill 定义的模板？ | 🟡 Major |

## 📋 输出要求
- 严格遵循审核报告格式输出
#HJ|- 在输出报告前调用 `hd_record_milestone` 工具记录质量门里程碑
- 专项维度中发现的问题须在最终报告的 Recommendations 中**明确标注所违反的专项维度名称**
```
