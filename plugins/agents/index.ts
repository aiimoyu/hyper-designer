import type { AgentConfig, AgentPluginRegistration } from '../../src/sdk/contracts'

export const userExampleAgentPlugin: AgentPluginRegistration = {
  name: 'UserExampleAgent',
  factory: () => {
    const config: AgentConfig = {
      name: 'UserExampleAgent',
      description: 'Minimal user-defined agent plugin example',
      mode: 'subagent',
      prompt: 'You are a user example agent plugin.',
    }
    return config
  },
}

export const USER_AGENT_PLUGINS: AgentPluginRegistration[] = [
  userExampleAgentPlugin,
]
