/**
 * OpenCode 平台基础能力工厂
 *
 * 提供 createCapabilities，封装所有 OpenCode 平台原语：
 * - prompt / summarize：操作当前（已绑定）会话
 * - session.create / session.prompt / session.delete：session 原语，供门禁等组合使用
 *
 * 仅包含基础能力，门禁逻辑等组合能力不在此处定义（见 core/gate.ts）。
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { StageHookCapabilities } from '../../workflows/core'
import type { SessionPromptData } from "@opencode-ai/sdk"
import type { HDConfig } from "../../config/loader"
import { getDefaultModel } from "./model-utils"
import { HyperDesignerLogger } from "../../utils/logger"

type JsonSchema = {
  type: "json_schema"
  schema: Record<string, unknown>
}

type PromptBodyWithFormat = NonNullable<SessionPromptData["body"]> & {
  format?: JsonSchema
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null
}

const getStructuredOutput = (response: { data: { info?: unknown } | undefined }): unknown => {
  const data = response.data
  if (!data || !isRecord(data.info)) {
    return undefined
  }
  return data.info.structured_output
}

const extractTextFromParts = (parts: unknown): string => {
  if (!Array.isArray(parts)) {
    return ""
  }
  const textParts: string[] = []
  for (const part of parts) {
    if (!isRecord(part)) {
      continue
    }
    if (part.type === "text" && typeof part.text === "string") {
      textParts.push(part.text)
    }
  }
  return textParts.join("\n")
}

/**
 * 创建 OpenCode 平台基础能力对象
 *
 * 包含两类原语：
 * 1. prompt / summarize：绑定到 sessionID 的当前会话操作（sessionID 可选）
 * 2. session.create / session.prompt / session.delete：非绑定 session 原语，
 *    供门禁等需要创建隔离会话的场景使用
 *
 * @param ctx OpenCode 插件上下文
 * @param config Hyper Designer 配置
 * @param sessionID 当前会话 ID（可选；提供时才注入 prompt / summarize）
 * @returns StageHookCapabilities 基础能力对象
 */
export function createCapabilities(
  ctx: PluginInput,
  config: HDConfig,
  sessionID?: string,
): StageHookCapabilities {
  const capabilities: StageHookCapabilities = {
    // ── session 原语（非绑定） ────────────────────────────────────────────────
    session: {
      create: async (title: string) => {
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

      prompt: async ({ sessionId, agent, text, schema }) => {
        const response = await ctx.client.session.prompt({
          path: { id: sessionId },
          body: {
            agent,
            noReply: false,
            parts: [{ type: "text", text }],
            ...(schema !== undefined ? { format: { type: "json_schema", schema } } : {}),
          } as PromptBodyWithFormat,
          query: { directory: ctx.directory },
        })
        return {
          structuredOutput: getStructuredOutput(response),
          text: extractTextFromParts(response.data?.parts),
        }
      },

      delete: async (sessionId: string) => {
        await ctx.client.session.delete({
          path: { id: sessionId },
          query: { directory: ctx.directory },
        })
      },
    },
  }

  // ── 绑定会话操作（仅在提供 sessionID 时注入） ──────────────────────────────
  if (sessionID !== undefined) {
    capabilities.prompt = async (agent: string, text: string) => {
      await ctx.client.session.prompt({
        path: { id: sessionID },
        body: {
          agent,
          noReply: false,
          parts: [{ type: "text", text }],
        },
        query: { directory: ctx.directory },
      })
    }

    capabilities.summarize = async () => {
      HyperDesignerLogger.info("OpenCode", `执行上下文压缩`, { sessionID })

      try {
        const model = await getDefaultModel(ctx, config)
        await ctx.client.session.summarize({
          path: { id: sessionID },
          body: {
            providerID: model.providerID,
            modelID: model.modelID,
          },
        })
        HyperDesignerLogger.debug("OpenCode", `上下文压缩完成`, { sessionID })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        HyperDesignerLogger.error("OpenCode", `上下文压缩失败`, err, {
          sessionID,
          action: "summarize",
          recovery: "continueWithoutSummarize",
        })
        // 压缩失败不中断工作流，继续执行
      }
    }
  }

  return capabilities
}