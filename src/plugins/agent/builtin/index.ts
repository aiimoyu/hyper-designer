import { createHAnalysisAgent } from '../../../agents/HAnalysis'
import { createHArchitectAgent } from '../../../agents/HArchitect'
import { createHCollectorAgent } from '../../../agents/HCollector'
import { createHCriticAgent } from '../../../agents/HCritic'
import { createHEngineerAgent } from '../../../agents/HEngineer'
import type { AgentPluginRegistration } from '../types'

export const BUILTIN_AGENT_PLUGINS: AgentPluginRegistration[] = [
  {
    name: 'HCollector',
    factory: model => createHCollectorAgent(model),
  },
  {
    name: 'HArchitect',
    factory: model => createHArchitectAgent(model),
  },
  {
    name: 'HCritic',
    factory: model => createHCriticAgent(model),
  },
  {
    name: 'HEngineer',
    factory: model => createHEngineerAgent(model),
  },
  {
    name: 'HAnalysis',
    factory: model => createHAnalysisAgent(model),
  },
]
