import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PluginInput } from '@opencode-ai/plugin'

const getDefinition = vi.fn<[], { id: string } | null>()
const getState = vi.fn<[], { current?: { handoverTo?: string | null; name?: string | null } } | null>()
const on = vi.fn()
const isHandoverInProgress = vi.fn<[], boolean>()
const getHandoverAgent = vi.fn<[string], string | null>()
const getHandoverPrompt = vi.fn<[string | null, string], string | null>()
const executeHandover = vi.fn(async () => ({}))

vi.mock('../../../workflows/core/service', () => ({
  workflowService: {
    getDefinition,
    getState,
    on,
    isHandoverInProgress,
    getHandoverAgent,
    getHandoverPrompt,
    executeHandover,
  },
}))

vi.mock('../../../config/loader', () => ({
  loadHDConfig: () => ({ workflow: 'classic', agents: {} }),
}))

vi.mock('../../../workflows/integrations/opencode/workflow-tools', () => ({
  convertWorkflowToolsToOpenCode: () => ({}),
}))

describe('createWorkflowHooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getState.mockReturnValue(null)
    isHandoverInProgress.mockReturnValue(false)
  })

  it('keeps hooks functional in fallback mode before workflow selection', async () => {
    getDefinition.mockReturnValue(null)

    const { createWorkflowHooks } = await import('../../../workflows/integrations/opencode')
    const hooks = await createWorkflowHooks({} as PluginInput)

    await expect(
      hooks.event({ event: { type: 'session.idle', properties: { sessionID: 'test-session' } } }),
    ).resolves.toBeUndefined()
  })
})
