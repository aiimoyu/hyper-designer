import type { AgentPromptMetadata } from '../../../../agents/types'
import type { AgentConfig } from '../../../../agents/types'
import type { AgentDefinition } from '../../../../agents/factory'
import { createAgent, stringPrompt } from '../../../../agents/factory'

const BASE_PROMPT = `You are HAnalysis, the Hyper Designer project-analysis specialist.

Operate as a lean, stage-driven primary agent for the projectAnalysis workflow.
Focus on the current workflow stage only:
- systemAnalysis
- componentAnalysis
- missingCoverageCheck

Keep this base prompt lightweight. Do not embed full analysis methodology here.
Use the workflow-provided stage context and load the stage skill as the primary source of detailed process, checks, and output contracts.`

export const HANALYSIS_PROMPT_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'EXPENSIVE',
  promptAlias: 'HAnalysis',
  keyTrigger:
    'Project-analysis workflow specialist for systemAnalysis, componentAnalysis, and missingCoverageCheck. Keeps the base prompt lean and relies on stage-specific skills for detailed methodology.',
  triggers: [
    {
      domain: 'Project Analysis',
      trigger: 'Need system-level project analysis before component fan-out work',
    },
    {
      domain: 'Component Analysis',
      trigger: 'Need stage-driven component-level analysis using a manifest from prior system analysis',
    },
    {
      domain: 'Coverage Validation',
      trigger: 'Need diagnostic missing-coverage checks across generated project-analysis artifacts',
    },
  ],
  useWhen: [
    'Working inside the projectAnalysis workflow',
    'Current stage is systemAnalysis, componentAnalysis, or missingCoverageCheck',
    'Need lean base identity plus workflow-injected stage instructions',
  ],
  avoidWhen: [
    'Classic requirements workflow stages handled by HArchitect or HEngineer',
    'General implementation or coding work outside project-analysis workflow',
    'Embedding full stage methodology directly into the base prompt',
  ],
}

const DEFINITION: AgentDefinition = {
  name: 'HAnalysis',
  description:
    'Project Analysis Specialist - Executes the projectAnalysis workflow across systemAnalysis, componentAnalysis, and missingCoverageCheck. Stays lean at the base prompt layer and relies on workflow stage context plus stage-specific skills for detailed analysis methodology and artifact contracts.',
  mode: 'primary',
  color: '#7C3AED',
  defaultTemperature: 0.4,
  defaultMaxTokens: 200000,
  promptGenerators: [
    stringPrompt(BASE_PROMPT),
    stringPrompt('{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}'),
    stringPrompt('{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}'),
  ],
  defaultPermission: {
    bash: 'deny',
    edit: 'allow',
    skill: 'allow',
    todoread: 'allow',
    webfetch: 'deny',
    websearch: 'deny',
    question: 'allow',
    task: 'allow',
    external_directory: 'allow',
    hd_workflow_state: 'allow',
    hd_handover: 'allow',
    hd_force_next_step: 'ask',
  },
}

export function createHAnalysisAgent(model?: string): AgentConfig {
  return createAgent(DEFINITION, model)
}

createHAnalysisAgent.mode = DEFINITION.mode
