import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { summarizeHook } from '../../../../workflows/core/stageHooks'
import { referenceSetupHook } from './hooks/referenceSetupHook'
import { filePrompt } from '../../../../workflows/core/utils'
import type { WorkflowDefinition, MilestoneDefinition, StageFileItem } from '../../../../workflows/core/types'

const __dirname = dirname(fileURLToPath(import.meta.url))

function buildHandoverPrompt(thisName: string, stageTask: string, currentName?: string | null): string {
  const thisDisplay = thisName
  const fromDisplay = currentName ?? null
  const phaseHeader = fromDisplay
    ? `[ PHASE: ${fromDisplay} → ${thisDisplay} ]`
    : `[ PHASE: ${thisDisplay} ]`
  const switchMsg = fromDisplay
    ? `Workflow switched from \`${fromDisplay}\` to \`${thisDisplay}\`.`
    : `Workflow switched to \`${thisDisplay}\`.`

  return (
    `${phaseHeader}\n\n` +
    `${switchMsg} Based on current context and prior artifacts, ${stageTask}, and generate the required output for this stage.\n\n` +
    'Follow the Single-Stage Processing Pipeline and begin immediately.'
  )
}

const HANDOVER_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'hd-gate',
    name: 'Quality Gate',
    description: 'A phase quality gate to ensure deliverables meet quality standards. Please invoke HCritic for a quality review after materials are prepared. This milestone will be activated by HCritic upon approval.',
    failureMessage: 'Phase output failed the quality gate review. Please ensure deliverables are submitted to HCritic and meet quality standards before proceeding with the handover.',
  },
  {
    id: "hd-int-mod",
    name: "Interactive Modification",
    description: "This milestone will be automatically activated after the document has been interactively modified with the user. To ensure document quality and alignment with user intent, interactive modification is required. Use the `hd_prepare_review` and `hd_finalize_review` tools to retrieve the modifications and complete this milestone.",
    failureMessage: "The 'Interactive Modification' milestone is not completed. You must use `hd_prepare_review` and `hd_finalize_review` tools to retrieve changes and activate this milestone. Only then can you proceed to the next stage.",
  }
]

const REQUIREMENT_ANALYSIS_OUTPUTS: StageFileItem[] = [
  {
    id: 'requirementAnalysis',
    path: './.hyper-designer/requirementAnalysis/需求分析说明书.md',
    type: 'file',
    description: 'Requirement analysis specification document',
  },
]

const FUNCTIONAL_DESIGN_INPUTS: StageFileItem[] = [
  {
    id: 'requirementAnalysis',
    path: './.hyper-designer/requirementAnalysis/需求分析说明书.md',
    type: 'file',
    description: 'Requirement analysis specification document',
  },
]

const FUNCTIONAL_DESIGN_OUTPUTS: StageFileItem[] = [
  {
    id: 'functionalDesign',
    path: './.hyper-designer/requirementDesign/需求设计说明书.md',
    type: 'file',
    description: 'Functional design specification document',
  },
]

const SDD_PLAN_INPUTS: StageFileItem[] = [
  {
    id: 'functionalDesign',
    path: './.hyper-designer/requirementDesign/需求设计说明书.md',
    type: 'file',
    description: 'Functional design specification document',
  },
]

const SDD_PLAN_OUTPUTS: StageFileItem[] = [
  {
    id: 'developmentPlan',
    path: './.hyper-designer/developmentPlan/开发计划.md',
    type: 'file',
    description: 'SDD development plan',
  },
]

export const liteWorkflow: WorkflowDefinition = {
  id: 'lite-designer',
  name: 'Lite Designer',
  description: '3-stage lightweight workflow for single-module changes: requirementAnalysis → requirementDesign → designdevelopmentPlan',
  entryStageId: 'requirementAnalysis',

  promptBindings: {
    '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': filePrompt(join(__dirname, 'prompts', 'workflow.md')),
  },

  stages: {
    requirementAnalysis: {
      stageId: 'requirementAnalysis',
      name: 'Requirement Scenario Analysis',
      description: 'Consolidate requirement analysis and scenario analysis',
      agent: 'HArchitect',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'requirementAnalysis.md')),
      },
      requiredMilestones: [...HANDOVER_MILESTONES],
      required: true,
      inputs: [],
      outputs: REQUIREMENT_ANALYSIS_OUTPUTS,
      before: [{ id: 'reference-setup', description: 'Setup REFERENCE.md and wait for user confirmation', agent: "Hyper", fn: referenceSetupHook }],
      after: [{ id: 'summarize-ir', description: 'Summarize IR context', fn: summarizeHook }],
      transitions: [{ id: 'to-requirementDesign', toStageId: 'requirementDesign', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '请使用 `lite-designer` skill进行需求分析，并输出需求分析说明书', currentName),
    },

    requirementDesign: {
      stageId: 'requirementDesign',
      name: 'Requirement Design',
      description: 'Produce module-level functional requirement design',
      agent: 'HEngineer',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'requirementDesign.md')),
      },
      requiredMilestones: [...HANDOVER_MILESTONES],
      required: true,
      inputs: FUNCTIONAL_DESIGN_INPUTS,
      outputs: FUNCTIONAL_DESIGN_OUTPUTS,
      after: [{ id: 'summarize-ir', description: 'Summarize IR context', fn: summarizeHook }],
      transitions: [{ id: 'to-developmentPlan', toStageId: 'developmentPlan', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '请使用 `lite-designer` skill，并根据需求分析进行需求设计，并输出需求设计说明书', currentName),
    },

    developmentPlan: {
      stageId: 'developmentPlan',
      name: 'Development Plan',
      description: 'Generate an SDD implementation plan from design artifacts',
      agent: 'HEngineer',
      inject: [{ provider: 'stage-milestones' }, { provider: 'stage-inputs' }, { provider: 'stage-outputs' }, { provider: 'file-content', tag: 'reference', path: './REFERENCE.md' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(join(__dirname, 'prompts', 'developmentPlan.md')),
      },
      requiredMilestones: [...HANDOVER_MILESTONES],
      required: true,
      inputs: SDD_PLAN_INPUTS,
      outputs: SDD_PLAN_OUTPUTS,
      transitions: [],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '请使用 `lite-designer` skill，并根据需求设计说明书，生成SDD实施计划', currentName),
    },
  },
}
