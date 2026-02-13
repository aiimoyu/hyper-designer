# Plan: 重构 Classic 工作流 - 移除独立 DataCollection 阶段

## TL;DR

> **目标**: 将 classic 工作流从"开头统一收集资料"模式改为"每个阶段单独收集资料"模式
> 
> **核心改动**:
> - 删除独立的 `dataCollection` 阶段
> - 在 `HArchitect.step.md` 中插入新步骤2用于收集资料（使用 `document-collector` skill）
> - 每个阶段提示词增加"资料收集需求"、"输出件"、"skill"、"审查要点"说明
> 
> **交付物**: 13个修改后的文件
> 
> **估计工作量**: Medium
> **并行执行**: NO（文件间有依赖，需按顺序修改）
> **关键路径**: definition.ts → workflow.md → step.md → 各阶段提示词

---

## Context

### 原始需求
用户希望删除 classic 工作流开头的独立 `dataCollection` 阶段，改为每个阶段开始前单独收集数据。同时在 `step.md` 中插入新的步骤2用于收集资料，各阶段提示词需要明确：
1. 阶段需要收集的材料
2. 阶段的输出件
3. 使用的 skill
4. 输出审查的要点

### 当前架构分析

**现有工作流结构**（7个阶段）:
```
dataCollection (HCollector) → IRAnalysis → scenarioAnalysis → useCaseAnalysis → functionalRefinement → requirementDecomposition → systemFunctionalDesign → moduleFunctionalDesign
```

**首次启动逻辑**（currentStep === null）:
- 直接调用 `set_hd_workflow_handover("dataCollection")`
- 等待 HCollector 完成资料收集
- 从 IRAnalysis 开始与用户交互

**step.md 当前7步流程**:
1. 生成草稿和TODO列表
2. 载入相关资料和skill
3. 完成对应阶段工作
4. 使用task工具分配HCritic评审
5. 使用Question工具向用户确认
6. 调用set_hd_workflow_handover移交下一阶段
7. 进入idle

### 修改方案

**新工作流结构**（6个阶段）:
```
IRAnalysis → scenarioAnalysis → useCaseAnalysis → functionalRefinement → requirementDecomposition → systemFunctionalDesign → moduleFunctionalDesign
```

**新的单阶段8步流程**:
```
步骤1：生成草稿和TODO列表
步骤2：收集本阶段所需资料（新增 - 使用document-collector skill）
步骤3：载入相关资料和skill（原步骤2）
步骤4：完成对应阶段工作（原步骤3）
步骤5：使用task工具分配HCritic评审（原步骤4）
步骤6：使用Question工具向用户确认（原步骤5）
步骤7：调用set_hd_workflow_handover移交下一阶段（原步骤6）
步骤8：进入idle（原步骤7）
```

**首次启动逻辑变更**:
- currentStep === null 时，直接进入 IRAnalysis 阶段
- 不再先进行 dataCollection

---

## Work Objectives

### Core Objective
重构 classic 工作流，将资料收集从"开头统一收集"改为"每个阶段单独收集"模式。

### Concrete Deliverables
1. ✅ `src/workflows/plugins/classic/definition.ts` - 删除 dataCollection 阶段定义
2. ✅ `src/workflows/plugins/classic/prompts/workflow.md` - 更新工作流描述和首次启动逻辑
3. ✅ `src/workflows/plugins/classic/prompts/dataCollection.md` - 删除此文件
4. ✅ `src/agents/HArchitect/prompts/step.md` - 插入新的步骤2用于资料收集
5. ✅ `src/agents/HArchitect/prompts/interview.md` - 更新首次启动流程
6. ✅ `src/agents/HArchitect/prompts/constraints.md` - 更新首次启动检查清单
7. ✅ `src/workflows/plugins/classic/prompts/IRAnalysis.md` - 添加资料收集说明
8. ✅ `src/workflows/plugins/classic/prompts/scenarioAnalysis.md` - 添加资料收集说明
9. ✅ `src/workflows/plugins/classic/prompts/useCaseAnalysis.md` - 添加资料收集说明
10. ✅ `src/workflows/plugins/classic/prompts/functionalRefinement.md` - 添加资料收集说明
11. ✅ `src/workflows/plugins/classic/prompts/requirementDecomposition.md` - 添加资料收集说明
12. ✅ `src/workflows/plugins/classic/prompts/systemFunctionalDesign.md` - 添加资料收集说明
13. ✅ `src/workflows/plugins/classic/prompts/moduleFunctionalDesign.md` - 添加资料收集说明

