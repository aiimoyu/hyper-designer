# Draft: Classic Workflow - Remove Data Collection Stage

## Requirements (confirmed)
- 删除 dataCollection 独立阶段，改为每个阶段开始前单独收集资料
- 修改 HArchitect step.md，插入新步骤2用于收集资料（使用 document-collector skill）
- 修改各阶段提示词，明确：需要收集的材料、阶段输出件、使用的 skill、输出审查要点
- 修改首次启动逻辑（currentStep === null 时不再启动 dataCollection）

## Technical Decisions
- 新步骤2：收集资料，使用 document-collector skill
- 原步骤2（载入资料）改为步骤3
- 首次启动时直接进入 IRAnalysis 阶段，不再先进行 dataCollection
- 每个阶段开始前都执行资料收集步骤

## Scope Boundaries
- INCLUDE: classic 工作流的所有相关文件
- INCLUDE: HArchitect agent 的提示词文件
- EXCLUDE: open-source 工作流（本次只修改 classic）
- EXCLUDE: HCollector agent（将被移除使用）
- EXCLUDE: 测试文件的修改（可能需要后续更新测试用例）

## Files to Modify
1. src/workflows/plugins/classic/definition.ts
2. src/workflows/plugins/classic/prompts/workflow.md
3. src/workflows/plugins/classic/prompts/dataCollection.md (DELETE)
4. src/agents/HArchitect/prompts/step.md
5. src/agents/HArchitect/prompts/interview.md
6. src/agents/HArchitect/prompts/constraints.md
7. src/workflows/plugins/classic/prompts/IRAnalysis.md
8. src/workflows/plugins/classic/prompts/scenarioAnalysis.md
9. src/workflows/plugins/classic/prompts/useCaseAnalysis.md
10. src/workflows/plugins/classic/prompts/functionalRefinement.md
11. src/workflows/plugins/classic/prompts/requirementDecomposition.md
12. src/workflows/plugins/classic/prompts/systemFunctionalDesign.md
13. src/workflows/plugins/classic/prompts/moduleFunctionalDesign.md

## Open Questions
- [已解决] 各阶段具体需要收集哪些资料类别？基于HCollector的standard.md，分配如下：

### 资料类别分配（基于 HCollector 的4大类）

**HCollector 定义的4大类资料**：
1. **代码库资料**：当前项目代码库、参考项目代码库
2. **领域资料**：行业标准、领域知识、技术白皮书
3. **系统需求分析资料**：场景库、FMEA库、功能库
4. **系统设计资料**：系统设计说明书、模块设计说明书

**各阶段资料收集需求**：

| 阶段 | 需要收集的资料类别 | 具体说明 |
|------|-------------------|---------|
| **IRAnalysis** | 代码库资料 + 领域资料 | 当前项目代码库（理解现有系统）、参考项目代码库（对标分析）、行业标准（合规要求）、领域知识（业务背景） |
| **scenarioAnalysis** | 领域资料 + 系统需求分析资料 | 业务流程文档、场景库、用户角色定义、术语表 |
| **useCaseAnalysis** | 系统需求分析资料 | 场景库（细化用例）、功能库（功能规格）、FMEA库（异常场景） |
| **functionalRefinement** | 系统需求分析资料 | 功能库（完整功能清单）、FMEA库（风险分析）、场景库（验证覆盖） |
| **requirementDecomposition** | 系统设计资料 + 代码库资料 | 现有系统架构、模块设计、参考项目架构模式 |
| **systemFunctionalDesign** | 系统设计资料 + 代码库资料 | 技术栈参考、架构模式、参考项目实现 |
| **moduleFunctionalDesign** | 系统设计资料 + 代码库资料 | 模块设计参考、接口定义、参考实现 |

- 是否需要在阶段提示词中定义统一的资料收集模板？[是，已在计划中定义]

## Affected Tests (need attention)
- src/__tests__/instances/workflows/traditional.test.ts
- src/__tests__/framework/workflow/handover.test.ts
- src/__tests__/framework/workflow/state.test.ts
- src/__tests__/framework/workflow/prompts.test.ts
- src/__tests__/instances/integration/decoupling.test.ts

These tests reference dataCollection stage and will likely fail after modifications.
