import type { Plugin } from "@opencode-ai/plugin";
import type { AgentConfig as OpencodeAgentConfig } from "@opencode-ai/sdk";
import type { AgentConfig as LocalAgentConfig } from "../../src/agents/types";
import { createBuiltinAgents } from "../../src/agents/utils";

const toOpencodeAgentConfig = (agent: LocalAgentConfig): OpencodeAgentConfig => {
  return {
    model: agent.model,
    temperature: agent.temperature,
    prompt: agent.prompt,
    tools: agent.tools,
    description: agent.description,
    mode: agent.mode,
    color: agent.color,
    permission: agent.permission,
  };
};

const toOpencodeAgents = (
  agents: Record<string, LocalAgentConfig>
): Record<string, OpencodeAgentConfig> => {
  return Object.fromEntries(
    Object.entries(agents).map(([key, agent]) => [key, toOpencodeAgentConfig(agent)])
  );
};

const HyperDesignerPlugin: Plugin = async () => {
  const agents = await createBuiltinAgents();
  const mappedAgents = toOpencodeAgents(agents);

  return {
    async config(config) {
      config.agent = {
        ...(config.agent ?? {}),
        ...mappedAgents,
      };
    },
  };
};

export default HyperDesignerPlugin;
