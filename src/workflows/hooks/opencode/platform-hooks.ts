/**
 * OpenCode 平台能力对象工厂
 *
 * 提供 createCapabilities 函数，将 OpenCode 平台 API 封装为
 * StageHookCapabilities 接口，供 classic workflow hooks 调用。
 *
 * 通过能力注入（capabilities injection）保持核心 hooks 框架无关，
 * 平台相关代码集中在此模块，便于后续扩展到其他 AI 框架。
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { StageHookCapabilities } from "../../core/types"
import type { HDConfig } from "../../../config/loader"
import { getDefaultModel } from "./utils"
import { HyperDesignerLogger } from "../../../utils/logger"

/**
 * 创建 OpenCode 平台能力对象
 *
 * 封装 OpenCode session.prompt 和 session.summarize API，
 * 返回 StageHookCapabilities 供 workflow hooks 使用。
 *
 * @param ctx OpenCode 插件上下文
 * @param config Hyper Designer 配置
 * @param sessionID 当前会话 ID
 * @returns StageHookCapabilities 平台能力对象
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