### Definition of Done
- [x] 所有文件修改完成
- [x] `npm run typecheck` 通过
- [x] 工作流定义无 dataCollection 阶段
- [x] step.md 包含8个步骤（新增步骤2）
- [x] 各阶段提示词包含：收集材料、输出件、skill、审查要点
- [x] 首次启动逻辑不再引用 dataCollection

### Must Have
- 删除 dataCollection 阶段定义
- 插入新的步骤2用于资料收集
- 每个阶段提示词明确定义资料收集需求
- 首次启动直接进入 IRAnalysis

### Must NOT Have (Guardrails)
- 不要修改 open-source 工作流（只修改 classic）
- 不要修改测试文件（本次只修改实现）
- 不要删除 HCollector agent（保留代码，只是不再在 classic 中使用）
- 不要改变工作流的其他逻辑

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES（项目使用 vitest）
- **Automated tests**: None（不修改测试文件，但需要验证类型检查通过）
- **Framework**: vitest

### Agent-Executed QA Scenarios

**Scenario 1: Type Check Verification**
```
Tool: Bash
Preconditions: 所有文件修改完成
Steps:
  1. Run: npm run typecheck
  2. Assert: exit code is 0
  3. Assert: no TypeScript errors
Expected Result: Type check passes
Failure Indicators: Type errors in modified files
Evidence: Terminal output capture
```

**Scenario 2: Workflow Definition Validation**
```
Tool: Bash
Preconditions: definition.ts 修改完成
Steps:
  1. Run: npx ts-node -e "const def = require('./src/workflows/plugins/classic/definition.ts').classicWorkflow; console.log(JSON.stringify(def.stageOrder, null, 2));"
  2. Assert: stageOrder does not contain 'dataCollection'
  3. Assert: stageOrder[0] === 'IRAnalysis'
Expected Result: dataCollection removed, IRAnalysis is first
Failure Indicators: dataCollection still in list or wrong first stage
Evidence: Console output
```

**Scenario 3: File Deletion Verification**
```
Tool: Bash
Preconditions: dataCollection.md should be deleted
Steps:
  1. Run: ls src/workflows/plugins/classic/prompts/dataCollection.md 2>&1
  2. Assert: command returns "No such file or directory"
Expected Result: File does not exist
Failure Indicators: File still exists
Evidence: ls output
```

---

## Execution Strategy

### 执行顺序

由于文件间存在依赖关系，必须按以下顺序修改：

```
Phase 1: 核心定义修改（必须最先完成）
├── Task 1: definition.ts - 删除 dataCollection 阶段
└── Task 2: workflow.md - 更新工作流描述

Phase 2: HArchitect 提示词修改（依赖 Phase 1）
├── Task 3: step.md - 插入新步骤2
├── Task 4: interview.md - 更新首次启动逻辑
└── Task 5: constraints.md - 更新检查清单

Phase 3: 阶段提示词修改（依赖 Phase 2，可并行执行）
├── Task 6: IRAnalysis.md
├── Task 7: scenarioAnalysis.md
├── Task 8: useCaseAnalysis.md
├── Task 9: functionalRefinement.md
├── Task 10: requirementDecomposition.md
├── Task 11: systemFunctionalDesign.md
└── Task 12: moduleFunctionalDesign.md

Phase 4: 清理（最后执行）
└── Task 13: dataCollection.md - 删除文件
```

---

## TODOs

### Phase 1: 核心定义修改

- [x] 1. 修改 definition.ts - 删除 dataCollection 阶段

  **What to do**:
  1. 从 `stageOrder` 数组中删除 `'dataCollection'`
  2. 从 `stages` 对象中删除 `dataCollection` 属性
  3. 更新 `description` 字段，从 8-stage 改为 7-stage
  
  **修改内容**:
  ```typescript
  // 修改前:
  stageOrder: [
    'dataCollection',
    'IRAnalysis',
    // ...
  ]
  
  // 修改后:
  stageOrder: [
    'IRAnalysis',
    'scenarioAnalysis',
    'useCaseAnalysis',
    'functionalRefinement',
    'requirementDecomposition',
    'systemFunctionalDesign',
    'moduleFunctionalDesign',
  ]
  ```

  **Must NOT do**:
  - 不要修改其他阶段的定义
  - 不要修改 open-source 工作流

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 2

  **Acceptance Criteria**:
  - [ ] dataCollection 从 stageOrder 中删除
  - [ ] dataCollection 从 stages 对象中删除
  - [ ] description 更新为 7-stage

  **Agent-Executed QA**:
  ```
  Tool: Bash
  Steps:
    1. grep -n "dataCollection" src/workflows/plugins/classic/definition.ts
    2. Assert: output shows no matches (except possibly in comments)
    3. grep -n "stageOrder" src/workflows/plugins/classic/definition.ts | head -10
    4. Assert: first item is 'IRAnalysis', not 'dataCollection'
  Expected Result: dataCollection removed from definition
  Evidence: grep output
  ```

  **Commit**: YES
  - Message: `refactor(classic): remove dataCollection stage from workflow definition`
  - Files: `src/workflows/plugins/classic/definition.ts`

