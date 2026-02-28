/**
 * OpenCode 工作流钩子模块
 *
 * 提供与 OpenCode 平台集成的工作流钩子，包括：
 * 1. 事件处理：监听会话空闲事件，执行工作流交接
 * 2. 系统消息转换：替换工作流相关的占位符令牌
 * 3. 平台能力注入：通过 createCapabilities 创建基础能力，
 *    传入门禁 creator，核心层保持框架无关
 */

import { PluginInput } from "@opencode-ai/plugin"

import { workflowService } from "../../core/WorkflowService"
import { loadWorkflowPrompt, loadStagePrompt } from "../../core/prompts"
import { loadHDConfig } from "../../../config/loader"
import { HyperDesignerLogger } from "../../../utils/logger"
import { replacePlaceholders, type PlaceholderResolver } from "./utils"
import { createCapabilities } from "../../../adapters/opencode"

export async function createWorkflowHooks(ctx: PluginInput) {
  const config = loadHDConfig()
  const workflow = workflowService.getDefinition()

  if (!workflow) {
    HyperDesignerLogger.error("OpenCode", `加载工作流失败`, new Error(`Failed to load workflow: ${config.workflow || "classic"}`), {
      workflowId: config.workflow || "classic",
      action: "loadWorkflowDefinition",
      recovery: "returnEmptyHooks"
    })

    return {
      event: async () => { },
      "experimental.chat.system.transform": async () => { },
      executeWorkflowQualityGate: async () => ({
        ok: false as const,
        reason: "runtime_error" as const,
        message: "Workflow definition not found.",
      }),
    }
  }

  const prompt = async (sessionID: string, agent: string, content: string) => {
    await ctx.client.session.prompt({
      path: { id: sessionID },
      body: {
        agent: agent,
        noReply: false,
        parts: [{ type: "text", text: content }],
      },
      query: { directory: ctx.directory },
    })
  }

  // 门禁所需的平台能力（不含 sessionID）
  const gateCapabilities = createCapabilities(ctx, config)

  // 注册 WorkflowService 事件监听器（用于可观测性）
  workflowService.on('handoverExecuted', ({ fromStep, toStep }: { fromStep: string; toStep: string }) => {
    HyperDesignerLogger.info('Hooks', `Handover completed: ${fromStep || '(none)'} → ${toStep}`)
  })

  workflowService.on('stageCompleted', ({ stageName, isCompleted }: { stageName: string; isCompleted: boolean }) => {
    HyperDesignerLogger.info('Hooks', `Stage ${stageName} ${isCompleted ? 'completed' : 'uncompleted'}`)
  })


  return {
    event: async ({ event }: { event: any }) => {
      const props = event.properties as Record<string, unknown> | undefined
      const sessionID = props?.sessionID as string | undefined

      if (!sessionID) return

      if (event.type === "session.idle") {
        const workflowState = workflowService.getState()

        if (workflowState && workflowState.handoverTo !== null) {
          const handoverPhase = workflowState.handoverTo
          const currentPhase = workflowState.currentStep

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

          // 创建平台能力对象，注入到 workflowService.executeHandover
          const capabilities = createCapabilities(ctx, config, sessionID)

          try {
            await workflowService.executeHandover(sessionID, capabilities)
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

          await prompt(sessionID, nextAgent, handoverContent)
        }
      }
    },
    "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {

      const workflowState = workflowService.getState()
      const placeholderResolvers: PlaceholderResolver[] = [
        {
          token: "{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}",
          resolve: () => {
            return loadWorkflowPrompt(workflow)
          },
        },
        {
          token: "{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}",
          resolve: () => {
            const currentStep = workflowState?.currentStep || null
            return loadStagePrompt(currentStep, workflow)
          },
        },
      ]

      replacePlaceholders(output.system, placeholderResolvers)
    },

    /** 执行当前阶段质量门（无参数，capabilities 已在此处绑定） */
    executeWorkflowQualityGate: () => workflowService.executeQualityGate(gateCapabilities),
  }
}
