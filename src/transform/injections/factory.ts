import { PromptInjectionRegistry } from '../injectionRegistry'
import { stageConfigInjectionProvider } from './stageConfigInjection'
import { stageMilestonesInjectionProvider } from './stageMilestonesInjection'
import { stageInputsInjectionProvider } from './stageInputsInjection'
import { stageOutputsInjectionProvider } from './stageOutputsInjection'
import { fileContentInjectionProvider } from './fileContentInjection'

export const DEFAULT_PROMPT_INJECTION_PROVIDER_IDS = [
  stageConfigInjectionProvider.id,
  stageMilestonesInjectionProvider.id,
] as const

export function createPromptInjectionRegistry(): PromptInjectionRegistry {
  const registry = new PromptInjectionRegistry()
  registry.register(stageConfigInjectionProvider)
  registry.register(stageMilestonesInjectionProvider)
  registry.register(stageInputsInjectionProvider)
  registry.register(stageOutputsInjectionProvider)
  registry.register(fileContentInjectionProvider)
  return registry
}