- [x] 2. 修改 workflow.md - 更新工作流描述和首次启动逻辑

  **What to do**:
  1. 更新"阶段范围"部分，移除 dataCollection 阶段
  2. 修改"首次启动特殊规则"，currentStep === null 时直接启动 IRAnalysis
  3. 更新"执行顺序"流程图
  4. 修改"各阶段目标"表格

  **修改内容**:
  ```markdown
  // 修改前:
  HArchitect管理以下5个阶段的工作流：
  1. **dataCollection** (资料收集) - 交接给HCollector
  2. **IRAnalysis** (初始需求分析) - HArchitect执行
  
  // 修改后:
  HArchitect管理以下6个阶段的工作流：
  1. **IRAnalysis** (初始需求分析) - HArchitect执行
  2. **scenarioAnalysis** (场景分析) - HArchitect执行
  // ...
  ```

  **首次启动逻辑修改**:
  ```markdown
  // 修改前:
  直接调用 `set_hd_workflow_handover("dataCollection")`
  
  // 修改后:
  直接调用 `set_hd_workflow_handover("IRAnalysis")`
  ```

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] dataCollection 从阶段列表中移除
  - [ ] 首次启动逻辑改为启动 IRAnalysis
  - [ ] 执行顺序流程图更新

  **Agent-Executed QA**:
  ```
  Tool: Bash
  Steps:
    1. grep -n "dataCollection" src/workflows/plugins/classic/prompts/workflow.md
    2. Assert: no matches (except possibly in comments)
    3. grep -n "IRAnalysis" src/workflows/plugins/classic/prompts/workflow.md | head -5
    4. Assert: first stage is IRAnalysis
  Expected Result: workflow.md updated correctly
  Evidence: grep output
  ```

  **Commit**: YES
  - Message: `refactor(classic): update workflow.md to remove dataCollection stage`
  - Files: `src/workflows/plugins/classic/prompts/workflow.md`

### Phase 2: HArchitect 提示词修改

- [x] 3. 修改 step.md - 插入新的步骤2用于资料收集

  **What to do**:
  1. 在步骤1和原步骤2之间插入新的步骤2
  2. 新步骤2：收集本阶段所需资料（使用 document-collector skill）
  3. 将原步骤2-7改为步骤3-8
  4. 更新所有步骤引用

  **修改后的8步流程**:
  ```markdown
  步骤1：生成草稿和TODO列表
  步骤2：收集本阶段所需资料（新增）
  步骤3：载入相关资料和skill（原步骤2）
  步骤4：完成对应阶段工作（原步骤3）
  步骤5：使用task工具分配HCritic评审（原步骤4）
  步骤6：使用Question工具向用户确认（原步骤5）
  步骤7：调用set_hd_workflow_handover移交下一阶段（原步骤6）
  步骤8：进入idle（原步骤7）
  ```

  **新步骤2详细内容**:
  ```markdown
  ### 步骤2：收集本阶段所需资料

  **目标：** 在执行阶段工作前，先收集和整理本阶段所需的参考资料

  **执行动作：**

  1. **读取阶段提示词**：查看当前阶段的"所需资料"部分，了解需要收集的资料类别
  2. **初始化收集**：创建或更新 `.hyper-designer/document/draft.md`
  3. **预扫描项目**：使用 Glob、LS、Grep 扫描项目中的现有资料
  4. **识别缺失资料**：对比所需资料列表，标记缺失项
  5. **与用户确认**：
     - 确认已发现的资料
     - 询问缺失资料的位置或补充方式
     - 确认是否需要下载外部资源
  6. **补充资料**（如需要）：
     - 使用 `task(subagent_type="explore")` 深度分析代码库
     - 使用 `task(subagent_type="librarian")` 搜索外部资料
     - 使用 `webfetch/websearch` 获取公开资料
  7. **生成索引**：汇总收集结果，生成或更新 `.hyper-designer/document/manifest.md`

  **禁止：**

  - ❌ 跳过资料收集直接进入阶段工作
  - ❌ 假设资料不存在而不询问用户
  - ❌ 收集与本阶段无关的资料

  **提示：**

  - 使用 `document-collector` skill 指导资料收集流程
  - 每次访谈后立即更新草稿
  - 如果用户表示没有某类资料，标记为[缺失]并评估影响
  ```

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 2
  - **Blocks**: Task 4, Task 5, Task 6, Task 7, Task 8, Task 9, Task 10, Task 11, Task 12

  **Acceptance Criteria**:
  - [ ] 8个步骤完整定义
  - [ ] 新步骤2明确描述资料收集流程
  - [ ] 原步骤编号正确更新
  - [ ] 文档结构清晰

  **Agent-Executed QA**:
  ```
  Tool: Bash
  Steps:
    1. grep -n "步骤[1-8]" src/agents/HArchitect/prompts/step.md
    2. Assert: shows 8 distinct steps
    3. grep -n "收集.*资料" src/agents/HArchitect/prompts/step.md
    4. Assert: step 2 contains "收集"
  Expected Result: step.md has 8 steps with proper content
  Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(harchitect): add step 2 for document collection in step.md`
  - Files: `src/agents/HArchitect/prompts/step.md`

