## 工作流各阶段概览

### 角色分工与执行流程

本工作流由 **HArchitect** 与 **HEngineer** 协作完成，严格遵循线性执行顺序。每个阶段必须按照 `Single-Stage Processing Pipeline` 执行后方可进入下一阶段。

**执行链条：**
`IRAnalysis` → `scenarioAnalysis` → `useCaseAnalysis` → `functionalRefinement` → `requirementDecomposition` → `systemFunctionalDesign` → `moduleFunctionalDesign` → `sddPlanGeneration`

### 阶段定义与执行规范

以下定义涵盖所有8个阶段。Agent在执行对应阶段时，必须严格遵循下述的输入、行动指引与输出规范。

#### 阶段 1：IRAnalysis (初始需求分析)

**执行者：** HArchitect
**核心目标：** 将模糊的用户意图转化为结构化的需求文档，明确范围与约束。

**输入依赖：**

- 用户提供的初始对话或需求描述（通常为首次输入）

**执行行动指引：**

1. **深度访谈**：采用5W2H框架与用户进行多轮交互。
    - **What**：明确核心业务功能与痛点。
    - **Who**：识别用户画像与利益相关者。
    - **Why**：挖掘项目背景与业务目标。
    - **Constraints**：确认技术、预算、时间约束。
2. **范围界定**：明确做什么与不做什么。
3. **结构化撰写**：按照Skill模板撰写文档，确保需求可追溯。

**输出交付物：**

- `.hyper-designer/IRAnalysis/需求信息.md`

#### 阶段 2：scenarioAnalysis (场景分析)

**执行者：** HArchitect
**核心目标：** 识别系统所有可能的业务场景，建立系统全景图。

**输入依赖：**

- `.hyper-designer/IRAnalysis/需求信息.md`

**执行行动指引：**

1. **场景识别**：
    - 提取主成功场景。
    - 按场景类型（业务/操作/维护/制造/其他）展开场景识别。
2. **触发定义**：为每个场景定义明确的触发条件与前置状态。
3. **用户确认**：与用户验证场景的完整性，确保没有遗漏关键业务流程。

**输出交付物：**

- `.hyper-designer/scenarioAnalysis/{功能名}场景.md`

#### 阶段 3：useCaseAnalysis (用例分析)

**执行者：** HArchitect
**核心目标：** 将场景细化为可执行的用例规格，定义交互细节与验收标准。

**输入依赖：**

- `.hyper-designer/scenarioAnalysis/{功能名}场景.md`

**执行行动指引：**

1. **用例细化**：针对每个场景展开详细用例。
2. **流程定义**：
    - 编写主成功场景流程。
    - 编写扩展/异常流程。
3. **标准设定**：定义明确的前置条件、后置条件与验收标准。

**输出交付物：**

- `.hyper-designer/useCaseAnalysis/{功能名}用例.md`

#### 阶段 4：functionalRefinement (功能梳理)

**执行者：** HArchitect
**核心目标：** 整理功能清单，进行优先级排序与风险预判（FMEA）。

**输入依赖：**

- `.hyper-designer/IRAnalysis/需求信息.md`
- `.hyper-designer/useCaseAnalysis/{功能名}用例.md`

**执行行动指引：**

1. **功能拆解**：将用例转化为具体的功能点列表。
2. **优先级评估**：与用户确认核心功能与边缘功能。
3. **风险分析**：执行FMEA分析，识别潜在的失效模式与应对策略。

**输出交付物：**

- `.hyper-designer/functionalRefinement/{功能名}功能列表.md`
- `.hyper-designer/functionalRefinement/{功能名}FMEA.md`

#### 阶段 5：requirementDecomposition (需求分解)

**执行者：** HEngineer
**核心目标：** 应用领域驱动设计（DDD）将系统级需求（SR）细化为模块级需求与可执行实现要求（AR），定义子系统接口与依赖关系。

**输入依赖：**

- `.hyper-designer/IRAnalysis/需求信息.md`
- `.hyper-designer/functionalRefinement/{功能名}功能列表.md`
- `.hyper-designer/functionalRefinement/{功能名}FMEA.md`

