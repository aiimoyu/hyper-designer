/**
 * OpenCode 模型工具函数
 *
 * 提供模型解析和配置获取功能，用于上下文压缩等平台能力。
 * 移动到 adapters 层避免循环依赖（原位置：workflows/hooks/opencode/utils.ts）
 */

import type { PluginInput } from "@opencode-ai/plugin"
import type { HDConfig } from "../../config/loader"
import { HyperDesignerLogger } from "../../utils/logger"

export interface ModelInfo {
  providerID: string
  modelID: string
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