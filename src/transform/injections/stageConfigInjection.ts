import type { PromptInjectionProvider } from '../types'

function formatStageInjectionContents(items: string[]): string {
  const lines = items.map((item, index) => `${index + 1}. ${item}`)
  return ['## Workflow Stage Injections', ...lines].join('\n')
}

export const stageConfigInjectionProvider: PromptInjectionProvider = {
  id: 'stage-config',
  inject: ({ stageDefinition }) => {
    const entries = stageDefinition?.注入内容
    if (!entries || entries.length === 0) {
      return null
    }
    return formatStageInjectionContents(entries)
  },
}
