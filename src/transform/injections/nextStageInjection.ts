import type { PromptInjectionProvider } from '../types'
import { resolveNextSelectedStage } from '../../workflows/stageOrder'
import { HyperDesignerLogger } from '../../utils/logger'

export const nextStageInjectionProvider: PromptInjectionProvider = {
  id: 'next-stage',
  inject: ({ workflow, state, currentStage }) => {
    if (!workflow || !currentStage || !state?.instance?.selectedStageIds) {
      return null
    }

    const selectedSet = new Set(state.instance.selectedStageIds)
    const nextStageId = resolveNextSelectedStage(workflow, selectedSet, currentStage)

    if (!nextStageId) {
      HyperDesignerLogger.debug('NextStageInjection', `No next stage, this is the final stage: ${currentStage}`)
      return `<hd-next-stage>
  <is-final>true</is-final>
  <instruction>This is the final stage of the workflow. After completing this stage and passing all milestones, the workflow will end.</instruction>
</hd-next-stage>`
    }

    const nextStage = workflow.stages[nextStageId]
    if (!nextStage) {
      return null
    }

    HyperDesignerLogger.debug('NextStageInjection', `Injecting next stage info: ${nextStageId}`)

    return `<hd-next-stage>
  <id>${nextStageId}</id>
  <name>${nextStage.name}</name>
  <instruction>After completing this stage and passing all milestones, you will handover to the next stage.</instruction>
</hd-next-stage>`
  },
}