- [x] 4. 修改 interview.md - 更新首次启动流程

  **What to do**:
  1. 修改"首次启动流程"部分，currentStep === null 时直接启动 IRAnalysis
  2. 删除或修改涉及 dataCollection 的内容
  3. 更新相关约束说明

  **修改内容**:
  ```markdown
  // 修改前:
  直接调用 `set_hd_workflow_handover("dataCollection")`，不要询问用户需求。
  等待HCollector完成资料收集后，从IRAnalysis阶段开始与用户深度交互。

  // 修改后:
  直接调用 `set_hd_workflow_handover("IRAnalysis")`，不要询问用户需求。
  从IRAnalysis阶段开始与用户深度交互。
  ```

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 3

  **Acceptance Criteria**:
  - [ ] 首次启动逻辑改为启动 IRAnalysis
  - [ ] 不再引用 HCollector 或 dataCollection

  **Commit**: YES
  - Message: `refactor(harchitect): update first-time startup to skip dataCollection`
  - Files: `src/agents/HArchitect/prompts/interview.md`

- [x] 5. 修改 constraints.md - 更新首次启动检查清单

  **What to do**:
  1. 修改"强制检查清单"中关于首次启动的条目
  2. 将 "启动dataCollection阶段" 改为 "启动IRAnalysis阶段"

  **修改内容**:
  ```markdown
  // 修改前:
  □ 如果 currentStep === null，我是否直接启动dataCollection阶段？

  // 修改后:
  □ 如果 currentStep === null，我是否直接启动IRAnalysis阶段？
  ```

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 3

  **Acceptance Criteria**:
  - [ ] 检查清单更新为 IRAnalysis
  - [ ] 不再引用 dataCollection

  **Commit**: YES
  - Message: `refactor(harchitect): update constraints checklist for IRAnalysis startup`
  - Files: `src/agents/HArchitect/prompts/constraints.md`

### Phase 3: 阶段提示词修改

每个阶段提示词需要添加以下标准结构：

```markdown
## 阶段信息

**阶段名称**: {阶段名}
**执行Agent**: HArchitect / HEngineer

## 所需资料

在开始本阶段工作前，需要收集以下资料：

### 资料类别说明

基于 HCollector 定义的4大类资料，本阶段需要收集：

| 资料类别 | 具体资料 | 用途 | 必需性 |
|---------|---------|------|-------|
| {类别1} | {具体说明} | {用途} | {必需/可选} |
| {类别2} | {具体说明} | {用途} | {必需/可选} |

### 资料收集执行

**执行步骤**：
1. 创建/更新 `.hyper-designer/document/draft.md`
2. 使用 Glob/LS 扫描项目中的相关资料
3. 与用户确认已发现的资料
4. 询问并补充缺失资料（使用 explore/librarian）
5. 生成资料索引 `.hyper-designer/document/manifest.md`

**提示**：使用 `document-collector` skill 指导资料收集流程

## 使用技能

**必须使用的 Skill**: `{skill-name}`

{skill 用途说明}

## 阶段输出

本阶段完成后应生成以下文档：

| 文档名称 | 路径 | 说明 |
|---------|------|------|
| {文档1} | `.hyper-designer/{阶段名}/{文件名}` | {说明} |
| {文档2} | `.hyper-designer/{阶段名}/{文件名}` | {说明} |

## 质量审核要求

**审查要点**:

1. **完整性检查**: {具体检查项}
2. **一致性检查**: {具体检查项}
3. **可追溯性检查**: {具体检查项}

**强制审核流程**: （保持原有内容）
```

