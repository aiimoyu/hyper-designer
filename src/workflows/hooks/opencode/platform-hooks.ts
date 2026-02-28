/**
 * OpenCode 平台能力对象工厂
 *
 * 提供两类创建函数：
 * 1. createCapabilities — 基础能力（prompt / summarize），供 workflow hooks 使用
 * 2. createQualityGateReviewer — 质量门评审执行函数，封装 session.create / prompt / delete，
 *    属于基础能力的组合，供 executeWorkflowQualityGate 调用
 *
 * 通过能力注入（capabilities injection）保持核心 hooks 框架无关，
 * 平台相关代码集中在此模块，便于后续扩展到其他 AI 框架。
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { StageHookCapabilities } from "../../core/types"
import type { QualityGateReviewFn } from "../../core/gate"
import type { SessionPromptData } from "@opencode-ai/sdk"
import type { HDConfig } from "../../../config/loader"
import { DEFAULT_REVIEW_SCHEMA } from "../../core/gate"
import { getDefaultModel } from "./utils"
import { HyperDesignerLogger } from "../../../utils/logger"

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
 * 仅封装基础操作：向当前会话发送 prompt、压缩会话上下文。
 * 质量门评审（reviewQualityGate）不属于基础能力，见 createQualityGateReviewer。
 *
 * @param ctx OpenCode 插件上下文
 * @param config Hyper Designer 配置
 * @param sessionID 当前会话 ID
 * @returns StageHookCapabilities 基础能力对象
 */
export function createCapabilities(
  ctx: PluginInput,
  config: HDConfig,
  sessionID: string
): StageHookCapabilities {
  return {
    prompt: async (agent: string, text: string) => {
      await ctx.client.session.prompt({
        path: { id: sessionID },
        body: {
          agent,
          noReply: false,
          parts: [{ type: "text", text }],
        },
        query: { directory: ctx.directory },
      })
    },

    summarize: async () => {
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
    },
  }
}

/**
 * 创建质量门评审执行函数
 *
 * 封装 session.create / session.prompt / session.delete 的完整流程，
 * 在隔离会话中调用 HCritic 执行阶段评审并返回结构化结果。
 *
 * @param ctx OpenCode 插件上下文
 * @returns QualityGateReviewFn 评审函数
 */
export function createQualityGateReviewer(ctx: PluginInput): QualityGateReviewFn {
  return async ({ stageKey, prompt, schema }) => {
    let reviewSessionID: string | undefined
    try {
      const reviewSession = await ctx.client.session.create({
        body: { title: `HCritic Review: ${stageKey}` },
        query: { directory: ctx.directory },
      })
      reviewSessionID = reviewSession.data?.id
      if (!reviewSessionID) {
        throw new Error("Failed to create isolated review session")
      }

      const reviewResponse = await ctx.client.session.prompt({
        path: { id: reviewSessionID },
        body: {
          agent: "HCritic",
          noReply: false,
          parts: [{ type: "text", text: prompt }],
          format: {
            type: "json_schema",
            schema: schema ?? DEFAULT_REVIEW_SCHEMA,
          },
        } as PromptBodyWithFormat,
        query: { directory: ctx.directory },
      })

      return {
        structuredOutput: getStructuredOutput(reviewResponse),
        text: extractTextFromParts(reviewResponse.data?.parts),
      }
    } finally {
      if (reviewSessionID) {
        try {
          await ctx.client.session.delete({
            path: { id: reviewSessionID },
            query: { directory: ctx.directory },
          })
        } catch {
          // ignore cleanup failure
        }
      }
    }
  }
}
