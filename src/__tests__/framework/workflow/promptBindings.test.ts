import { describe, expect, it } from 'vitest'
import {
  filePrompt,
  loadPromptForStage,
  stringPrompt,
  type WorkflowDefinition,
} from '../../../workflows'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('workflow prompt bindings', () => {
  it('composes workflow and stage prompt bindings', () => {
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': stringPrompt('workflow overview'),
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': stringPrompt('workflow step'),
      },
      stages: {
        stage1: {
          stageId: 'stage1',
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          promptBindings: {
            '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': stringPrompt('stage step'),
          },
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    expect(loadPromptForStage('stage1', workflow)).toBe('workflow overview\n\nstage step')
  })

  it('composes workflow prompt bindings when there is no active stage', () => {
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': stringPrompt('workflow overview'),
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': stringPrompt('workflow step'),
      },
      stages: {
        stage1: {
          stageId: 'stage1',
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    expect(loadPromptForStage(null, workflow)).toBe('workflow overview\n\nworkflow step')
  })

  it('loads prompt binding content from workflow-relative files', () => {
    const workflow: WorkflowDefinition = {
      id: 'classic',
      name: 'Classic Requirements Engineering',
      description: 'Test workflow',
      entryStageId: 'IRAnalysis',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': filePrompt(
          join(__dirname, '..', '..', '..', 'builtin', 'workflows', 'classic', 'prompts', 'workflow.md'),
        ),
      },
      stages: {
        IRAnalysis: {
          stageId: 'IRAnalysis',
          name: 'Initial Requirement Analysis',
          description: 'IR',
          agent: 'HArchitect',
          promptBindings: {
            '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': filePrompt(
              join(__dirname, '..', '..', '..', 'builtin', 'workflows', 'classic', 'prompts', 'IRAnalysis.md'),
            ),
          },
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    const prompt = loadPromptForStage('IRAnalysis', workflow)

    expect(prompt).toContain('#')
    expect(prompt).toContain('Initial Requirements Analysis')
  })

  it('composes prompts dynamically from workflow-defined placeholder keys', () => {
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      promptBindings: {
        '{CUSTOM_OVERVIEW_PROMPT}': stringPrompt('custom workflow overview'),
      },
      stages: {
        stage1: {
          stageId: 'stage1',
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          promptBindings: {
            '{CUSTOM_STEP_PROMPT}': stringPrompt('custom stage step'),
          },
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    expect(loadPromptForStage('stage1', workflow)).toBe('custom workflow overview\n\ncustom stage step')
  })
})
