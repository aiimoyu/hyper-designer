## Lite 工作流各阶段概览

### 角色分工与执行流程

本工作流由 **HArchitect** 与 **HEngineer** 协作完成，严格遵循线性执行顺序。每个阶段必须按照 `Single-Stage Processing Pipeline` 执行后方可进入下一阶段。

**执行链条：**
`requirementAnalysis` → `ModuleDesign` → `developmentPlan`

### 阶段定义与执行规范

以下定义涵盖所有3个阶段。Agent在执行对应阶段时，必须严格遵循下述的输入、行动指引与输出规范。

#### 阶段 1：requirementAnalysis (需求分析与场景分析)

**执行者：** HArchitect
**核心目标：** 在单模块范围内完成需求分析和场景分析，形成下游可直接使用的精简输入。

**输入依赖：**

- 用户提供的初始对话或需求描述（通常为首次输入）

**执行行动指引：**

1. **需求访谈**：采用精简版5W2H框架进行快速交互。
    - 聚焦核心功能与约束。
    - 明确单模块边界。
2. **场景识别**：快速识别最多3个关键场景（业务/操作/维护/制造/其他）。
3. **结构化撰写**：按照Lite模板输出，严格长度限制。

**输出交付物：**

- `.hyper-designer/requirementAnalysis/需求分析说明书.md`

#### 阶段 2：ModuleDesign (功能列表与模块设计)

**执行者：** HEngineer
**核心目标：** 基于需求场景分析，产出单模块可实现的功能列表和模块功能设计摘要。

**输入依赖：**

- `.hyper-designer/requirementAnalysis/需求分析说明书.md`

**执行行动指引：**

1. **功能提取**：从需求场景中提取功能点（最多8个）。
2. **SR映射**：建立功能与SR的映射关系。
3. **模块设计**：输出模块职责、边界、核心接口（最多3个）。
4. **DFX约束**：提取关键非功能性要求（最多5条）。

**输出交付物：**

- `.hyper-designer/ModuleDesign/需求设计说明书.md`

#### 阶段 3：developmentPlan (SDD 开发计划生成)

**执行者：** HEngineer
**核心目标：** 将单模块设计转换为可执行、可分发、可验证的 SDD 计划。

**输入依赖：**

- `.hyper-designer/ModuleDesign/需求设计说明书.md`

**执行行动指引：**

1. **任务分解**：将功能映射为可执行任务（最多4个波次）。
2. **复杂度评级**：为每个任务标注复杂度（quick/medium/deep/integration/review）。
3. **QA场景**：为每个任务定义正常路径+异常路径的测试场景。
4. **风险评估**：识别关键风险与回滚策略。

**输出交付物：**

- `.hyper-designer/developmentPlan/开发计划.md`