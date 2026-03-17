import type { PromptInjectionProvider } from '../types'

function formatStageInjectionContents(items: string[]): string {
  const lines = items.map((item, index) => `${index + 1}. ${item}`)
  return lines.join('\n')
}

export const stageConfigInjectionProvider: PromptInjectionProvider = {
  id: 'stage-config',
  inject: ({ stageDefinition }) => {
    const entries = stageDefinition?.injectContent
    if (!entries || entries.length === 0) {
      return null
    }
    return formatStageInjectionContents(entries)
  },
}
