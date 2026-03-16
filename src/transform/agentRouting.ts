import type { WorkflowState } from '../workflows/core/state/types'

export function resolveAgentForMessage(inputAgent: string | undefined, state: WorkflowState | null): string | null {
  if (inputAgent !== 'Hyper') {
    return null
  }
  return state?.current?.agent ?? null
}
