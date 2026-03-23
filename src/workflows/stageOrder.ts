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

export function resolveNextSelectedStage(
  definition: WorkflowDefinition,
  selectedSet: Set<string>,
  fromStageId: string,
): string | null {
  const visited = new Set<string>()
  let current: string | null = fromStageId

  while (current !== null) {
    if (visited.has(current)) {
      throw new Error(`Detected transition cycle while resolving next stage from ${fromStageId}`)
    }
    visited.add(current)

    const stage = definition.stages[current]
    if (!stage) {
      return null
    }

    const transitions: StageTransitionDefinition[] = stage.transitions ?? []
    const nextTransition = [...transitions]
      .filter(item => item.mode === 'auto')
      .sort((a, b) => a.priority - b.priority)[0]

    if (!nextTransition) {
      return null
    }

    const candidate = nextTransition.toStageId
    if (selectedSet.has(candidate)) {
      return candidate
    }
    current = candidate
  }

  return null
}
