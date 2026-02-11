import { PluginInput } from "@opencode-ai/plugin"
import {
  getWorkflowState,
  executeWorkflowHandover,
} from "../../state"
import { getHandoverAgent, getHandoverPrompt } from "../../handover"
import { loadPromptForStage } from "../../prompts"
import { loadHDConfig } from "../../../config/loader"
import { getWorkflowDefinition } from "../../registry"

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
    if (replacement === null) {
      continue
    }

    for (let index = 0; index < systemMessages.length; index += 1) {
      const message = systemMessages[index]
      if (message.includes(resolver.token)) {
        systemMessages[index] = message.split(resolver.token).join(replacement)
      }
    }
  }
}

export async function createWorkflowHooks(ctx: PluginInput) {
  const config = loadHDConfig()
  const workflow = getWorkflowDefinition(config.workflow || "traditional")

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

          const nextAgent = getHandoverAgent(workflow, handoverPhase)
          const handoverContent = getHandoverPrompt(workflow, currentPhase, handoverPhase)

          await prompt(sessionID, nextAgent, handoverContent)
          executeWorkflowHandover(workflow)
        }
      }
    },
    "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {

      const workflowState = getWorkflowState()
      const placeholderResolvers: PlaceholderResolver[] = [
        {
          token: "{HYPER_DESIGNER_WORKFLOW_PROMPT}",
          resolve: () => {
            const currentStep = workflowState?.currentStep || null
            try {
              return loadPromptForStage(currentStep, workflow)
            } catch (error) {
              console.error(`Failed to load prompt for stage ${currentStep ?? "(none)"}:`, error)
              return null
            }
          },
        },
      ]

      replacePlaceholders(output.system, placeholderResolvers)
    },
  }
}
