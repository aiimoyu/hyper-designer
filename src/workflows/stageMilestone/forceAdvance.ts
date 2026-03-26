import type { WorkflowDefinition } from '../types'
import type { WorkflowState } from '../state/types'
import { HyperDesignerLogger } from '../../utils/logger'
import { getStageOrder } from '../stageOrder'

export function forceAdvanceToNextSelectedStage(
  state: WorkflowState,
  definition: WorkflowDefinition,
): WorkflowState | { error: string; reason: string } {
  if (!state.initialized || state.current === null || state.current.name === null) {
    return {
      error: 'Cannot force next step before workflow is initialized and current stage is set.',
      reason: 'workflow not initialized or current stage missing',
    }
  }

  const currentStage = state.current.name
  const failureCountBefore = state.current.failureCount ?? 0
  if (failureCountBefore < 3) {
    return {
      error: `Force-next-step denied: failureCount threshold not met (${failureCountBefore}/3).`,
      reason: `failureCount ${failureCountBefore} is below required threshold 3`,
    }
  }

  const expectedNextStage = state.workflow[currentStage]?.nextStage ?? null
  if (expectedNextStage === null) {
    return {
      error: 'Force-next-step denied: no next selected stage available from current stage.',
      reason: 'current stage has no next selected stage',
    }
  }

  const targetStage = state.current.handoverTo ?? expectedNextStage
  if (targetStage !== expectedNextStage) {
    return {
      error: `Force-next-step denied: target stage "${targetStage}" is not the next selected stage "${expectedNextStage}".`,
      reason: 'target is not the next selected stage',
    }
  }

  const selectedStages = getStageOrder(definition).filter(s => state.workflow[s]?.selected !== false)
  const fromIndex = selectedStages.indexOf(currentStage)
  const toIndex = selectedStages.indexOf(targetStage)
  if (toIndex === -1) {
    return {
      error: `Force-next-step denied: target stage "${targetStage}" is not selected.`,
      reason: 'target stage is not selected',
    }
  }

  if (toIndex > fromIndex) {
    state.workflow[currentStage].mark = true
  } else if (toIndex < fromIndex) {
    for (let i = toIndex; i <= fromIndex; i++) {
      const step = selectedStages[i]
      if (step) {
        state.workflow[step].mark = false
      }
    }
  }

  const targetStageDef = definition.stages[targetStage]
  state.current = {
    name: targetStage,
    handoverTo: null,
    agent: targetStageDef?.agent,
    previousStage: state.workflow[targetStage]?.previousStage ?? null,
    nextStage: state.workflow[targetStage]?.nextStage ?? null,
    failureCount: 0,
  }

  HyperDesignerLogger.info('Workflow', '执行强制推进到下一阶段', {
    fromStage: currentStage,
    toStage: targetStage,
    failureCountBefore,
  })

  return state
}
