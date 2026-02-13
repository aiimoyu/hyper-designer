/**
 * OpenCode 工作流钩子模块
 * 
 * 提供与 OpenCode 平台集成的工作流钩子，包括：
 * 1. 事件处理：监听会话空闲事件，执行工作流交接
 * 2. 系统消息转换：替换工作流相关的占位符令牌
 * 3. 与 Hyper Designer 配置和工作流系统集成
 */

import { PluginInput } from "@opencode-ai/plugin"

import {
  getWorkflowState,
  executeWorkflowHandover,
} from "../../core/state"
import { getHandoverAgent, getHandoverPrompt } from "../../core/handover"
import { loadWorkflowPrompt, loadStagePrompt } from "../../core/prompts"
import { loadHDConfig, type HDConfig } from "../../../config/loader"
import { getWorkflowDefinition } from "../../core/registry"
import { HyperDesignerLogger } from "../../../utils/logger"

type PlaceholderResolver = {
  token: string
  resolve: () => string | null
}

function replacePlaceholders(
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

interface ModelInfo {
  providerID: string
  modelID: string
}

async function getSummarizeModel(ctx: PluginInput, config: HDConfig): Promise<ModelInfo> {
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

  const summarize = async (sessionID: string) => {
    const model = await getSummarizeModel(ctx, config)
    await ctx.client.session.summarize({
      path: { id: sessionID },
      body: {
        providerID: model.providerID,
        modelID: model.modelID
      }
    })
  }

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

          const nextAgent = getHandoverAgent(workflow!, handoverPhase)
          if (!nextAgent) {
            HyperDesignerLogger.error("OpenCode", `获取交接代理失败`, new Error(`Failed to get handover agent for phase: ${handoverPhase}`), {
              phase: handoverPhase,
              workflowId: workflow!.id,
              action: "getHandoverAgent",
              recovery: "skipHandover"
            })
            return
          }

          const handoverContent = getHandoverPrompt(workflow!, currentPhase, handoverPhase)
          if (!handoverContent) {
            HyperDesignerLogger.error("OpenCode", `获取交接提示词失败`, new Error(`Failed to get handover prompt for phase: ${handoverPhase}`), {
              phase: handoverPhase,
              currentPhase,
              workflowId: workflow!.id,
              action: "getHandoverPrompt",
              recovery: "skipHandover"
            })
            return
          }

          executeWorkflowHandover(workflow!)

          const currentStage = currentPhase ? workflow!.stages[currentPhase] : null
          if (currentStage?.summarize === true) {
            await summarize(sessionID)
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
            return loadWorkflowPrompt(workflow!)
          },
        },
        {
          token: "{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}",
          resolve: () => {
            const currentStep = workflowState?.currentStep || null
            return loadStagePrompt(currentStep, workflow!)
          },
        },
      ]

      replacePlaceholders(output.system, placeholderResolvers)
    },
  }
}