### 各阶段资料收集需求详情

基于 HCollector 的4大类资料（代码库资料、领域资料、系统需求分析资料、系统设计资料），各阶段收集需求如下：

**IRAnalysis 阶段**：
- **代码库资料**：当前项目代码库（理解现有系统结构、关键模块）
- **代码库资料**：参考项目代码库（对标项目、开源参考实现）
- **领域资料**：行业标准（合规要求、规范文档）
- **领域资料**：领域知识（业务术语、用户画像）

**scenarioAnalysis 阶段**：
- **领域资料**：业务流程文档（现有业务流程图）
- **系统需求分析资料**：场景库（用户场景、使用案例）
- **系统需求分析资料**：功能库（功能清单、需求规格）
- **领域资料**：用户角色定义

**useCaseAnalysis 阶段**：
- **系统需求分析资料**：场景库（细化主场景、备选场景、异常场景）
- **系统需求分析资料**：FMEA库（故障模式、异常处理）
- **系统需求分析资料**：功能库（功能规格说明）

**functionalRefinement 阶段**：
- **系统需求分析资料**：功能库（完整功能清单，用于MoSCoW排序）
- **系统需求分析资料**：FMEA库（风险分析、失效模式）
- **系统需求分析资料**：场景库（验证功能覆盖度）

**requirementDecomposition 阶段**：
- **系统设计资料**：现有系统架构（如果是重构项目）
- **代码库资料**：参考项目架构模式
- **领域资料**：技术约束（部署环境、性能要求）

**systemFunctionalDesign 阶段**：
- **系统设计资料**：架构设计参考
- **代码库资料**：技术栈实现参考
- **代码库资料**：参考项目（开源实现、最佳实践）

**moduleFunctionalDesign 阶段**：
- **系统设计资料**：模块设计参考
- **代码库资料**：接口定义参考
- **代码库资料**：参考实现（同类模块的实现方案）

- [x] 6. 修改 IRAnalysis.md

  **所需资料**（基于 HCollector 4大类）：
  
  | 资料类别 | 具体资料 | 用途 | 必需性 |
  |---------|---------|------|-------|
  | 代码库资料 | 当前项目代码库 | 理解现有系统结构、关键模块 | 如有则必需 |
  | 代码库资料 | 参考项目代码库 | 对标项目、开源参考实现 | 可选 |
  | 领域资料 | 行业标准 | 合规要求、规范文档 | 可选 |
  | 领域资料 | 领域知识 | 业务术语、用户画像、业务背景 | 必需 |

  **资料收集执行**：
  1. 扫描项目文件（src/, docs/ 等）
  2. 询问用户是否有参考项目/对标系统
  3. 收集业务背景信息（目标用户、核心痛点）

  **阶段输出**:
  - `需求信息.md` - 包含 5W2H 分析

  **使用技能**: `ir-analysis`

  **审查要点**:
  1. 5W2H 七个维度是否完整
  2. 需求范围是否清晰
  3. 约束条件是否明确

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 5

  **Commit**: YES
  - Message: `docs(classic): update IRAnalysis.md with document collection requirements`
  - Files: `src/workflows/plugins/classic/prompts/IRAnalysis.md`

- [x] 7. 修改 scenarioAnalysis.md

  **所需资料**（基于 HCollector 4大类）：
  
  | 资料类别 | 具体资料 | 用途 | 必需性 |
  |---------|---------|------|-------|
  | 领域资料 | 业务流程文档 | 现有业务流程图、操作手册 | 如有则必需 |
  | 系统需求分析资料 | 场景库 | 用户场景、使用案例 | 如有则收集 |
  | 系统需求分析资料 | 功能库 | 功能清单、需求规格 | 参考用 |
  | 领域资料 | 用户角色定义 | 用户画像、角色权限 | 必需 |

  **资料收集执行**：
  1. 读取 IRAnalysis 阶段输出的 `需求信息.md`
  2. 询问用户是否有业务流程文档或场景描述
  3. 收集用户角色信息（谁会使用系统）

  **阶段输出**:
  - `{功能名}场景.md` - 场景描述文档

  **使用技能**: `scenario-analysis`

  **审查要点**:
  1. 主场景、备选场景、异常场景是否覆盖完整
  2. Actor 定义是否清晰
  3. 触发条件和前置条件是否明确

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 5

  **Commit**: YES
  - Message: `docs(classic): update scenarioAnalysis.md with document collection requirements`
  - Files: `src/workflows/plugins/classic/prompts/scenarioAnalysis.md`

