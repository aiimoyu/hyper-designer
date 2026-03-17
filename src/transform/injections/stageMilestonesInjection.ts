import type { PromptInjectionProvider } from '../types'
import type { MilestoneDefinition } from '../../workflows/core/types'
import { HyperDesignerLogger } from '../../utils/logger'

function getMilestoneId(milestone: string | MilestoneDefinition): string {
  return typeof milestone === 'string' ? milestone : milestone.id
}

function getMilestoneName(milestone: string | MilestoneDefinition): string {
  return typeof milestone === 'string' ? milestone : milestone.name
}

function getMilestoneDescription(milestone: string | MilestoneDefinition): string {
  return typeof milestone === 'string' ? milestone : milestone.description
}

function formatMilestonesContent(milestones: (string | MilestoneDefinition)[]): string {
  const items = milestones.map(milestone => {
    const name = getMilestoneName(milestone)
    const description = getMilestoneDescription(milestone)
    return `  <item>\n    <name>${name}</name>\n    <description>${description}</description>\n  </item>`
  })
  return items.join('\n')
}

export const stageMilestonesInjectionProvider: PromptInjectionProvider = {
  id: 'stage-milestones',
  inject: ({ stageDefinition, currentStage }) => {
    const milestones = stageDefinition?.requiredMilestones
    if (!milestones || milestones.length === 0 || !currentStage) {
      return null
    }
    const milestoneIds = milestones.map(getMilestoneId).join(', ')
    HyperDesignerLogger.debug('StageMilestonesInjection', `Injecting required milestones for stage "${currentStage}": ${milestoneIds}`)
    return formatMilestonesContent(milestones)
  },
}
