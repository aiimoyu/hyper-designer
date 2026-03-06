import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkflowDefinition, WorkflowState } from '../../../workflows/core'

const getDefinition = vi.fn<[], WorkflowDefinition>()
const getState = vi.fn<[], WorkflowState | null>()

vi.mock('../../../workflows/core/service', () => ({
  workflowService: {
    getDefinition,
    getState,
  },
}))

describe('system transform', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('replaces workflow prompt placeholders', async () => {
    const { createSystemTransformer } = await import('../../../workflows/integrations/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      stageOrder: ['stage1'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': 'workflow overview',
      },
      stages: {
        stage1: {
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue(null)

    const transform = createSystemTransformer()
    const output = { system: ['prefix {HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT} suffix'] }

    await transform({ model: {} } as never, output)

    expect(output.system[0]).toBe('prefix workflow overview suffix')
  })

  it('lets stage prompt bindings override workflow bindings for the same token', async () => {
    const { createSystemTransformer } = await import('../../../workflows/integrations/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      stageOrder: ['stage1'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': 'workflow step',
      },
      stages: {
        stage1: {
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          promptBindings: {
            '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': 'stage step',
          },
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false },
      },
      current: {
        name: 'stage1',
        gateResult: null,
        handoverTo: null,
      },
    })

    const transform = createSystemTransformer()
    const output = { system: ['{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}'] }

    await transform({ model: {} } as never, output)

    expect(output.system[0]).toBe('stage step')
  })

  it('lets fallback prompt bindings override workflow bindings for the same token', async () => {
    const { createSystemTransformer } = await import('../../../workflows/integrations/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      stageOrder: ['stage1'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': 'workflow step',
      },
      fallbackPromptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': 'fallback step',
      },
      stages: {
        stage1: {
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false },
      },
      current: null,
    })

    const transform = createSystemTransformer()
    const output = { system: ['{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}'] }

    await transform({ model: {} } as never, output)

    expect(output.system[0]).toBe('fallback step')
  })

  it('does not depend on system prompt text to decide replacements', async () => {
    const { createSystemTransformer } = await import('../../../workflows/integrations/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      stageOrder: ['stage1'],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': 'shared overview',
      },
      fallbackPromptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': 'shared fallback',
      },
      stages: {
        stage1: {
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue(null)

    const transform = createSystemTransformer()
    const output = {
      system: [
        '## Role Definition\n\nYou are **HArchitect**, collaborating with HEngineer.\n\n{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}',
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}',
      ],
    }

    await transform({ model: {} } as never, output)

    expect(output.system[0]).toContain('shared overview')
    expect(output.system[1]).toBe('shared fallback')
  })
})