- [x] 8. 修改 useCaseAnalysis.md

  **所需资料**（基于 HCollector 4大类）：
  
  | 资料类别 | 具体资料 | 用途 | 必需性 |
  |---------|---------|------|-------|
  | 系统需求分析资料 | 场景库 | 细化主场景、备选场景、异常场景 | 必需（前阶段输出） |
  | 系统需求分析资料 | FMEA库 | 故障模式、异常处理场景 | 可选 |
  | 系统需求分析资料 | 功能库 | 功能规格说明 | 参考用 |

  **资料收集执行**：
  1. 读取 scenarioAnalysis 阶段输出的场景文档
  2. 询问用户是否有历史故障记录或异常处理经验
  3. 收集功能规格参考（如有现有文档）

  **阶段输出**:
  - `{功能名}用例.md` - 用例规格文档

  **使用技能**: `use-case-analysis`

  **审查要点**:
  1. 用例规格是否完整（前置条件、主成功场景、扩展场景）
  2. 输入输出是否明确
  3. 验收标准是否可测试

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 5

  **Commit**: YES
  - Message: `docs(classic): update useCaseAnalysis.md with document collection requirements`
  - Files: `src/workflows/plugins/classic/prompts/useCaseAnalysis.md`

- [x] 9. 修改 functionalRefinement.md

  **所需资料**（基于 HCollector 4大类）：
  
  | 资料类别 | 具体资料 | 用途 | 必需性 |
  |---------|---------|------|-------|
  | 系统需求分析资料 | 功能库 | 完整功能清单（用于MoSCoW排序） | 必需（前阶段输出） |
  | 系统需求分析资料 | FMEA库 | 风险分析、失效模式、历史故障 | 如有则收集 |
  | 系统需求分析资料 | 场景库 | 验证功能覆盖度 | 参考用 |

  **资料收集执行**：
  1. 读取 useCaseAnalysis 阶段输出的用例文档
  2. 询问用户是否有历史故障记录或风险清单
  3. 收集业务优先级参考（如有产品路线图）

  **阶段输出**:
  - `{功能名}功能列表.md` - 功能列表
  - `{功能名}FMEA.md` - FMEA 分析文档

  **使用技能**: `functional-refinement`

  **审查要点**:
  1. 功能列表是否完整
  2. 优先级划分是否合理
  3. FMEA 风险识别是否全面

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 5

  **Commit**: YES
  - Message: `docs(classic): update functionalRefinement.md with document collection requirements`
  - Files: `src/workflows/plugins/classic/prompts/functionalRefinement.md`

- [x] 10. 修改 requirementDecomposition.md

  **所需资料**（基于 HCollector 4大类）：
  
  | 资料类别 | 具体资料 | 用途 | 必需性 |
  |---------|---------|------|-------|
  | 系统需求分析资料 | 功能库 | 功能列表（分解基础） | 必需（前阶段输出） |
  | 系统设计资料 | 现有系统架构 | 如果是重构项目 | 如有则必需 |
  | 代码库资料 | 参考项目架构模式 | 架构参考、最佳实践 | 可选 |
  | 领域资料 | 技术约束 | 部署环境、性能要求 | 必需 |

  **资料收集执行**：
  1. 读取 functionalRefinement 阶段输出的功能列表
  2. 询问用户是否有现有系统架构文档（如果是重构）
  3. 收集技术约束信息（部署环境、性能指标）
  4. 搜索参考项目的架构模式（使用 librarian）

  **阶段输出**:
  - `sr-ar-decomposition.md` - 需求分解文档

  **使用技能**: `sr-ar-decomposition`, `ir-sr-ar-traceability`

  **审查要点**:
  1. SR-AR 分解是否合理
  2. 模块边界是否清晰
  3. 追溯链是否完整

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 5

  **Commit**: YES
  - Message: `docs(classic): update requirementDecomposition.md with document collection requirements`
  - Files: `src/workflows/plugins/classic/prompts/requirementDecomposition.md`

