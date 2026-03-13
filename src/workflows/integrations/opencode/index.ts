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
import { loadHDConfig } from "../../../config/loader"
import { HyperDesignerLogger } from "../../../utils/logger"
import { createEventHandler } from "./event-handler"
import { createSystemTransformer } from "./system-transform"

export { replacePlaceholders, type PlaceholderResolver } from "./utils"
export {
  HD_TOOL_PLACEHOLDERS,
  OPENCODE_TOOL_MAPPING,
  replaceToolPlaceholders,
  createToolTransformer,
  type ToolNameMapping,
  type HdToolPlaceholder,
} from "./tool-transform"

export { convertWorkflowToolsToOpenCode } from './workflow-tools'

/**
 * 创建 OpenCode 平台集成钩子
 *
 * @param ctx OpenCode 插件上下文
 * @returns 平台集成钩子对象
 */
export async function createWorkflowHooks(ctx: PluginInput) {
  const config = loadHDConfig()

  // 注册 WorkflowService 事件监听器（用于可观测性）
  workflowService.on('handoverExecuted', ({ fromStep, toStep }: { fromStep: string; toStep: string }) => {
    HyperDesignerLogger.info('Integrations', `Handover completed: ${fromStep || '(none)'} → ${toStep}`)
  })

  workflowService.on('stageCompleted', ({ stageName, isCompleted }: { stageName: string; isCompleted: boolean }) => {
    HyperDesignerLogger.info('Integrations', `Stage ${stageName} ${isCompleted ? 'completed' : 'uncompleted'}`)
  })

  if (!workflowService.getDefinition()) {
    HyperDesignerLogger.warn('OpenCode', '工作流未初始化，进入 fallback 模式，等待 hd_workflow_select。', {
      configuredWorkflow: config.workflow || 'classic',
      action: 'createWorkflowHooks',
      mode: 'fallback',
    })
  }

  return {
    /** 事件处理器：监听 session.idle 触发工作流交接 */
    event: createEventHandler(ctx),

    /** 系统消息转换器：注入工作流提示词并替换工具名称占位符 */
    "experimental.chat.system.transform": createSystemTransformer(),
  }
}
