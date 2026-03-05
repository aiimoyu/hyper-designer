---
name: functional-design
description: System and module functional design for requirements engineering. Use when workflow state is `systemFunctionalDesign` or `moduleFunctionalDesign`, or when system design constraints, specification decomposition, specialized design (reliability/safety/security/privacy), interface specification, DFX analysis, or SR→AR allocation is needed. Supports both system-level (design constraints, spec decomposition, specialized design) and module-level (functional implementation, interface design, AR allocation) design tasks.
---

# Functional Design Skill

基于已分解的系统需求（SR）和分配需求（AR），完成系统级和模块级的功能设计。本技能支持两个层次的渐进式设计：

- **系统功能设计**：系统级设计约束、规格分解、专项设计（可靠性/安全/韧性/隐私）、关键用例行为描述
- **模块功能设计**：功能域总体方案、逐功能实现设计、接口规格设计、DFX 分析、SR→AR 分配

## Usage

**System-level design**: 生成系统设计说明书，包含设计约束、规格分解、专项设计方案。见 [references/system-design.md](references/system-design.md)。

**Module-level design**: 生成模块功能设计说明书，包含功能域方案、逐功能实现设计、接口规格、DFX 分析。见 [references/module-design.md](references/module-design.md)。

## Inputs

所有设计任务需要：

- **功能列表文档**（含 SR 映射和 NFR/DFX 摘要）：位于 `.hyper-designer/functionalList/`
- **SR-AR 分解分配表**：位于 `.hyper-designer/systemRequirementDecomposition/` 或 `.hyper-designer/activityRequirementDecomposition/`
- **项目代码**：当前项目的上下文文件（**增量设计必须读取**，了解现有实现才能做增量设计）
- **已有设计文档**：`.hyper-designer/systemFunctionalDesign/` 和 `.hyper-designer/moduleFunctionalDesign/` 下的已有说明书（**增量设计时必须优先读取**）
- **参考项目代码**：参考实现（如有）
- **功能库**：可复用组件库（如有）
- **前序设计文档**（模块设计时）：系统功能设计说明书

## 增量设计工作流（核心原则）

**大多数设计任务都是增量的。** 在已有系统上迭代时，默认工作模式是增量设计，而非从头重写。正确的工作流是先了解"现状"，再设计"变化"。跳过存量分析直接开始设计，会导致设计方案与现有实现冲突，或重复描述已有内容。

### 第一步：存量分析（设计前必做）

在开始任何设计工作之前，**必须**按顺序完成以下读取和分析：

**1. 读取已有设计文档**
- 检查 `.hyper-designer/systemFunctionalDesign/` 是否存在已有的系统设计说明书
- 检查 `.hyper-designer/moduleFunctionalDesign/` 是否存在相关模块的已有说明书
- 阅读已有文档，理解现有设计决策、架构边界、接口约定
- 识别：哪些章节需要更新，哪些可以完全沿用，哪些需要部分修改

**2. 读取项目代码**
- 识别现有模块划分和架构边界（目录结构、主要类/文件）
- 确认现有接口定义和调用关系（接口文件、API 定义）
- 发现现有技术约束（框架版本、数据库类型、通信协议、配置规范）
- 识别技术债务和现有问题点，设计时决定是否一并处理

**3. 分析需求变更范围**
- 读取新增或变更的 SR 清单（来自 SR-AR 分解分配表）
- 对比已有设计，确认哪些功能域受到影响
- 精确界定"本次需要设计什么"，避免过度设计

### 第二步：增量范围界定

基于存量分析，明确本次设计任务的范围，并在开始撰写前做出如下决策：

| 功能分类 | 判断标准 | 文档策略 |
| ------- | ------- | ------- |
| **新增功能** | SR 全新，代码中无对应实现 | 完整撰写对应章节，建立新的设计基线 |
| **修改功能** | SR 有变更，或现有实现需要改造 | 在已有章节中标注变更内容，保留原有设计决策记录 |
| **沿用功能** | SR 未变，现有实现满足要求 | 引用已有设计说明书，无需重写；仅在确有必要时更新 |
| **废弃功能** | SR 被删除，或业务决策废弃 | 在已有章节标注废弃，说明废弃原因和影响 |

