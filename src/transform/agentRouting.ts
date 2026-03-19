import type { WorkflowState } from '../workflows/core/state/types'
import { loadHDConfig } from '../config/loader'

interface ModelConfig {
  providerID: string
  modelID: string
}

export interface NodeRuntimeConfig {
  agent: string
  model?: ModelConfig
  variant?: string
}

export interface AgentRuntimeConfig {
  model?: ModelConfig
  variant?: string
}

export function resolveNodeConfig(inputAgent: string | undefined, state: WorkflowState | null): NodeRuntimeConfig | null {
  if (inputAgent !== 'Hyper') {
    return null
  }

  const currentNodeId = state?.runtime?.flow?.currentNodeId
  const nodePlan = state?.instance?.nodePlan

  // 从 nodePlan 获取当前节点配置
  if (currentNodeId && nodePlan) {
    const currentNode = nodePlan[currentNodeId]
    if (currentNode?.agent) {
      return {
        agent: currentNode.agent,
        ...(currentNode.model ? { model: currentNode.model } : {}),
        ...(currentNode.variant ? { variant: currentNode.variant } : {}),
      }
    }
  }

  // 回退到 current.agent
  const fallbackAgent = state?.current?.agent
  if (fallbackAgent) {
    const agentConfig = resolveAgentConfig(fallbackAgent)
    return {
      agent: fallbackAgent,
      ...agentConfig,
    }
  }

  return null
}

export function resolveAgentConfig(agentName: string): AgentRuntimeConfig {
  const config = loadHDConfig()
  const agentConfig = config.agents[agentName]
  const result: AgentRuntimeConfig = {}
  
  // 优先级 1: agent 特定配置中的 model
  // 优先级 2: 全局 defaultModel 配置
  const modelString = agentConfig?.model ?? config.defaultModel
  if (modelString) {
    const modelConfig = parseModelString(modelString)
    if (modelConfig) {
      result.model = modelConfig
    }
  }
  
  // variant 只从 agent 特定配置获取
  if (agentConfig?.variant) {
    result.variant = agentConfig.variant
  }
  
  return result
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
