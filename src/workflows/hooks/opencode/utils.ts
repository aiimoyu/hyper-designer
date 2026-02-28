/**
 * OpenCode 工作流钩子工具函数
 *
 * 提供占位符替换和模型解析等通用工具函数，
 #HJ| * 供 capabilities 和 index 模块共享使用。
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { HDConfig } from "../../../config/loader"
import { HyperDesignerLogger } from "../../../utils/logger"

export type PlaceholderResolver = {
  token: string
  resolve: () => string | null
}

export interface ModelInfo {
  providerID: string
  modelID: string
}

/**
 * 替换系统消息数组中的占位符令牌
 * @param systemMessages 系统消息数组（原地修改）
 * @param resolvers 占位符解析器列表
 */
export function replacePlaceholders(
  systemMessages: string[],
  resolvers: PlaceholderResolver[]
): void {
  for (const resolver of resolvers) {
    const needsReplacement = systemMessages.some(message => message.includes(resolver.token))
    if (!needsReplacement) {
      continue
    }

    const replacement = resolver.resolve()
    const safeReplacement = replacement ?? ""

    for (let index = 0; index < systemMessages.length; index += 1) {
      const message = systemMessages[index]
      if (message.includes(resolver.token)) {
        systemMessages[index] = message.split(resolver.token).join(safeReplacement)
      }
    }
  }
}

/**
 * 解析用于上下文压缩的模型信息
 *
 * 优先级：hd-config.summarize > 用户当前模型 > 默认模型 (opencode/big-pickle)
 *
 * @param ctx OpenCode 插件上下文
 * @param config Hyper Designer 配置
 * @returns 模型提供商 ID 和模型 ID
 */
export async function getDefaultModel(ctx: PluginInput, config: HDConfig): Promise<ModelInfo> {
  if (config.summarize) {
    const [providerID, ...rest] = config.summarize.split("/")
    return {
      providerID: providerID,
      modelID: rest.join("/"),
    }
  }

  const specified = await ctx.client.config.get().then(cfg => {
    const model = cfg.data?.model
    if (model) {
      const [providerID, ...rest] = model.split("/")
      return {
        providerID: providerID,
        modelID: rest.join("/"),
      }
    } else {
      return undefined
    }
  }).catch(error => {
    HyperDesignerLogger.warn("OpenCode", `加载用户配置的默认模型失败，已使用默认模型`, error)
    return undefined
  })

  if (specified) return specified

  return { providerID: "opencode", modelID: "big-pickle" }
}
