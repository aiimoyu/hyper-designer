import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PluginInput } from '@opencode-ai/plugin'

const getDefinition = vi.fn<[], { id: string } | null>()
const on = vi.fn()
const eventHandler = vi.fn(async () => {})

vi.mock('../../../workflows/core/service', () => ({
  workflowService: {
    getDefinition,
    on,
  },
}))

vi.mock('../../../config/loader', () => ({
  loadHDConfig: () => ({ workflow: 'classic', agents: {} }),
}))

vi.mock('../../../workflows/integrations/opencode/event-handler', () => ({
  createEventHandler: () => eventHandler,
}))

vi.mock('../../../workflows/integrations/opencode/workflow-tools', () => ({
  convertWorkflowToolsToOpenCode: () => ({}),
}))

describe('createWorkflowHooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps hooks functional in fallback mode before workflow selection', async () => {
    getDefinition.mockReturnValue(null)

    const { createWorkflowHooks } = await import('../../../workflows/integrations/opencode')
    const hooks = await createWorkflowHooks({} as PluginInput)

    await hooks.event({ event: { type: 'session.idle', properties: {} } })
    expect(eventHandler).toHaveBeenCalledTimes(1)
  })
})