- [x] 11. 修改 systemFunctionalDesign.md

  **所需资料**（基于 HCollector 4大类）：

  | 资料类别 | 具体资料 | 用途 | 必需性 |
  |---------|---------|------|-------|
  | 系统设计资料 | 架构设计参考 | 系统架构模式、设计原则 | 可选 |
  | 代码库资料 | 技术栈实现参考 | 选型对比、最佳实践 | 可选 |
  | 代码库资料 | 参考项目 | 开源实现、同类系统 | 可选 |
  | 系统需求分析资料 | 功能库 | 功能实现需求 | 必需（前阶段输出） |

  **资料收集执行**：
  1. 读取 requirementDecomposition 阶段输出的需求分解文档
  2. 询问用户是否有技术栈偏好或限制
  3. 搜索参考架构和技术选型（使用 librarian）
  4. 收集架构设计参考资料

  **阶段输出**:
  - `system-design.md` - 系统设计文档

  **使用技能**: `functional-design`

  **审查要点**:
  1. 架构设计是否合理
  2. 技术选型是否恰当
  3. 数据模型是否完整

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 5

  **Commit**: YES
  - Message: `docs(classic): update systemFunctionalDesign.md with document collection requirements`
  - Files: `src/workflows/plugins/classic/prompts/systemFunctionalDesign.md`

- [x] 12. 修改 moduleFunctionalDesign.md

  **所需资料**（基于 HCollector 4大类）：

  | 资料类别 | 具体资料 | 用途 | 必需性 |
  |---------|---------|------|-------|
  | 系统设计资料 | 系统设计文档 | 系统架构、模块划分 | 必需（前阶段输出） |
  | 系统设计资料 | 模块设计参考 | 同类模块设计方案 | 可选 |
  | 代码库资料 | 接口定义参考 | API 设计规范、协议标准 | 可选 |
  | 代码库资料 | 参考实现 | 开源同类模块实现 | 可选 |

  **资料收集执行**：
  1. 读取 systemFunctionalDesign 阶段输出的系统设计文档
  2. 询问用户是否有接口规范要求
  3. 搜索参考实现和设计模式（使用 librarian）
  4. 收集测试策略参考资料

  **阶段输出**:
  - `{模块名}设计.md` - 模块详细设计文档

  **使用技能**: `functional-design`

  **审查要点**:
  1. 模块职责是否单一
  2. 接口定义是否清晰
  3. 测试策略是否完整

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 5

  **Commit**: YES
  - Message: `docs(classic): update moduleFunctionalDesign.md with document collection requirements`
  - Files: `src/workflows/plugins/classic/prompts/moduleFunctionalDesign.md`

### Phase 4: 清理

- [x] 13. 删除 dataCollection.md 文件

  **What to do**:
  1. 删除 `src/workflows/plugins/classic/prompts/dataCollection.md` 文件

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 1, Task 2

  **Acceptance Criteria**:
  - [ ] 文件已删除
  - [ ] 其他文件不再引用此文件

  **Agent-Executed QA**:
  ```
  Tool: Bash
  Steps:
    1. ls src/workflows/plugins/classic/prompts/dataCollection.md 2>&1
    2. Assert: "No such file or directory"
  Expected Result: File deleted
  Evidence: ls output
  ```

  **Commit**: YES
  - Message: `chore(classic): remove dataCollection.md prompt file`
  - Files: `src/workflows/plugins/classic/prompts/dataCollection.md` (deleted)

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `refactor(classic): remove dataCollection stage from workflow definition` | definition.ts |
| 2 | `refactor(classic): update workflow.md to remove dataCollection stage` | workflow.md |
| 3 | `feat(harchitect): add step 2 for document collection in step.md` | step.md |
| 4 | `refactor(harchitect): update first-time startup to skip dataCollection` | interview.md |
| 5 | `refactor(harchitect): update constraints checklist for IRAnalysis startup` | constraints.md |
| 6 | `docs(classic): update IRAnalysis.md with document collection requirements` | IRAnalysis.md |
| 7 | `docs(classic): update scenarioAnalysis.md with document collection requirements` | scenarioAnalysis.md |
| 8 | `docs(classic): update useCaseAnalysis.md with document collection requirements` | useCaseAnalysis.md |
| 9 | `docs(classic): update functionalRefinement.md with document collection requirements` | functionalRefinement.md |
| 10 | `docs(classic): update requirementDecomposition.md with document collection requirements` | requirementDecomposition.md |
| 11 | `docs(classic): update systemFunctionalDesign.md with document collection requirements` | systemFunctionalDesign.md |
| 12 | `docs(classic): update moduleFunctionalDesign.md with document collection requirements` | moduleFunctionalDesign.md |
| 13 | `chore(classic): remove dataCollection.md prompt file` | dataCollection.md (deleted) |

---

## Success Criteria