### 第三步：增量设计文档原则

- **聚焦变化**：重点描述"与上一版本相比，新增了什么、修改了什么、为什么"；沿用的部分可以引用或简述，不需要重复全量内容
- **标注变更**：在发生变更的章节开头，用一句话说明"本节相对上一版本的变化"
- **版本表驱动**：系统设计说明书 §1 的版本变更表**必须准确**反映本次迭代范围，读者应能从此表快速定位变更内容
- **保留决策记录**：修改设计时，**保留**原有的技术方案选择记录和决策依据，不要删除，只追加说明变更理由。这是设计文档最大的价值所在——记录"当时为什么这么决定"。
- **追溯链完整**：所有设计变更都必须能追溯到新增或变更的 SR

### 全新 vs 增量的判断规则

```
如果 .hyper-designer/systemFunctionalDesign/ 下无任何文档 → 全新系统设计
  → 完整撰写所有章节，建立设计基线文档

如果 .hyper-designer/systemFunctionalDesign/ 下已有文档   → 增量设计
  → 必须先读取已有文档和项目代码，再确定增量范围
  → 不允许在未读取已有设计的情况下开始撰写新的设计文档
  → 输出应该是对已有文档的更新，而非全新文档
```

## Design Principles

### 需求驱动的设计

每项设计决策必须可追溯到具体的系统需求（SR）或约束：
- 从 SR 出发，确定设计目标
- 设计方案必须说明满足了哪些 SR
- 规格分解必须说明分解依据和过程
- 变更时可沿追溯链评估影响

### 规格分解方法论

系统级规格必须逐层分解到功能级：
- **自顶向下**：系统规格 → 功能域规格 → 功能规格
- **分解守恒**：各功能分解后的规格之和 ≥ 系统级规格（含余量）
- **依据记录**：每次分解记录依据，便于设计基础变更时调整
- **可验证性**：分解后的规格必须可测量、可验证

### 接口优先设计

接口和规格是设计的核心交付件：
- 先定义接口契约，再设计内部实现
- 接口规格包含：名称、类型、所属元素、输入输出、SLA、约束
- 功能定义中的输入/处理/输出/规格/约束，必须有对应的设计内容
- 接口变更需评估对上下游的影响

### 渐进式架构

从简单开始，为演进而设计：
- 避免过度设计
- 构建可扩展点
- 记录演进路径
- 将 NFR 映射到架构决策

## Quality Checklist

完成设计文档前，验证以下各项：

**增量设计前置检查**:
- [ ] 已读取 `.hyper-designer/systemFunctionalDesign/` 下的已有设计文档
- [ ] 已读取 `.hyper-designer/moduleFunctionalDesign/` 下的相关已有设计文档
- [ ] 已读取项目代码，了解现有实现
- [ ] 已明确本次变更范围（新增/修改/沿用/废弃）
- [ ] 版本变更表已更新，准确反映本次迭代范围

**System design（系统功能设计说明书）**:
- [ ] §1 系统设计方案概述：功能性和非功能性设计简介，版本变更表描述本次变更范围
- [ ] §2 系统级设计约束：性能约束（容量规格、资源条件）、安全/韧性/隐私要求、可靠性/可用性指标、易用性要求
- [ ] §3 系统级规格设计：全局性规格已识别，每条规格有分解过程和依据，分解到具体系统功能，可在设计基础变更时回溯调整
- [ ] §4 系统级专项设计：关键用例已分解到架构对象和功能对象，用例行为描述（时序图）验证设计正确合理，非功能需求的系统级方案完整
- [ ] §4.1 可靠性设计：可靠性指标、冗余设计、故障管理、故障预测预防、过载控制、升级不中断
- [ ] §4.2 安全/韧性/隐私设计：安全目标分解、认证权限控制、可信保护、安全隔离、数据保护、韧性最小系统、隐私保护、漏洞修补
- [ ] 所有设计决策可追溯到 SR 或约束
- [ ] 风险/权衡记录已保留（修改设计时不能删除原有决策记录）

