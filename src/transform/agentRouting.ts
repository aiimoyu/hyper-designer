import type { WorkflowState } from '../workflows/state/types'
import { resolveAgentConfig } from '../workflows/agentConfig'

export interface NodeRuntimeConfig {
  agent: string
  model?: {
    providerID: string
    modelID: string
  }
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
