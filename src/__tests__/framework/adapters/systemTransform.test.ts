import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkflowDefinition, WorkflowState } from '../../../workflows/core'
import { HyperDesignerLogger } from '../../../utils/logger'

const FRAMEWORK_FALLBACK_PROMPT_TOKEN = '{HYPER_DESIGNER_WORKFLOW_FALLBACK_PROMPT}'

const getDefinition = vi.fn<[], WorkflowDefinition | null>()
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
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': 'workflow overview',
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

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      initialized: true,
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false, selected: true },
      },
      current: {
        name: 'stage1',
        handoverTo: null,
      },
    })

    const transform = createSystemTransformer()
    const output = { system: ['prefix {HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT} suffix'] }

    await transform({ model: {} } as never, output)

    expect(output.system[0]).toBe('prefix workflow overview suffix')
  })

  it('lets stage prompt bindings override workflow bindings for the same token', async () => {
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': 'workflow step',
      },
      stages: {
        stage1: {
          stageId: 'stage1',
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
      initialized: true,
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false, selected: true },
      },
      current: {
        name: 'stage1',
        handoverTo: null,
      },
    })
    const transform = createSystemTransformer()
    const output = { system: ['{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}'] }

    await transform({ model: {} } as never, output)

    expect(output.system[0]).toBe('stage step')
  })

  it('injects framework fallback prompt and clears workflow tokens when no active stage', async () => {
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': 'workflow overview',
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': 'workflow step',
        '{HYPER_DESIGNER_CUSTOM_PROMPT}': 'custom prompt',
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

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      initialized: true,
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false, selected: true },
      },
      current: null,
    })

    const transform = createSystemTransformer()
    const output = {
      system: [
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}',
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}',
        '{HYPER_DESIGNER_CUSTOM_PROMPT}',
        FRAMEWORK_FALLBACK_PROMPT_TOKEN,
      ],
    }

    await transform({ model: {} } as never, output)

    expect(output.system[0]).toBe('')
    expect(output.system[1]).toBe('')
    expect(output.system[2]).toBe('')
    expect(output.system[3]).toContain('当前阶段：工作流初始化')
    expect(output.system[3]).not.toContain(FRAMEWORK_FALLBACK_PROMPT_TOKEN)
  })

  it('resolves dynamic workflow/stage tokens and clears fallback token in active stage', async () => {
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': 'shared overview',
        '{HYPER_DESIGNER_CUSTOM_PROMPT}': 'workflow custom',
      },
      stages: {
        stage1: {
          stageId: 'stage1',
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          promptBindings: {
            '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}': 'stage step',
            '{HYPER_DESIGNER_CUSTOM_PROMPT}': 'stage custom',
          },
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      initialized: true,
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false, selected: true },
      },
      current: {
        name: 'stage1',
        handoverTo: null,
      },
    })

    const transform = createSystemTransformer()
    const output = {
      system: [
        '## Role Definition\n\nYou are **HArchitect**, collaborating with HEngineer.\n\n{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}',
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}',
        '{HYPER_DESIGNER_CUSTOM_PROMPT}',
        FRAMEWORK_FALLBACK_PROMPT_TOKEN,
      ],
    }

    await transform({ model: {} } as never, output)

    expect(output.system[0]).toContain('shared overview')
    expect(output.system[1]).toBe('stage step')
    expect(output.system[2]).toBe('stage custom')
    expect(output.system[3]).toBe('')
  })

  it('clears default workflow tokens and injects framework fallback when workflow is undefined', async () => {
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')

    getDefinition.mockReturnValue(null)
    getState.mockReturnValue(null)

    const transform = createSystemTransformer()
    const output = {
      system: [
        '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}',
        '{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}',
        '{HYPER_DESIGNER_WORKFLOW_CUSTOM_DYNAMIC_PROMPT}',
        FRAMEWORK_FALLBACK_PROMPT_TOKEN,
      ],
    }

    await transform({ model: {} } as never, output)

    expect(output.system[0]).toBe('')
    expect(output.system[1]).toBe('')
    expect(output.system[2]).toBe('')
    expect(output.system[3]).toContain('当前阶段：工作流初始化')
    expect(output.system[3]).not.toContain(FRAMEWORK_FALLBACK_PROMPT_TOKEN)
  })

  it('appends stage injection content when stage has inject configured', async () => {
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      stages: {
        stage1: {
          stageId: 'stage1',
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          inject: ['stage-config', 'stage-milestones'],
          requiredMilestones: ['gate'],
          injectContent: ['输入文件', 'xxx', 'yyy'],
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      initialized: true,
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false, selected: true },
      },
      current: {
        name: 'stage1',
        handoverTo: null,
      },
    })

    const transform = createSystemTransformer()
    const output = { system: ['base system prompt'] }
    const debugSpy = vi.spyOn(HyperDesignerLogger, 'debug')

    await transform({ model: {} } as never, output)

    expect(output.system).toHaveLength(1)
    expect(output.system[0]).toContain('base system prompt')
    expect(output.system[0]).toContain('Workflow Stage Injections')
    expect(output.system[0]).toContain('输入文件')
    expect(output.system[0]).toContain('xxx')
    expect(output.system[0]).toContain('yyy')
    expect(output.system[0]).toContain('Stage Required Milestones (stage1)')
    expect(output.system[0]).toContain('gate')
    expect(debugSpy).toHaveBeenCalledWith(
      'SystemTransform',
      'stage injection appended',
      expect.objectContaining({
        currentStage: 'stage1',
        providerIds: ['stage-config', 'stage-milestones'],
      }),
    )
  })

  it('does not append injection when stage has no inject configured', async () => {
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      stages: {
        stage1: {
          stageId: 'stage1',
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          injectContent: ['输入文件', 'xxx', 'yyy'],
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      initialized: true,
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false, selected: true },
      },
      current: {
        name: 'stage1',
        handoverTo: null,
      },
    })

    const transform = createSystemTransformer()
    const output = { system: ['base system prompt'] }

    await transform({ model: {} } as never, output)

    expect(output.system).toEqual(['base system prompt'])
  })

  it('injects only selected provider content when providers are explicitly configured', async () => {
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      stages: {
        stage1: {
          stageId: 'stage1',
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          inject: ['stage-milestones'],
          requiredMilestones: ['gate', 'doc_review'],
          injectContent: ['输入文件', 'xxx', 'yyy'],
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      initialized: true,
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false, selected: true },
      },
      current: {
        name: 'stage1',
        handoverTo: null,
      },
    })

    const transform = createSystemTransformer()
    const output = { system: ['base system prompt'] }

    await transform({ model: {} } as never, output)

    expect(output.system).toHaveLength(1)
    expect(output.system[0]).toContain('base system prompt')
    expect(output.system[0]).toContain('Stage Required Milestones (stage1)')
    expect(output.system[0]).toContain('gate')
    expect(output.system[0]).toContain('doc_review')
    expect(output.system[0]).not.toContain('Workflow Stage Injections')
    expect(output.system[0]).not.toContain('输入文件')
  })

  it('injects both providers when multiple are configured', async () => {
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'stage1',
      stages: {
        stage1: {
          stageId: 'stage1',
          name: 'Stage 1',
          description: 'Stage 1',
          agent: 'HArchitect',
          inject: ['stage-milestones', 'stage-config'],
          requiredMilestones: ['gate'],
          injectContent: ['输入文件'],
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      initialized: true,
      typeId: workflow.id,
      workflow: {
        stage1: { isCompleted: false, selected: true },
      },
      current: {
        name: 'stage1',
        handoverTo: null,
      },
    })

    const transform = createSystemTransformer()
    const output = { system: ['base system prompt'] }

    await transform({ model: {} } as never, output)

    expect(output.system).toHaveLength(1)
    expect(output.system[0]).toContain('base system prompt')
    expect(output.system[0]).toContain('Stage Required Milestones (stage1)')
    expect(output.system[0]).toContain('gate')
    expect(output.system[0]).toContain('Workflow Stage Injections')
    expect(output.system[0]).toContain('输入文件')
  })

  it('merges stage injection into the first system message to avoid multi-system drop', async () => {
    const { createSystemTransformer } = await import('../../../transform/opencode/system-transform')
    const workflow: WorkflowDefinition = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow',
      entryStageId: 'IRAnalysis',
      stages: {
        IRAnalysis: {
          stageId: 'IRAnalysis',
          name: 'Initial Requirement Analysis',
          description: 'IR',
          agent: 'HArchitect',
          inject: ['stage-milestones'],
          requiredMilestones: ['gate'],
          getHandoverPrompt: () => 'handover',
        },
      },
    }

    getDefinition.mockReturnValue(workflow)
    getState.mockReturnValue({
      initialized: true,
      typeId: workflow.id,
      workflow: {
        IRAnalysis: { isCompleted: false, selected: true },
      },
      current: {
        name: 'IRAnalysis',
        handoverTo: null,
      },
    })

    const transform = createSystemTransformer()
    const output = { system: ['base system prompt'] }

    await transform({ model: {} } as never, output)

    expect(output.system).toHaveLength(1)
    expect(output.system[0]).toContain('base system prompt')
    expect(output.system[0]).toContain('Stage Required Milestones (IRAnalysis)')
    expect(output.system[0]).toContain('1. gate')
  })
})
