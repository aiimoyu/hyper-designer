## 工作流各阶段概览（轻量版）

### 适用范围

本流程用于**单模块的简单修改**，目标是用最少阶段完成从需求到可执行 SDD 计划。

### 角色分工与执行流程

本工作流由 **HArchitect** 与 **HEngineer** 协作，严格按线性顺序执行。

**执行链条：**
`analysisAndScenario` → `functionalAndModuleDesign` → `sddPlanGenerationLite`

### 阶段定义与执行规范

#### 阶段 1：analysisAndScenario（需求分析与场景分析）

**执行者：** HArchitect  
**核心目标：** 在单模块范围内完成需求澄清和场景识别，输出可追溯分析结果。

**输出交付物：**
- `需求场景分析.md`

#### 阶段 2：functionalAndModuleDesign（功能列表与模块功能设计）

**执行者：** HEngineer  
**核心目标：** 抽取最小可实现功能列表，并输出单模块设计要点（职责、接口、测试策略）。

**输出交付物：**
- `功能与模块设计.md`

#### 阶段 3：sddPlanGenerationLite（SDD 开发计划生成）

**执行者：** HEngineer  
**核心目标：** 生成可直接分发给 subagent 的轻量 SDD 计划（波次、任务、验收、TDD 场景）。

**输出交付物：**
- `SDD 计划.md`

### 轻量化约束

1. 仅覆盖单模块，不扩展到跨域架构重构。  
2. 多数小节必须按阶段提示词中的长度上限输出。  
3. 输出优先“可执行”和“可验证”，避免冗长背景描述。
