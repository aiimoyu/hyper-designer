import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Hooks, PluginInput } from '@opencode-ai/plugin'
import type { UserMessage, Part } from '@opencode-ai/sdk'

import { createUsingHyperDesignerTransformer } from '../../../transform/opencode/using-hyperdesigner-transform'
import { clearAgentPluginsForTest } from '../../../plugins/agent/registry'
import { BUILTIN_AGENT_PLUGINS } from '../../../plugins/agent/builtin'
import { registerAgentPlugins } from '../../../plugins/agent'

type ChatMessageHook = NonNullable<Hooks['chat.message']>
type ChatMessageInput = Parameters<ChatMessageHook>[0]
type ChatMessageOutput = Parameters<ChatMessageHook>[1]

function createMockUserMessage(): UserMessage {
  return {
    id: 'msg-1',
    sessionID: 'session-1',
    role: 'user',
    time: { created: Date.now() },
    agent: 'HArchitect',
    model: {
      providerID: 'provider-a',
      modelID: 'model-a',
    },
  }
}

function createMockOutput(message: UserMessage): ChatMessageOutput {
  return {
    message,
    parts: [] as Part[],
  }
}

describe('createUsingHyperDesignerTransformer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAgentPluginsForTest()
    registerAgentPlugins(BUILTIN_AGENT_PLUGINS)
  })

  it('injects system prompt for hyper-designer builtin agents', async () => {
    const transformer = createUsingHyperDesignerTransformer({} as PluginInput)
    const input: ChatMessageInput = {
      sessionID: 'session-1',
      agent: 'HArchitect',
    }
    const output = createMockOutput(createMockUserMessage())

    await transformer(input, output)

    expect(output.message.system).toBeDefined()
    expect(output.message.system).toContain('<using-hyper-designer>')
    expect(output.message.system).toContain('hyper-designer 插件增强功能')
    expect(output.message.system).toContain('HArchitect')
    expect(output.message.system).toContain('HEngineer')
    expect(output.message.system).toContain('HCritic')
  })

  it('injects system prompt for Hyper agent', async () => {
    const transformer = createUsingHyperDesignerTransformer({} as PluginInput)
    const input: ChatMessageInput = {
      sessionID: 'session-1',
      agent: 'Hyper',
    }
    const output = createMockOutput({
      ...createMockUserMessage(),
      agent: 'Hyper',
    })

    await transformer(input, output)

    expect(output.message.system).toBeDefined()
    expect(output.message.system).toContain('<using-hyper-designer>')
  })

  it('does not inject system prompt for non-hyper-designer agents', async () => {
    const transformer = createUsingHyperDesignerTransformer({} as PluginInput)
    const input: ChatMessageInput = {
      sessionID: 'session-1',
      agent: 'build',
    }
    const output = createMockOutput({
      ...createMockUserMessage(),
      agent: 'build',
    })

    await transformer(input, output)

    expect(output.message.system).toBeUndefined()
  })

  it('does not inject system prompt when agent is undefined', async () => {
    const transformer = createUsingHyperDesignerTransformer({} as PluginInput)
    const input: ChatMessageInput = {
      sessionID: 'session-1',
    }
    const output = createMockOutput(createMockUserMessage())

    await transformer(input, output)

    expect(output.message.system).toBeUndefined()
  })

  it('appends to existing system prompt', async () => {
    const transformer = createUsingHyperDesignerTransformer({} as PluginInput)
    const input: ChatMessageInput = {
      sessionID: 'session-1',
      agent: 'HArchitect',
    }
    const output = createMockOutput(createMockUserMessage())
    output.message.system = 'Existing system prompt'

    await transformer(input, output)

    expect(output.message.system).toContain('Existing system prompt')
    expect(output.message.system).toContain('<using-hyper-designer>')
  })

  it('includes all hyper-designer agents in the prompt', async () => {
    const transformer = createUsingHyperDesignerTransformer({} as PluginInput)
    const input: ChatMessageInput = {
      sessionID: 'session-1',
      agent: 'HCritic',
    }
    const output = createMockOutput({
      ...createMockUserMessage(),
      agent: 'HCritic',
    })

    await transformer(input, output)

    expect(output.message.system).toContain('HArchitect')
    expect(output.message.system).toContain('HEngineer')
    expect(output.message.system).toContain('HCritic')
    expect(output.message.system).toContain('HCollector')
    expect(output.message.system).toContain('HAnalysis')
  })

  it('includes workflow tools guidance in the prompt', async () => {
    const transformer = createUsingHyperDesignerTransformer({} as PluginInput)
    const input: ChatMessageInput = {
      sessionID: 'session-1',
      agent: 'HArchitect',
    }
    const output = createMockOutput(createMockUserMessage())

    await transformer(input, output)

    expect(output.message.system).toContain('hd_handover')
    expect(output.message.system).toContain('hd_milestone')
    expect(output.message.system).toContain('工作流工具')
  })
})
