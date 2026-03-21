import type { PluginInput } from '@opencode-ai/plugin'
import type { SessionPromptData } from '@opencode-ai/sdk'

import { HyperDesignerLogger } from '../../../utils/logger'
import type {
  PlatformAdapter,
  PlatformCapabilities,
  SendPromptParams,
  SendPromptResult,
} from '../../capabilities/types'

type JsonSchema = {
  type: 'json_schema'
  schema: Record<string, unknown>
}

type PromptBodyWithFormat = NonNullable<SessionPromptData['body']> & {
  format?: JsonSchema
}

interface TuiSessionSelectEvent {
  type: 'tui.session.select'
  properties: {
    sessionID: string
  }
}

interface TuiPublisher {
  publish: (parameters: {
    directory: string
    body: TuiSessionSelectEvent
  }) => Promise<unknown>
}

export interface ModelInfo {
  providerID: string
  modelID: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getStructuredOutput = (response: { data: { info?: unknown } | undefined }): unknown => {
  const data = response.data
  if (!data || !isRecord(data.info)) {
    return undefined
  }
  return data.info.structured_output
}

const extractTextFromParts = (parts: unknown): string => {
  if (!Array.isArray(parts)) {
    return ''
  }
  const textParts: string[] = []
  for (const part of parts) {
    if (isRecord(part) && part.type === 'text' && typeof part.text === 'string') {
      textParts.push(part.text)
    }
  }
  return textParts.join('\n')
}

const resolveSessionID = (sessionId: string, redirects: Map<string, string>): string =>
  redirects.get(sessionId) ?? sessionId

const getTuiPublisher = (ctx: PluginInput): TuiPublisher =>
  ctx.client.tui as unknown as TuiPublisher

const buildClearedSessionTitle = (): string => 'Fresh Context'

export async function resolveDefaultModel(ctx: PluginInput): Promise<ModelInfo> {
  const specified = await ctx.client.config.get().then((cfg) => {
    const model = cfg.data?.model
    if (model) {
      const [providerID, ...rest] = model.split('/')
      return {
        providerID,
        modelID: rest.join('/'),
      }
    }

    return undefined
  }).catch((error) => {
    HyperDesignerLogger.warn('OpenCode', '加载用户配置的默认模型失败，已使用默认模型', error)
    return undefined
  })

  if (specified) {
    return specified
  }

  return { providerID: 'opencode', modelID: 'big-pickle' }
}

export function createOpenCodeAdapter(ctx: PluginInput): PlatformAdapter {
  const sessionRedirects = new Map<string, string>()

  return {
    createSession: async (title: string): Promise<string> => {
      const result = await ctx.client.session.create({
        body: { title },
        query: { directory: ctx.directory },
      })
      const id = result.data?.id
      if (!id) {
        throw new Error(`Failed to create isolated session: ${title}`)
      }
      return id
    },

    sendPrompt: async ({ sessionId, agent, text, schema, system }: SendPromptParams): Promise<SendPromptResult> => {
      const resolvedSessionId = resolveSessionID(sessionId, sessionRedirects)
      const response = await ctx.client.session.prompt({
        path: { id: resolvedSessionId },
        body: {
          agent,
          noReply: false,
          parts: [{ type: 'text', text }],
          ...(system !== undefined ? { system } : {}),
          ...(schema !== undefined ? { format: { type: 'json_schema', schema } } : {}),
        } as PromptBodyWithFormat,
        query: { directory: ctx.directory },
      })
      return {
        structuredOutput: getStructuredOutput(response),
        text: extractTextFromParts(response.data?.parts),
      }
    },

    deleteSession: async (sessionId: string): Promise<void> => {
      const resolvedSessionId = resolveSessionID(sessionId, sessionRedirects)
      await ctx.client.session.delete({
        path: { id: resolvedSessionId },
        query: { directory: ctx.directory },
      })
    },

    summarizeSession: async (sessionId: string): Promise<void> => {
      const resolvedSessionId = resolveSessionID(sessionId, sessionRedirects)
      HyperDesignerLogger.info('OpenCode', '执行上下文压缩', { sessionId })
      try {
        const model = await resolveDefaultModel(ctx)
        await ctx.client.session.summarize({
          path: { id: resolvedSessionId },
          body: {
            providerID: model.providerID,
            modelID: model.modelID,
          },
        })
        HyperDesignerLogger.info('OpenCode', '上下文压缩完成', { sessionId })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        HyperDesignerLogger.error('OpenCode', '上下文压缩失败', err, {
          sessionId,
          action: 'summarizeSession',
          recovery: 'continueWithoutSummarize',
        })
      }
    },

    clearSession: async (sessionId: string): Promise<string> => {
      const title = buildClearedSessionTitle()
      HyperDesignerLogger.info('OpenCode', '执行上下文清空', { sessionId, title })
      const newSessionId = await ctx.client.session.create({
        body: { title },
        query: { directory: ctx.directory },
      }).then((result) => {
        const id = result.data?.id
        if (!id) {
          throw new Error(`Failed to create cleared session: ${title}`)
        }
        return id
      })

      sessionRedirects.set(sessionId, newSessionId)

      await getTuiPublisher(ctx).publish({
        directory: ctx.directory,
        body: {
          type: 'tui.session.select',
          properties: {
            sessionID: newSessionId,
          },
        },
      })

      HyperDesignerLogger.info('OpenCode', '上下文清空完成', { sessionId, newSessionId })
      return newSessionId
    },
  }
}

export function createOpenCodePlatformCapabilities(ctx: PluginInput): PlatformCapabilities {
  const adapter = createOpenCodeAdapter(ctx)

  return {
    native: {
      createSession: adapter.createSession,
      sendPrompt: adapter.sendPrompt,
      deleteSession: adapter.deleteSession,
      summarizeSession: adapter.summarizeSession,
    },
    composite: {
      clearSession: adapter.clearSession,
    },
    toAdapter: () => adapter,
  }
}
