import type { PromptInjectionProvider } from '../types'

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
    return formatRequiredMilestones(currentStage, milestones)
  },
}
