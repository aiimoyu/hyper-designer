import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { filePrompt } from '../../core/utils'
import type { WorkflowDefinition } from '../../core/types'

const __dirname = dirname(fileURLToPath(import.meta.url))

function buildHandoverPrompt(thisName: string, stageTask: string, currentName?: string | null): string {
  const thisDisplay = thisName.toUpperCase()
  const fromDisplay = currentName ? currentName.toUpperCase() : null
  const phaseHeader = fromDisplay
    ? `[ PHASE: ${fromDisplay} → ${thisDisplay} ]`
    : `[ PHASE: ${thisDisplay} ]`
  const switchMsg = fromDisplay
    ? `工作流已从 \`${fromDisplay}\` 切换至 \`${thisDisplay}\`。`
    : `工作流已切换至 \`${thisDisplay}\`。`

  return (
    `${phaseHeader}\n\n` +
    `${switchMsg} 请基于当前上下文与前序产物，${stageTask}，并生成本阶段要求的输出。\n\n` +
    '请遵循 Single-Stage Processing Pipeline，立即开始工作。'
  )
}

export const liteWorkflow: WorkflowDefinition = {
  id: 'lite',
  name: 'Lite Requirements Engineering',
  description: '3-stage lightweight workflow for single-module changes: analysis+scenario → functional list+module design → SDD plan generation',
  entryStageId: 'analysisAndScenario',

  promptBindings: {
    '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': filePrompt(join(__dirname, 'prompts', 'workflow.md')),
  },

  stages: {
    analysisAndScenario: {
      stageId: 'analysisAndScenario',
      name: 'Analysis and Scenario',
      description: 'Consolidate requirement analysis and scenario analysis for a single-module scope',
      agent: 'HArchitect',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'analysisAndScenario.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: {},
      outputs: {
        '需求场景分析': { path: '需求场景分析.md', description: 'Combined requirement and scenario analysis document' },
      },
      transitions: [{ id: 'to-functional-module', toStageId: 'functionalAndModuleDesign', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '完成需求分析与场景分析，并输出精简分析文档', currentName),
    },

    functionalAndModuleDesign: {
      stageId: 'functionalAndModuleDesign',
      name: 'Functional List and Module Design',
      description: 'Produce concise function list and module-level functional design for one module',
      agent: 'HEngineer',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'functionalAndModuleDesign.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: {
        '需求场景分析': { required: true },
      },
      outputs: {
        '功能与模块设计': { path: '功能与模块设计.md', description: 'Functional list with module design summary' },
      },
      transitions: [{ id: 'to-sdd-lite', toStageId: 'sddPlanGenerationLite', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '梳理功能列表并完成单模块功能设计', currentName),
    },

    sddPlanGenerationLite: {
      stageId: 'sddPlanGenerationLite',
      name: 'SDD Plan Generation Lite',
      description: 'Generate an SDD implementation plan for a single module from concise design artifacts',
      agent: 'HEngineer',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'sddPlanGenerationLite.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: {
        '功能与模块设计': { required: true },
      },
      outputs: {
        'SDD 计划': { path: 'SDD 计划.md', description: 'Single-module SDD development plan' },
      },
      transitions: [],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '生成可直接执行的轻量 SDD 开发计划', currentName),
    },
  },
}