**执行行动指引：**

1. **领域建模**：采用 DDD 方法划分限界上下文与聚合。
2. **需求分解**：将系统级需求分解为模块级需求，建立 SR-AR 映射。
3. **接口定义**：定义模块间的接口契约与依赖关系。
4. **追溯验证**：建立 IR→SR→AR 的完整追溯链。

**输出交付物：**

- `.hyper-designer/requirementDecomposition/sr-ar-decomposition.md`
- `.hyper-designer/requirementDecomposition/traceability-report.md`

#### 阶段 6：systemFunctionalDesign (系统功能设计)

**执行者：** HEngineer
**核心目标：** 构建系统整体架构，分解模块需求，确定技术蓝图。
**特殊规则：** 包含两个必须串行执行的子步骤。

**输入依赖：**

- `.hyper-designer/IRAnalysis/需求信息.md`
- `.hyper-designer/requirementDecomposition/sr-ar-decomposition.md`
- `.hyper-designer/requirementDecomposition/traceability-report.md`

**执行行动指引：**

**子步骤 6.1：系统需求分解**

1. **模块划分**：基于功能列表与FMEA，与用户讨论系统模块划分维度（按业务域/技术层次）。
2. **接口定义**：初步定义模块间的交互边界与接口契约。
3. **输出生成**：生成系统需求分解文档。

**子步骤 6.2：系统功能设计**

1. **架构设计**：基于分解结果设计系统架构（单体/微服务/分布式）。
2. **技术选型**：确定框架、数据库、中间件等技术栈。
3. **模型构建**：定义核心数据模型与交互协议。
4. **输出生成**：生成系统功能设计文档。

**输出交付物：**

- `.hyper-designer/systemFunctionalDesign/system-design.md`

#### 阶段 7：moduleFunctionalDesign (模块功能设计)

**执行者：** HEngineer
**核心目标：** 将系统设计转化为可开发的详细模块规格与活动计划。
**特殊规则：** 包含两个必须串行执行的子步骤。

**输入依赖：**

- `.hyper-designer/systemFunctionalDesign/system-design.md`
- `.hyper-designer/requirementDecomposition/sr-ar-decomposition.md`

**执行行动指引：**

**子步骤 7.1：活动需求分解**

1. **工作包拆解**：将系统功能转化为可执行的开发任务包。
2. **计划制定**：与用户确认里程碑节点、工作量估算与优先级。
3. **输出生成**：生成活动需求分解文档。

**子步骤 7.2：模块功能设计**

1. **详细设计**：针对每个模块输出详细技术规格（职责、接口、内部结构、算法、数据结构）。
2. **验证确认**：与用户验证设计的可实现性与可测试性。
3. **循环执行**：对每个模块重复此过程，直至所有模块设计完成。

**输出交付物：**

- `.hyper-designer/moduleFunctionalDesign/活动需求分解.md`
- `.hyper-designer/moduleFunctionalDesign/{模块名}设计.md` （每个模块独立文件）

#### 阶段 8：sddPlanGeneration (SDD 开发计划生成)

**执行者：** HEngineer
**核心目标：** 基于模块功能设计说明书（MFD），生成可直接分发给 subagent 执行的规格驱动开发（SDD）计划。

**输入依赖：**

- `.hyper-designer/moduleFunctionalDesign/{模块名}设计.md`（每个模块）
- `.hyper-designer/systemFunctionalDesign/system-design.md`
- `.hyper-designer/requirementDecomposition/sr-ar-decomposition.md`

**执行行动指引：**

1. **访谈确认**：使用 `sdd-plan-generator` Skill 的访谈清单，与用户确认技术栈、测试策略和并行模式。
2. **任务分解**：按照 Skill 中的波次划分原则，将每个模块的 MFD 分解为可执行任务。
3. **覆盖验证**：确保功能覆盖矩阵涵盖所有 MFD 功能（§3.x 章节）和接口卡片。
4. **循环执行**：对每个模块重复此过程，直至所有模块的开发计划生成完毕。

**输出交付物：**

- `dev-plan/{模块名}-dev-plan.md`（每个模块独立文件）