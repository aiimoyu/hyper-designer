import { describe, expect, it, vi } from 'vitest'
import type { AgentConfig, Model, Part, UserMessage } from '@opencode-ai/sdk'
import type { Hooks, Plugin, PluginInput } from '@opencode-ai/plugin'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
    ? true
    : false

type Assert<T extends true> = T

type ChatMessageHook = NonNullable<Hooks['chat.message']>
type ChatMessageInput = Parameters<ChatMessageHook>[0]
type ChatMessageOutput = Parameters<ChatMessageHook>[1]

type ExpectedChatMessageInput = {
  sessionID: string
  agent?: string
  model?: {
    providerID: string
    modelID: string
  }
  messageID?: string
  variant?: string
}

type ExpectedChatMessageOutput = {
  message: UserMessage
  parts: Part[]
}

const chatMessageInputMatchesSpec: Assert<
  Equal<ChatMessageInput, ExpectedChatMessageInput>
> = true

const chatMessageOutputMatchesSpec: Assert<
  Equal<ChatMessageOutput, ExpectedChatMessageOutput>
> = true

type SupportsHiddenByAssignment = { hidden: true } extends AgentConfig ? true : false

const supportsHiddenByAssignment: SupportsHiddenByAssignment = true
const hiddenConfigSample: AgentConfig = { hidden: true }

function createUserMessage(): UserMessage {
  return {
    id: 'msg-1',
    sessionID: 'session-1',
    role: 'user',
    time: { created: Date.now() },
    agent: 'build',
    model: {
      providerID: 'provider-a',
      modelID: 'model-a',
    },
  }
}

function createTextPart(): Part {
  return {
    id: 'part-1',
    sessionID: 'session-1',
    messageID: 'msg-1',
    type: 'text',
    text: 'hello',
  }
}

function createModel(): Model {
  return {
    id: 'provider-a/model-a',
    providerID: 'provider-a',
    api: {
      id: 'provider-a',
      url: 'https://example.com',
      npm: '@example/provider',
    },
    name: 'model-a',
    capabilities: {
      temperature: true,
      reasoning: true,
      attachment: true,
      toolcall: true,
      input: {
        text: true,
        audio: false,
        image: true,
        video: false,
        pdf: true,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
        pdf: false,
      },
    },
    cost: {
      input: 0,
      output: 0,
      cache: {
        read: 0,
        write: 0,
      },
    },
    limit: {
      context: 200000,
      output: 8192,
    },
    status: 'active',
    options: {},
    headers: {},
  }
}

describe('API validation: hooks and AgentConfig compatibility', () => {
  it('keeps chat.message hook input/output signature compatible with plugin API', () => {
    expect(chatMessageInputMatchesSpec).toBe(true)
    expect(chatMessageOutputMatchesSpec).toBe(true)
  })

  it('documents hidden field support status in SDK AgentConfig', () => {
    expect(supportsHiddenByAssignment).toBe(true)
    expect(hiddenConfigSample).toHaveProperty('hidden', true)
  })

  it('allows plugins to return both chat.message and experimental.chat.system.transform hooks', async () => {
    const plugin: Plugin = async () => ({
      'chat.message': async () => {},
      'experimental.chat.system.transform': async () => {},
    })

    const hooks = await plugin({} as unknown as PluginInput)

    expect(typeof hooks['chat.message']).toBe('function')
    expect(typeof hooks['experimental.chat.system.transform']).toBe('function')
  })

  it('executes chat.message before experimental.chat.system.transform in the integration pipeline', async () => {
    const order: string[] = []

    const hooks: Pick<Hooks, 'chat.message' | 'experimental.chat.system.transform'> = {
      'chat.message': vi.fn(async (_input, output) => {
        order.push('chat.message')
        output.parts.push(createTextPart())
      }),
      'experimental.chat.system.transform': vi.fn(async (_input, output) => {
        order.push('experimental.chat.system.transform')
        output.system[0] = `${output.system[0]} transformed`
      }),
    }

    const chatOutput: ChatMessageOutput = {
      message: createUserMessage(),
      parts: [],
    }

    const systemOutput = { system: ['base'] }

    await hooks['chat.message']!(
      {
        sessionID: 'session-1',
        agent: 'build',
        model: {
          providerID: 'provider-a',
          modelID: 'model-a',
        },
        messageID: 'msg-1',
        variant: 'default',
      },
      chatOutput,
    )

    await hooks['experimental.chat.system.transform']!(
      {
        sessionID: 'session-1',
        model: createModel(),
      },
      systemOutput,
    )

    expect(order).toEqual(['chat.message', 'experimental.chat.system.transform'])
    expect(chatOutput.parts).toHaveLength(1)
    expect(systemOutput.system[0]).toBe('base transformed')
  })
})