**Module design（模块功能设计说明书）**:
- [ ] §1 功能域概述：功能域范围、背景、目标（增量时说明"原有X个功能，本次新增/修改Y个"）
- [ ] §2 功能域总体方案：设计原则/模式/约束、实现思路概述、领域数据模型、与周边系统元素关系
- [ ] §3 功能实现设计（每个功能）：
  - [ ] 功能概述：背景和目的（增量时说明"原有实现的问题"和"本次变更的内容"）
  - [ ] 增量系统需求清单：只列本版本新增或变更的 SR 编号、名称、描述
  - [ ] 实现思路：技术方法、备选方案比较（增量时说明"基于现有架构，新增X、修改Y、不动Z"）
  - [ ] 实现设计：输入→处理→输出完整描述，时序图/活动图/自然语言，系统元素粒度的交互过程
  - [ ] **接口设计**：接口名称、描述、类型、所属系统元素、输入/输出参数、SLA、约束（增量时明确接口是新增还是修改，修改时说明兼容性策略）
  - [ ] DFX 分析：可靠性 FMEA、安全检查（增量时只对新增/修改的步骤做分析）
  - [ ] 分配需求：SR→AR 映射表完整，AR 分配到系统元素
- [ ] 功能定义中的输入/处理/输出/规格/约束，均有对应设计内容
- [ ] 非功能需求已伴随功能分析分配到系统元素
- [ ] 所有接口规格可追溯到功能需求

## Common Pitfalls

| Pitfall | Recognition Signal | Strategy |
|---------|-------------------|----------|
| 未做存量分析就开始设计 | 设计内容与现有代码冲突，或重复已有设计 | 严格按增量工作流：先读已有文档和代码，再设计 |
| 增量任务做全量重写 | 设计文档把沿用的功能全部重写，看不出变更点 | 沿用功能引用已有设计，只详细描述变更内容 |
| 删除原有决策记录 | 修改设计后，看不出原来为什么这么设计 | 保留原有决策记录，追加变更说明 |
| 规格分解缺依据 | 规格数值无推导过程 | 记录分解公式/假设/余量，便于设计基础变更时调整 |
| 接口定义不完整 | 只有名称无 SLA/约束 | 使用完整接口规格表，逐项填写 |
| 功能设计与 SR 脱节 | 设计内容找不到对应 SR | 每个功能设计必须列出增量 SR 清单，设计内容逐条对应 |
| 忽略非功能需求分配 | NFR 停留在系统级未分解 | 在功能设计过程中同步分配 NFR 到系统元素 |
| 用例行为描述粒度不足 | 时序图只到模块级 | 展开到架构元素/子活动粒度 |
| DFX 分析缺失 | 无可靠性/安全分析 | 每个功能必须进行 FMEA 和安全检查 |
| 过度设计 | 为未验证的负载设计复杂架构 | 使用可演进设计，用扩展点替代预先优化 |

## Workflow Integration

**When to use this skill**:
- Workflow state is `systemFunctionalDesign` → Use system design reference
- Workflow state is `moduleFunctionalDesign` → Use module design reference
- 系统需求分解完成 → 可开始系统功能设计
- 系统功能设计完成 → 可开始模块功能设计

**Document locations**:
- System design drafts: `.hyper-designer/systemFunctionalDesign/`
- Module design drafts: `.hyper-designer/moduleFunctionalDesign/{模块名}/`

**Pre-requisites**:
- System design requires: 功能列表文档（含 SR 映射表和 NFR/DFX 摘要）+ 已有设计文档（如有）+ 项目代码
- Module design requires: 系统功能设计说明书 + SR-AR 分解分配表 + 项目代码 + 已有模块设计文档（如有）

**Next steps**:
- After system design: 提交评审，然后进入模块功能设计
- After module design: 提交评审，然后进入实现阶段
