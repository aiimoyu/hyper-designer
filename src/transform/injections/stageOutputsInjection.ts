import type { PromptInjectionProvider } from '../types'
import type { StageFileItem } from '../../workflows/types'
import { HyperDesignerLogger } from '../../utils/logger'

function formatOutputFileItem(item: StageFileItem): string {
  return `  <item>
    <id>${item.id}</id>
    <path>${item.path}</path>
    <type>${item.type}</type>
    <description>${item.description}</description>
  </item>`
}

export const stageOutputsInjectionProvider: PromptInjectionProvider = {
  id: 'stage-outputs',
  inject: ({ stageDefinition, currentStage }) => {
    const outputs = stageDefinition?.outputs
    if (!outputs || outputs.length === 0 || !currentStage) {
      return null
    }

    HyperDesignerLogger.debug('StageOutputsInjection', `Injecting output files for stage "${currentStage}"`, {
      outputCount: outputs.length,
    })

    const itemsXml = outputs.map(formatOutputFileItem).join('\n')

    return `<stage-output-files>
${itemsXml}
</stage-output-files>`
  },
}
