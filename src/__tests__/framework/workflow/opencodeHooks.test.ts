import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PluginInput } from '@opencode-ai/plugin'
import type { WorkflowDefinition, WorkflowState } from '../../../workflows/core'
import type { WorkflowServiceLike } from '../../../platformBridge/orchestration/types'

const getDefinition = vi.fn<[], WorkflowDefinition | null>()
const getState = vi.fn<[], WorkflowState | null>()
const on = vi.fn()
const isHandoverInProgress = vi.fn<[], boolean>()
const getHandoverAgent = vi.fn<[string], string | null>()
const getHandoverPrompt = vi.fn<[string | null, string], string | null>()
const executeHandover = vi.fn(async (_sessionID?: string, _adapter?: unknown) => ({}))

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

describe('createWorkflowHooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getState.mockReturnValue(null)
    isHandoverInProgress.mockReturnValue(false)
  })

  it('keeps hooks functional in fallback mode before workflow selection', async () => {
    getDefinition.mockReturnValue(null)

    const { createWorkflowHooks } = await import('../../../platformBridge/platform/opencode/orchestrator')
    const { createOpenCodePlatformCapabilities } = await import('../../../platformBridge/platform/opencode/capabilities')
    const capabilities = createOpenCodePlatformCapabilities({
      client: {
        session: {
          create: vi.fn().mockResolvedValue({ data: { id: 'new-session' } }),
          prompt: vi.fn().mockResolvedValue({ data: { info: {}, parts: [] } }),
          delete: vi.fn().mockResolvedValue({}),
          summarize: vi.fn().mockResolvedValue({}),
        },
        tui: {
          publish: vi.fn().mockResolvedValue(true),
        },
        config: {
          get: vi.fn().mockResolvedValue({ data: { model: 'openai/gpt-4o' } }),
        },
      },
      directory: process.cwd(),
    } as unknown as PluginInput)
    const mockWorkflowService: WorkflowServiceLike = {
      getDefinition: () => getDefinition(),
      getState: () => getState(),
      on: (event, listener) => {
        on(event, listener)
      },
      isHandoverInProgress: () => isHandoverInProgress(),
      getHandoverAgent: (stage) => getHandoverAgent(stage),
      getHandoverPrompt: (from, to) => getHandoverPrompt(from, to),
      executeHandover: async (sessionID, adapter) => executeHandover(sessionID, adapter),
      listAllTools: () => [],
      getCurrentStage: () => null,
    }

    const hooks = await createWorkflowHooks({} as PluginInput, mockWorkflowService, capabilities)

    await expect(
      hooks.event({ event: { type: 'session.idle', properties: { sessionID: 'test-session' } } }),
    ).resolves.toBeUndefined()
  })
})
