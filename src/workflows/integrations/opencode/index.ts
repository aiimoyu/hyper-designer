/**
 * OpenCode 平台集成模块
 *
 * 提供与 OpenCode 平台的完整集成，包括：
 * 1. 事件处理：监听会话空闲事件，执行工作流交接
 * 2. 系统消息转换：替换工作流相关的占位符令牌
 * 3. 工具名称转换：替换 HD_TOOL_* 占位符为平台实际工具名
 *
 * 架构说明：
 * - adapters/types.ts 定义平台无关的 PlatformAdapter 接口
 * - adapters/opencode/ 提供 OpenCode 的 PlatformAdapter 实现
 * - integrations/opencode/ 组合 adapter 实现工作流集成逻辑
 */

import type { PluginInput } from "@opencode-ai/plugin"

import { workflowService } from "../../core/service"
import { createOpenCodePlatformCapabilities } from '../../../platformBridge/capabilities/opencode'
import { createWorkflowHooks as createBridgeWorkflowHooks } from '../../../platformBridge/opencode/workflows'

export { convertWorkflowToolsToOpenCode } from './workflow-tools'

/**
 * 创建 OpenCode 平台集成钩子
 *
 * @param ctx OpenCode 插件上下文
 * @returns 平台集成钩子对象
 */
export async function createWorkflowHooks(ctx: PluginInput) {
  const capabilities = createOpenCodePlatformCapabilities(ctx)
  return createBridgeWorkflowHooks(ctx, workflowService, capabilities)
}
