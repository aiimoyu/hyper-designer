import { describe, it, expect, vi } from 'vitest'
import type { PluginInput } from '@opencode-ai/plugin'
import type { ToolDefinition } from '../../../workflows/core/toolTypes'

import { createOpenCodePlatformCapabilities } from '../../../platformBridge/capabilities/opencode'
import { createOpenCodePlatformOrchestrator } from '../../../platformBridge/orchestration/opencode'
import { workflowService } from '../../../workflows/core/service'

vi.mock('@opencode-ai/plugin', () => {
  const tool = (definition: Record<string, unknown>) => definition
  const chainable: Record<string, unknown> = {}
  const chainFn = () => chainable
  chainable.describe = chainFn
  chainable.optional = chainFn
  chainable.nullable = chainFn
  chainable.min = chainFn
  chainable.max = chainFn
  tool.schema = {
    enum: () => chainable,
    boolean: () => chainable,
    number: () => chainable,
    string: () => chainable,
    object: () => chainable,
    array: () => chainable,
  }
  return { tool }
})

function createMockCtx(): PluginInput {
  return {
    client: {
      session: {
        create: vi.fn().mockResolvedValue({ data: { id: 'session-new' } }),
        prompt: vi.fn().mockResolvedValue({ data: { info: {}, parts: [{ type: 'text', text: 'ok' }] } }),
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
  } as unknown as PluginInput
}

describe('createOpenCodePlatformOrchestrator', () => {
  it('builds plugin hooks with required shape', async () => {
    const ctx = createMockCtx()
    const capabilities = createOpenCodePlatformCapabilities(ctx)
    const orchestrator = await createOpenCodePlatformOrchestrator({
      ctx,
      capabilities,
      workflowService,
      pluginTools: {},
      hdTools: {},
      mappedAgents: {},
    })

    const hooks = orchestrator.toPluginHooks()
    expect(typeof hooks.config).toBe('function')
    expect(typeof hooks.tool).toBe('object')
    expect(typeof hooks.event).toBe('function')
    expect(typeof hooks['chat.message']).toBe('function')
    expect(typeof hooks['experimental.chat.system.transform']).toBe('function')
  })

  it('builds workflow tools from workflowService definitions', async () => {
    const ctx = createMockCtx()
    const capabilities = createOpenCodePlatformCapabilities(ctx)
    const mockWorkflowTool: ToolDefinition = {
      name: 'hd_test_tool',
      description: 'test workflow tool',
      params: {
        foo: {
          type: 'string',
        },
      },
      execute: async () => JSON.stringify({ ok: true }),
    }

    const orchestrator = await createOpenCodePlatformOrchestrator({
      ctx,
      capabilities,
      workflowService: {
        listAllTools: () => [mockWorkflowTool],
        getDefinition: () => workflowService.getDefinition(),
        getCurrentStage: () => workflowService.getCurrentStage(),
        getState: () => workflowService.getState(),
        on: () => workflowService,
        isHandoverInProgress: () => false,
        getHandoverAgent: () => null,
        getHandoverPrompt: () => null,
        executeHandover: async () => ({ success: true }),
      },
      pluginTools: {},
      hdTools: {},
      mappedAgents: {},
    })

    const hooks = orchestrator.toPluginHooks()
    expect(hooks.tool).toHaveProperty('hd_test_tool')
  })
})
