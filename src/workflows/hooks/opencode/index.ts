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

import {
  getWorkflowState,
  executeWorkflowHandover,
} from "../../core/state"
import { createWorkflowQualityGate } from "../../core/gate"
import { getHandoverAgent, getHandoverPrompt } from "../../core/handover"
import { loadWorkflowPrompt, loadStagePrompt } from "../../core/prompts"
import { loadHDConfig } from "../../../config/loader"
import { getWorkflowDefinition } from "../../core/registry"
import { HyperDesignerLogger } from "../../../utils/logger"
import { replacePlaceholders, type PlaceholderResolver } from "./utils"
import { createCapabilities } from "./platform-hooks"

export async function createWorkflowHooks(ctx: PluginInput) {
  const config = loadHDConfig()
  const workflow = getWorkflowDefinition(config.workflow || "classic")

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

  return {
    event: async ({ event }: { event: any }) => {
      const props = event.properties as Record<string, unknown> | undefined
      const sessionID = props?.sessionID as string | undefined

      if (!sessionID) return

      if (event.type === "session.idle") {
        const workflowState = getWorkflowState()

        if (workflowState && workflowState.handoverTo !== null) {
          const handoverPhase = workflowState.handoverTo
          const currentPhase = workflowState.currentStep

          const nextAgent = getHandoverAgent(workflow, handoverPhase)
          if (!nextAgent) {
            HyperDesignerLogger.error("OpenCode", `获取交接代理失败`, new Error(`Failed to get handover agent for phase: ${handoverPhase}`), {
              phase: handoverPhase,
              workflowId: workflow.id,
              action: "getHandoverAgent",
              recovery: "skipHandover"
            })
            return
          }

          const handoverContent = getHandoverPrompt(workflow, currentPhase, handoverPhase)
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

          // 创建平台能力对象，注入到 executeWorkflowHandover
          const capabilities = createCapabilities(ctx, config, sessionID)

          try {
            await executeWorkflowHandover(workflow, sessionID, capabilities)
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

      const workflowState = getWorkflowState()
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

    /** 执行当前阶段质量门（无参数，workflow 和 capabilities 已在此处绑定） */
    executeWorkflowQualityGate: () => createWorkflowQualityGate(workflow, gateCapabilities),
  }
}
