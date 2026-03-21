/**
 * Hyper Designer SDK
 *
 * 提供统一的 SDK 接口，用于访问插件核心能力。
 *
 * 使用方式：
 * 1. 显式初始化：调用 bootstrapSDK() 进行初始化
 * 2. 访问 facade：通过 sdk 对象访问 agent/workflow/tool 能力
 *
 * 注意：SDK 不再自动执行 bootstrap，需要调用者显式调用 bootstrapSDK()。
 */

export * from './contracts'
export { sdk, workflowService, HyperDesignerLogger } from './facade'
export type { ToolDefinition, ToolContext } from '../tools/types'
export { bootstrapSDK, isSDKBootstrapped, resetSDKBootstrapForTest, type SDKBootstrapOptions } from './bootstrap'
export { bootstrapPluginRegistries, type PluginBootstrapOptions } from './pluginBootstrap'
export {
  buildPluginRegistrations,
  defineHyperDesignerPlugin,
  toAgentPluginRegistrations,
  toToolPluginRegistrations,
  toWorkflowPluginRegistrations,
} from '../plugin'
export { createHyperAgent } from '../agents/Hyper'
export { initLogger } from '../utils/logger'
