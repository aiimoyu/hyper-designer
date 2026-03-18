import type { WorkflowState } from '../workflows/core/state/types'

export function resolveAgentForMessage(inputAgent: string | undefined, state: WorkflowState | null): string | null {
  if (inputAgent !== 'Hyper') {
    return null
  }

  const currentNodeId = state?.runtime?.flow?.currentNodeId
  if (!currentNodeId) {
    return state?.current?.agent ?? null
  }

  const nodePlan = state?.instance?.nodePlan
  if (!nodePlan) {
    return state?.current?.agent ?? null
  }

  const currentNode = nodePlan[currentNodeId]
  if (!currentNode || !currentNode.agent) {
    return state?.current?.agent ?? null
  }

  return currentNode.agent
}