### Verification Commands
```bash
# 1. Type check
npm run typecheck
# Expected: No errors

# 2. Verify dataCollection removed
grep -r "dataCollection" src/workflows/plugins/classic/ --include="*.ts" --include="*.md"
# Expected: No matches (except possibly in comments)

# 3. Verify new step 2 exists
grep -n "步骤2.*收集.*资料" src/agents/HArchitect/prompts/step.md
# Expected: Match found

# 4. Verify 8 steps
grep -c "^### 步骤[1-8]" src/agents/HArchitect/prompts/step.md
# Expected: 8

# 5. Verify IRAnalysis is first stage
grep "stageOrder" src/workflows/plugins/classic/definition.ts -A 10 | grep "IRAnalysis"
# Expected: IRAnalysis is first item
```

### Final Checklist
- [x] dataCollection 从 workflow 定义中完全移除
- [x] step.md 包含8个步骤，新步骤2明确定义
- [x] 首次启动逻辑指向 IRAnalysis
- [x] 各阶段提示词包含：所需资料、输出件、skill、审查要点
- [x] dataCollection.md 文件已删除
- [x] Type check 通过
- [x] 所有修改文件已提交（13个提交）

---

## 附录：资料类别映射说明

### HCollector 定义的4大类资料

根据 `src/agents/HCollector/prompts/standard.md`，资料分为以下4大类：

**1. 代码库资料 (Codebase)**
- 当前项目代码库：现有代码结构、关键模块、设计模式
- 参考项目代码库：对标项目、开源参考实现、最佳实践案例

**2. 领域资料 (Domain)**
- 行业标准、规范文档
- 领域知识、术语定义
- 技术白皮书、研究报告

**3. 系统需求分析资料 (Requirements)**
- 场景库(Scenario Library)：用户场景、使用案例、业务流程
- FMEA库(Failure Mode Library)：故障模式、影响分析、预防措施
- 功能库(Function Library)：功能清单、需求规格、验收标准

**4. 系统设计资料 (Design)**
- 系统设计说明书：架构设计、接口定义、数据流图
- 模块设计说明书：模块职责、调用关系、内部实现

### 各阶段资料收集映射

| 阶段 | 代码库资料 | 领域资料 | 系统需求分析资料 | 系统设计资料 |
|------|-----------|---------|-----------------|-------------|
| **IRAnalysis** | ✓ 当前项目<br>✓ 参考项目 | ✓ 行业标准<br>✓ 领域知识 | - | - |
| **scenarioAnalysis** | - | ✓ 业务流程<br>✓ 用户角色 | ✓ 场景库<br>✓ 功能库 | - |
| **useCaseAnalysis** | - | - | ✓ 场景库<br>✓ FMEA库<br>✓ 功能库 | - |
| **functionalRefinement** | - | - | ✓ 功能库<br>✓ FMEA库<br>✓ 场景库 | - |
| **requirementDecomposition** | ✓ 参考架构 | ✓ 技术约束 | ✓ 功能库 | ✓ 现有架构 |
| **systemFunctionalDesign** | ✓ 参考项目<br>✓ 技术栈 | - | ✓ 功能库 | ✓ 架构参考 |
| **moduleFunctionalDesign** | ✓ 参考实现<br>✓ 接口规范 | - | - | ✓ 系统设计<br>✓ 模块参考 |

### 资料收集通用流程

每个阶段执行资料收集时，遵循 `document-collector` skill 的标准流程：

1. **初始化**：创建/更新 `.hyper-designer/document/draft.md`
2. **预扫描**：使用 Glob/LS 扫描项目文件
3. **识别资料**：根据阶段需求识别相关资料
4. **用户确认**：使用 Question 工具确认发现的资料
5. **补充资料**：询问并收集缺失资料（使用 explore/librarian）
6. **生成索引**：更新 `.hyper-designer/document/manifest.md`

### 资料索引格式

统一使用 HCollector 定义的表格格式：

```markdown
| 名称 | 路径/地址 | 描述 | 用途 | 说明 |
|-----|----------|-----|-----|-----|
```

---

## Notes

### 测试影响
以下测试文件引用了 dataCollection，执行计划后这些测试可能失败：
- `src/__tests__/instances/workflows/traditional.test.ts`
- `src/__tests__/framework/workflow/handover.test.ts`
- `src/__tests__/framework/workflow/state.test.ts`
- `src/__tests__/framework/workflow/prompts.test.ts`
- `src/__tests__/instances/integration/decoupling.test.ts`

**处理建议**: 
- 本次修改不涉及测试文件
- 执行计划后，如果需要，可以单独创建一个计划来更新测试

### 相关文件
- `src/workflows/plugins/open-source/definition.ts` - 如果用户后续要求修改 open-source 工作流，需要类似修改
- `src/agents/HCollector/` - HCollector agent 代码保留，但不再在 classic 工作流中使用
