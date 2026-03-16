## 当前阶段：SDD 开发计划生成

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="sddPlanGeneration"/>
    <pre_stage>moduleFunctionalDesign</pre_stage>
  </pipeline>
  <executing_agent>HEngineer</executing_agent>
  <core_objective>
    Based on completed Module Functional Design (MFD) documents, generate
    Specification-Driven Development (SDD) plans ready for subagent execution,
    including task wave partitioning, complexity rating, acceptance criteria,
    and TDD test scenarios.
  </core_objective>
</workflow_context>
```

**阶段标识**: `sddPlanGeneration`  
**执行Agent**: HEngineer  
**核心目标**: 基于已完成的模块功能设计说明书（MFD），生成可直接分发给 subagent 执行的规格驱动开发（SDD）计划，包括任务波次划分、复杂度评级、验收标准和 TDD 测试场景。

### 1. 输入与资料收集

**在开始执行前，必须读取前阶段产出的模块设计文档。**

所需的 **资料类别定义** 如下：

| 资料类别 | 关键内容 | 必需性 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **模块功能设计资料**<br>(前阶段输出-MFD) | 各模块功能设计说明书（`{模块名}设计.md`） | 必需 | 任务分解的主要输入：功能列表、接口卡片、AR 分配、DFX 分析 |
| **系统设计资料**<br>(前阶段输出-系统设计) | 系统设计文档（system-design.md） | 必需 | 了解模块间依赖、技术栈与整体架构约束 |
| **系统需求分析资料**<br>(前阶段输出-SR/AR分解) | SR-AR分解文档 | 必需 | 验收标准溯源——每条 AR 需有可验证的实现 |
| **代码库资料**<br>(现有代码) | 项目代码目录结构、关键文件 | 可选 | 判断是 greenfield 还是增量开发，避免重复创建已有文件 |

**资料收集流程**（详见"单阶段处理流程 Step 2"）：

1. **读取模块设计文档**：遍历 `.hyper-designer/moduleFunctionalDesign/` 目录，读取所有 `{模块名}设计.md`。
2. **读取系统设计文档**：读取 `.hyper-designer/systemFunctionalDesign/system-design.md`，获取技术栈与模块边界信息。
3. **确认完整性**：检查必需资料是否齐全，向用户汇报状态。

### 2. 执行规范与 Skill 使用

**核心 Skill**: `sdd-plan-generator`

此 Skill 提供完整的 SDD 计划生成方法论，包括：
- 信息收集访谈清单（确认技术栈、测试策略、并行模式）
- 任务粒度规则（1 任务 = 1 关注点 = 1-4 文件）
- 复杂度评级框架（`[quick]` / `[medium]` / `[deep]` / `[integration]` / `[review]`）
- 依赖波次划分（Wave 1 基础层 → Wave 2 核心实现 → Wave 3 集成层 → Wave FINAL 验收）

**执行要点**：
- **每个模块独立生成一份开发计划文件**，输出到 `dev-plan/{模块名}-dev-plan.md`
- 使用 Skill 中的访谈清单与用户确认关键决策点（测试策略、并行模式）后再生成计划
- 每个任务必须包含完整的 QA 场景（正常路径 + 异常路径），缺少 QA 场景的任务视为不完整
- Wave 1 必须是纯基础层（类型定义、数据模型、脚手架），不含业务逻辑

### 3. 阶段交付物

| 文件名 | 路径 | 格式要求 |
| :--- | :--- | :--- |
| **{模块名}-dev-plan.md** | `dev-plan/{模块名}-dev-plan.md` | Markdown，包含：TL;DR、功能覆盖矩阵、执行波次图、逐任务详情（含 QA 场景与接口卡片） |

**内容要点**：
- TL;DR：目标、交付件清单、工作量估算、关键路径、并行加速比
- 功能覆盖矩阵：每条 MFD 功能 → 对应任务 + SR 编号 + 验收标准
- 执行波次：树形依赖图，标注每个任务的复杂度等级
- 任务详情：要做什么、不要做什么、参考资料、并行信息、验收标准（含 QA 场景）、接口卡片、AR 分配、提交信息

#### 审查提示词

```
# 文档审核任务
## 📁 审核目标
请对以下文档进行全面的质量审核：
**文件路径**: `dev-plan/{模块名}-dev-plan.md`
---
## 🔍 审核维度
**参考规范**：请读取 `sdd-plan-generator` skill 文件，理解开发计划的完整性要求。
在执行标准评审框架（完整性 / 准确性 / 清晰度 / 可行性 / 规范性）的基础上，**重点核查**以下维度：

| 维度 | 检查标准 | 违反等级 |
| --- | --- | --- |
| **MFD 功能覆盖率** | 功能覆盖矩阵是否涵盖 MFD 中所有功能（3.x 章节）？无遗漏？ | 🔴 Critical |
| **QA 场景完整性** | 每个任务是否都有正常路径和异常路径的 QA 场景？缺失的任务是不完整的。 | 🔴 Critical |
| **波次依赖合理性** | Wave 1 是否为纯基础层？波次依赖关系是否无循环？ | 🟡 Major |
| **任务粒度合规** | 是否有任务触碰 5+ 不相关文件而未拆分？ | 🟡 Major |
| **AR 追溯完整性** | 每个任务的 AR 分配表是否与 MFD 中的 SR→AR 映射一致？ | 🟡 Major |

## 📋 输出要求
- 严格遵循审核报告格式输出
#HJ|- 在输出报告前调用 `hd_record_milestone` 工具记录质量门里程碑
- 专项维度中发现的问题须在最终报告的 Recommendations 中**明确标注所违反的专项维度名称**
```
