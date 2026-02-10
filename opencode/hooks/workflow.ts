import { PluginInput } from "@opencode-ai/plugin";
import {
  getWorkflowState,
  executeWorkflowHandover,
} from "../../src/workflow/state";
import { HANDOVER_CONFIG } from "../../src/workflow/handover";
import { loadPromptForStage } from "../../src/workflow/prompts";

export async function createWorkflowHooks(ctx: PluginInput) {
  const prompt = async (sessionID: string, agent: string, content: string) => {
    await ctx.client.session.prompt({
      path: { id: sessionID },
      body: {
        agent: agent,
        noReply: false,
        parts: [{ type: "text", text: content }],
      },
      query: { directory: ctx.directory },
    });
  };

  return {
    event: async ({ event }: { event: any }) => {
      const props = event.properties as Record<string, unknown> | undefined;
      const sessionID = props?.sessionID as string | undefined;
      if (!sessionID) return;

      if (event.type === "session.idle") {
        const workflowState = getWorkflowState();

        if (workflowState.handoverTo !== null) {
          const handoverPhase = workflowState.handoverTo;
          const currentPhase = workflowState.currentStep;
          const config = HANDOVER_CONFIG[handoverPhase];

          if (config) {
            let handoverContent = config.getPrompt(currentPhase, handoverPhase);

            await prompt(sessionID, config.agent, handoverContent);
            executeWorkflowHandover();
          }
        }
      }
    },
    "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {
      const workflowState = getWorkflowState();
      const currentStep = workflowState.currentStep;

      if (currentStep) {
        const promptContent = loadPromptForStage(currentStep);
        if (promptContent) {
          output.system.push(promptContent);
        }
      }
    },
  };
}
