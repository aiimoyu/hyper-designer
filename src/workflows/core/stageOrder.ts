import type { StageTransitionDefinition, WorkflowDefinition } from './types'

export function getStageOrder(definition: WorkflowDefinition): string[] {
  const visited = new Set<string>()
  const order: string[] = []

  const walk = (stageId: string): void => {
    if (visited.has(stageId) || !definition.stages[stageId]) {
      return
    }
    visited.add(stageId)
    order.push(stageId)

    const transitions: StageTransitionDefinition[] = definition.stages[stageId].transitions ?? []
    const autoTransitions = [...transitions]
      .filter(item => item.mode === 'auto')
      .sort((a, b) => a.priority - b.priority)

    for (const transition of autoTransitions) {
      walk(transition.toStageId)
    }
  }

  if (typeof definition.entryStageId === 'string') {
    walk(definition.entryStageId)
  }

  for (const stageId of Object.keys(definition.stages)) {
    if (!visited.has(stageId)) {
      walk(stageId)
    }
  }

  return order
}
