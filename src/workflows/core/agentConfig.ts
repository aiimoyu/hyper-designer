import { loadHDConfig } from '../../config/loader'

interface ModelConfig {
  providerID: string
  modelID: string
}

export interface AgentRuntimeConfig {
  model?: ModelConfig
  variant?: string
}

function parseModelString(modelString: string): ModelConfig | null {
  const parts = modelString.split('/')
  if (parts.length < 2) {
    return null
  }

  const providerID = parts[0]
  const modelID = parts.slice(1).join('/')

  return { providerID, modelID }
}

export function resolveAgentConfig(agentName: string): AgentRuntimeConfig {
  const config = loadHDConfig()
  const agentConfig = config.agents[agentName]
  const result: AgentRuntimeConfig = {}

  const modelString = agentConfig?.model ?? config.defaultModel
  if (modelString) {
    const modelConfig = parseModelString(modelString)
    if (modelConfig) {
      result.model = modelConfig
    }
  }

  if (agentConfig?.variant) {
    result.variant = agentConfig.variant
  }

  return result
}
