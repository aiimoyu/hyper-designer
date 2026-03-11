/**
 * 事件处理器
 *
 * 监听 OpenCode 平台事件（如 session.idle），触发工作流交接。
 */

import type { PluginInput } from "@opencode-ai/plugin"
import { workflowService } from "../../core/service"
import { createOpenCodeAdapter } from "../../../adapters/opencode"
import { HyperDesignerLogger } from "../../../utils/logger"

/**
 * 创建事件处理器
 *
 * @param ctx OpenCode 插件上下文
 * @returns 事件处理函数
 */
export function createEventHandler(ctx: PluginInput) {
  return async ({ event }: { event: any }) => {
    const props = event.properties as Record<string, unknown> | undefined
    const sessionID = props?.sessionID as string | undefined

    if (!sessionID) return

    if (event.type === "session.idle") {
      const workflowState = workflowService.getState()
      const workflow = workflowService.getDefinition()

      if (workflowState && workflowState.current?.handoverTo && workflowState.current !== null && !workflowService.isHandoverInProgress() && workflow) {
        const handoverPhase = workflowState.current.handoverTo
        const currentPhase = workflowState.current.name

        const nextAgent = workflowService.getHandoverAgent(handoverPhase)
        if (!nextAgent) {
          HyperDesignerLogger.error("OpenCode", `获取交接代理失败`, new Error(`Failed to get handover agent for phase: ${handoverPhase}`), {
            phase: handoverPhase,
            workflowId: workflow.id,
            action: "getHandoverAgent",
            recovery: "skipHandover"
          })
          return
        }

        const handoverContent = workflowService.getHandoverPrompt(currentPhase, handoverPhase)
        if (!handoverContent) {
          HyperDesignerLogger.error("OpenCode", `获取交接提示词失败`, new Error(`Failed to get handover prompt for phase: ${handoverPhase}`), {
            phase: handoverPhase,
            currentPhase,
            workflowId: workflow.id,
            action: "getHandoverPrompt",
            recovery: "skipHandover"
          })
          return
        }

        HyperDesignerLogger.info("OpenCode", `工作流交接：从阶段 ${currentPhase || "无"} 到阶段 ${handoverPhase}，由代理 ${nextAgent} 处理。`)

        // 创建平台适配器，注入到 workflowService.executeHandover
        const adapter = createOpenCodeAdapter(ctx)

        try {
          await workflowService.executeHandover(sessionID, adapter)
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          HyperDesignerLogger.error("OpenCode", `工作流交接执行失败`, err, {
            phase: handoverPhase,
            currentPhase,
            workflowId: workflow.id,
            action: "executeWorkflowHandover",
            recovery: "skipPrompt"
          })
          return
        }

        // 发送交接提示词
        await adapter.sendPrompt({ sessionId: sessionID, agent: nextAgent, text: handoverContent })
      }
    }
  }
}
