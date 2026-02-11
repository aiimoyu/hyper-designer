import { PluginInput } from "@opencode-ai/plugin"
import {
  getWorkflowState,
  executeWorkflowHandover,
} from "../../core/state"
import { getHandoverAgent, getHandoverPrompt } from "../../core/handover"
import { loadWorkflowPrompt, loadStagePrompt } from "../../core/prompts"
import { loadHDConfig } from "../../../config/loader"
import { getWorkflowDefinition } from "../../core/registry"

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

export async function createWorkflowHooks(ctx: PluginInput) {
  const config = loadHDConfig()
  const workflow = getWorkflowDefinition(config.workflow || "classic")

  if (!workflow) {
    console.error(`[ERROR] Failed to load workflow: ${config.workflow || "classic"}`)
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
            console.error(`[ERROR] Failed to get handover agent for phase: ${handoverPhase}`)
            return
          }

          const handoverContent = getHandoverPrompt(workflow!, currentPhase, handoverPhase)
          if (!handoverContent) {
            console.error(`[ERROR] Failed to get handover prompt for phase: ${handoverPhase}`)
            return
          }

          executeWorkflowHandover(workflow!)
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
