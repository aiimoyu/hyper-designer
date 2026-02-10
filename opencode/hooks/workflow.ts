import { PluginInput } from "@opencode-ai/plugin"
import {
  getWorkflowState,
  executeWorkflowHandover,
} from "../../src/workflow/state"
import { getHandoverAgent, getHandoverPrompt } from "../../src/workflow/handover"
import { loadPromptForStage } from "../../src/workflow/prompts"
import { loadHDConfig } from "../../src/config/loader"
import { getWorkflowDefinition } from "../../src/workflows/registry"

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

        if (workflowState.handoverTo !== null) {
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
      const currentStep = workflowState.currentStep

      if (currentStep) {
        try {
          const promptContent = loadPromptForStage(currentStep, workflow)
          if (promptContent) {
            output.system.push(promptContent)
          }
        } catch (error) {
          console.error(`Failed to load prompt for stage ${currentStep}:`, error)
        }
      }
    },
  }
}
