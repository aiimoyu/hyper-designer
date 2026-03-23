import type { AgentPluginRegistration } from '../../types'

import { createHAnalysisAgent } from './HAnalysis'
import { createHArchitectAgent } from './HArchitect'
import { createHCollectorAgent } from './HCollector'
import { createHCriticAgent } from './HCritic'
import { createHEngineerAgent } from './HEngineer'

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
