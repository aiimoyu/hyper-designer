/**
 * OpenCode 平台适配器
 *
 * 实现 PlatformAdapter 接口，将 hyper-designer 工作流操作映射到 OpenCode SDK 调用。
 * 所有操作接受显式 sessionId，无隐式绑定会话。
 */

import type { PluginInput } from '@opencode-ai/plugin'
import type { SessionPromptData } from '@opencode-ai/sdk'
import type { HDConfig } from '../../config/loader'
import type { PlatformAdapter, SendPromptParams, SendPromptResult } from '../types'
import { resolveDefaultModel } from './modelResolver'
import { HyperDesignerLogger } from '../../utils/logger'

// ── 内部辅助类型 ──────────────────────────────────────────────────────────────

type JsonSchema = {
  type: 'json_schema'
  schema: Record<string, unknown>
}

type PromptBodyWithFormat = NonNullable<SessionPromptData['body']> & {
  format?: JsonSchema
}

// ── 内部辅助函数 ──────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getStructuredOutput = (response: { data: { info?: unknown } | undefined }): unknown => {
  const data = response.data
  if (!data || !isRecord(data.info)) return undefined
  return data.info.structured_output
}

const extractTextFromParts = (parts: unknown): string => {
  if (!Array.isArray(parts)) return ''
  const textParts: string[] = []
  for (const part of parts) {
    if (isRecord(part) && part.type === 'text' && typeof part.text === 'string') {
      textParts.push(part.text)
    }
  }
  return textParts.join('\n')
}

// ── 工厂函数 ─────────────────────────────────────────────────────────────────

/**
 * 创建 OpenCode 平台适配器
 *
 * @param ctx OpenCode 插件上下文
 * @param config Hyper Designer 配置
 * @returns PlatformAdapter 实现
 */
export function createOpenCodeAdapter(ctx: PluginInput, config: HDConfig): PlatformAdapter {
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

    sendPrompt: async ({ sessionId, agent, text, schema }: SendPromptParams): Promise<SendPromptResult> => {
      const response = await ctx.client.session.prompt({
        path: { id: sessionId },
        body: {
          agent,
          noReply: false,
          parts: [{ type: 'text', text }],
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
      await ctx.client.session.delete({
        path: { id: sessionId },
        query: { directory: ctx.directory },
      })
    },

    summarizeSession: async (sessionId: string): Promise<void> => {
      HyperDesignerLogger.info('OpenCode', '执行上下文压缩', { sessionId })
      try {
        const model = await resolveDefaultModel(ctx, config)
        await ctx.client.session.summarize({
          path: { id: sessionId },
          body: {
            providerID: model.providerID,
            modelID: model.modelID,
          },
        })
        HyperDesignerLogger.info( 'OpenCode', '上下文压缩完成', { sessionId })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        HyperDesignerLogger.error('OpenCode', '上下文压缩失败', err, {
          sessionId,
          action: 'summarizeSession',
          recovery: 'continueWithoutSummarize',
        })
        // 压缩失败不中断工作流，继续执行
      }
    },
  }
}
