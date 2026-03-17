import type { PromptInjectionProvider } from '../types'
import { HyperDesignerLogger } from '../../utils/logger'


function formatRequiredMilestones(stageName: string, milestones: string[]): string {
  const lines = milestones.map((milestone, index) => `${index + 1}. ${milestone}`)
  return [`## Stage Required Milestones (${stageName})`, ...lines].join('\n')
}

export const stageMilestonesInjectionProvider: PromptInjectionProvider = {
  id: 'stage-milestones',
  inject: ({ stageDefinition, currentStage }) => {
    const milestones = stageDefinition?.requiredMilestones
    if (!milestones || milestones.length === 0 || !currentStage) {
      return null
    }
    HyperDesignerLogger.debug('StageMilestonesInjection', `Injecting required milestones for stage "${currentStage}": ${milestones.join(', ')}`)
    HyperDesignerLogger.debug('StageMilestonesInjection', formatRequiredMilestones(currentStage, milestones))
    return formatRequiredMilestones(currentStage, milestones)
  },
}
