export {
  registerAgent as registerAgentPlugin,
  registerAgents as registerAgentPlugins,
  getAgentNames as getAgentPluginNames,
  createAgents as createPluginAgents,
  clearAgentsForTest as clearAgentPluginsForTest,
  isPluginBootstrapped as isAgentPluginsBootstrapped,
  resetBootstrapForTest as resetAgentPluginBootstrapForTest,
} from '../plugin/registry'

export type { AgentPluginFactory, AgentPluginRegistration } from '../types'
