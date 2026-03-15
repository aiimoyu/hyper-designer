import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PluginInput } from '@opencode-ai/plugin'

import { workflowService } from '../../../workflows/core/service'
import { HyperDesignerPlugin } from '../../../../opencode/.plugins/hyper-designer'

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

interface AgentConfigWithHidden {
  hidden?: boolean
}

function createMockPluginInput(): PluginInput {
  return {
    client: { session: { prompt: async () => {} } },
    directory: process.cwd(),
  } as unknown as PluginInput
}

describe('Integration Tests: Hyper routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('registers Hyper as visible agent and other agents as hidden', async () => {
    const pluginInstance = await HyperDesignerPlugin(createMockPluginInput())
    const configInput: Record<string, unknown> = {}

    await pluginInstance.config?.(configInput)

    const mappedAgents = configInput.agent as Record<string, AgentConfigWithHidden>
    expect(mappedAgents).toHaveProperty('Hyper')
    expect(mappedAgents.Hyper?.hidden).toBeUndefined()

    const nonHyperAgents = Object.entries(mappedAgents).filter(([name]) => name !== 'Hyper')
    expect(nonHyperAgents.length).toBeGreaterThan(0)
    for (const [, config] of nonHyperAgents) {
      expect(config.hidden).toBe(true)
    }
  })

  it('returns chat.message hook from plugin', async () => {
    const pluginInstance = await HyperDesignerPlugin(createMockPluginInput())

    expect(pluginInstance).toHaveProperty('chat.message')
    expect(typeof pluginInstance['chat.message']).toBe('function')
  })

  it('transforms Hyper to stage agent when workflow state has current.agent', async () => {
    const pluginInstance = await HyperDesignerPlugin(createMockPluginInput())
    const hook = pluginInstance['chat.message']

    expect(hook).toBeDefined()

    vi.spyOn(workflowService, 'getState').mockReturnValue({
      current: { agent: 'HArchitect' },
    } as ReturnType<typeof workflowService.getState>)

    const input = { agent: 'Hyper' }
    const output = { message: { agent: 'Hyper' } }

    await hook?.(input as never, output as never)

    expect(input.agent).toBe('HArchitect')
    expect(output.message.agent).toBe('HArchitect')
  })

  it('keeps Hyper unchanged when workflow state is null', async () => {
    const pluginInstance = await HyperDesignerPlugin(createMockPluginInput())
    const hook = pluginInstance['chat.message']

    expect(hook).toBeDefined()

    vi.spyOn(workflowService, 'getState').mockReturnValue(null)

    const input = { agent: 'Hyper' }
    const output = { message: { agent: 'Hyper' } }

    await hook?.(input as never, output as never)

    expect(input.agent).toBe('Hyper')
    expect(output.message.agent).toBe('Hyper')
  })

  it('supports multi-stage routing switches across consecutive messages', async () => {
    const pluginInstance = await HyperDesignerPlugin(createMockPluginInput())
    const hook = pluginInstance['chat.message']

    expect(hook).toBeDefined()

    vi.spyOn(workflowService, 'getState')
      .mockReturnValueOnce({ current: { agent: 'HArchitect' } } as ReturnType<typeof workflowService.getState>)
      .mockReturnValueOnce({ current: { agent: 'HEngineer' } } as ReturnType<typeof workflowService.getState>)

    const firstInput = { agent: 'Hyper' }
    const firstOutput = { message: { agent: 'Hyper' } }
    await hook?.(firstInput as never, firstOutput as never)

    const secondInput = { agent: 'Hyper' }
    const secondOutput = { message: { agent: 'Hyper' } }
    await hook?.(secondInput as never, secondOutput as never)

    expect(firstInput.agent).toBe('HArchitect')
    expect(firstOutput.message.agent).toBe('HArchitect')
    expect(secondInput.agent).toBe('HEngineer')
    expect(secondOutput.message.agent).toBe('HEngineer')
  })
})
