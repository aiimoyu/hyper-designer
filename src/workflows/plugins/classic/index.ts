import type { WorkflowDefinition } from '../../core/types'
import { createHCollectorHook, summarizeHook } from '../../core/stageHooks'

/** 阶段钩子定义 */
const irAnalysisCollectorHook = createHCollectorHook({ domains: ['domainAnalysis'] })
const scenarioAnalysisCollectorHook = createHCollectorHook({ domains: ['systemRequirementAnalysis'] })
const systemDesignCollectorHook = createHCollectorHook({ domains: ['systemDesign', 'codebase'] })

/**
 * 生成阶段移交提示词
 *
 * 使用 stage.name（显示名称）直接构造英文模板，无需维护独立的映射表。
 * 由 handover.ts 负责将 currentStep key 解析为 stage name 后传入。
 *
 * @param thisName    目标阶段显示名称（来自 stageConfig.name）
 * @param stageTask   阶段任务描述（动词短语）
 * @param currentName 来源阶段显示名称（来自 handover.ts 解析，可选）
 */
function buildHandoverPrompt(thisName: string, stageTask: string, currentName?: string | null): string {
  const thisDisplay = thisName.toUpperCase()
  const fromDisplay = currentName ? currentName.toUpperCase() : null
  const phaseHeader = fromDisplay
    ? `[ PHASE: ${fromDisplay} \u2192 ${thisDisplay} ]`
    : `[ PHASE: ${thisDisplay} ]`
  const switchMsg = fromDisplay
    ? `Workflow switched from \`${fromDisplay}\` to \`${thisDisplay}\`.`
    : `Workflow switched to \`${thisDisplay}\`.`
  return (
    `${phaseHeader}\n\n` +
    `${switchMsg} Based on the Context, Collected Data, and Previous Outputs, ` +
    `${stageTask} to generate the required outputs for this stage.\n\n` +
    `Please adhere to the Single-Stage Processing Pipeline and commence work immediately.`
  )
}

/**
 * Classic Requirements Engineering Workflow
 *
 * An 8-stage workflow for comprehensive requirements engineering and system design.
 * This workflow covers the full lifecycle from data collection through module functional design.
 */
export const classicWorkflow: WorkflowDefinition = {
  id: 'classic',
  name: 'Classic Requirements Engineering',
  description: '7-stage workflow: IR analysis → scenario analysis → use case analysis → functional refinement → requirement decomposition → system functional design → module functional design',

  promptFile: 'prompts/workflow.md',

  stageFallbackPromptFile: 'prompts/fallback.md',

  stageOrder: [
    'IRAnalysis',
    'scenarioAnalysis',
    'useCaseAnalysis',
    'functionalRefinement',
    'requirementDecomposition',
    'systemFunctionalDesign',
    'moduleFunctionalDesign',
  ],

  stages: {
    IRAnalysis: {
      name: 'Initial Requirement Analysis',
      description: 'Conduct initial requirement analysis using 5W2H framework and Socratic questioning',
      agent: 'HArchitect',
      promptFile: 'prompts/IRAnalysis.md',
      gate: true,
      beforeStage: [irAnalysisCollectorHook],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, 'perform a rigorous requirement analysis', currentName),
    },

    scenarioAnalysis: {
      name: 'Scenario Analysis',
      description: 'Analyze system usage scenarios, identify actors and business processes',
      agent: 'HArchitect',
      promptFile: 'prompts/scenarioAnalysis.md',
      gate: true,
      beforeStage: [scenarioAnalysisCollectorHook],
      afterStage: [summarizeHook],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, 'analyze system usage scenarios and identify actors and business processes', currentName),
    },

    useCaseAnalysis: {
      name: 'Use Case Analysis',
      description: 'Refine scenarios into detailed use case specifications with inputs, outputs, and acceptance criteria',
      agent: 'HArchitect',
      promptFile: 'prompts/useCaseAnalysis.md',
      gate: true,
      afterStage: [summarizeHook],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, 'refine scenarios into detailed use case specifications with clear inputs, outputs, and acceptance criteria', currentName),
    },

    functionalRefinement: {
      name: 'Functional Refinement',
      description: 'Extract complete functional list, prioritize using MoSCoW method, and perform FMEA analysis',
      agent: 'HArchitect',
      promptFile: 'prompts/functionalRefinement.md',
      gate: true,
      afterStage: [summarizeHook],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, 'extract the complete functional list, prioritize requirements using MoSCoW, and perform FMEA analysis', currentName),
    },

    requirementDecomposition: {
      name: 'Requirement Decomposition',
      description: 'Map and decompose functional list into module-level requirements, subsystems, and interface definitions',
      agent: 'HEngineer',
      promptFile: 'prompts/requirementDecomposition.md',
      gate: true,
      afterStage: [summarizeHook],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, 'map and decompose the functional list into module-level requirements, subsystems, and interface definitions', currentName),
    },

    systemFunctionalDesign: {
      name: 'System Functional Design',
      description: 'Design system architecture, select technology stack, define data models and interaction protocols',
      agent: 'HEngineer',
      promptFile: 'prompts/systemFunctionalDesign.md',
      gate: true,
      beforeStage: [systemDesignCollectorHook],
      afterStage: [summarizeHook],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, 'design the system architecture, select the technology stack, and define data models and interaction protocols based on the decomposed requirements', currentName),
    },

    moduleFunctionalDesign: {
      name: 'Module Functional Design',
      description: 'Output detailed technical specifications for each module: responsibilities, interfaces, internal structure, algorithms, data structures, test strategies',
      agent: 'HEngineer',
      promptFile: 'prompts/moduleFunctionalDesign.md',
      gate: true,
      afterStage: [summarizeHook],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, 'output detailed technical specifications for each module including responsibilities, interfaces, internal structure, algorithms, data structures, and test strategies', currentName),
    },
  },
}
