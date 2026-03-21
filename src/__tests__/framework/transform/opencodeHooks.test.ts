import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkflowDefinition, WorkflowState } from '../../../workflows/core'

const getDefinition = vi.fn<[], WorkflowDefinition | null>()
const getState = vi.fn<[], WorkflowState | null>()

vi.mock('../../../workflows/core/service', () => ({
  workflowService: {
    getDefinition,
    getState,
  },
}))

describe('transform opencode hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides experimental.chat.system.transform from transform layer', async () => {
    getDefinition.mockReturnValue(null)
    getState.mockReturnValue(null)

    const { createTransformHooks } = await import('../../../platformBridge/platform/opencode/transform/hooks')
    const hooks = await createTransformHooks({} as never)

    const output = { system: ['<using-hyper-designer>\n{HYPER_DESIGNER_WORKFLOW_FALLBACK_PROMPT}'] }
    await hooks['experimental.chat.system.transform']({}, output)

    expect(output.system[0]).toContain('Current Stage: Workflow Initialization')
  })

  it('skips transform when <using-hyper-designer> tag is not present', async () => {
    getDefinition.mockReturnValue(null)
    getState.mockReturnValue(null)

    const { createTransformHooks } = await import('../../../platformBridge/platform/opencode/transform/hooks')
    const hooks = await createTransformHooks({} as never)

    const output = { system: ['{HYPER_DESIGNER_WORKFLOW_FALLBACK_PROMPT}'] }
    await hooks['experimental.chat.system.transform']({}, output)

    expect(output.system[0]).toBe('{HYPER_DESIGNER_WORKFLOW_FALLBACK_PROMPT}')
  })

  it('skips transform when system messages are empty', async () => {
    getDefinition.mockReturnValue(null)
    getState.mockReturnValue(null)

    const { createTransformHooks } = await import('../../../platformBridge/platform/opencode/transform/hooks')
    const hooks = await createTransformHooks({} as never)

    const output = { system: [] as string[] }
    await hooks['experimental.chat.system.transform']({}, output)

    expect(output.system).toHaveLength(0)
  })
})
