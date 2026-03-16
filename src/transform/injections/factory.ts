import { PromptInjectionRegistry } from '../injectionRegistry'
import { stageConfigInjectionProvider } from './stageConfigInjection'
import { stageMilestonesInjectionProvider } from './stageMilestonesInjection'

export const DEFAULT_PROMPT_INJECTION_PROVIDER_IDS = [
  stageConfigInjectionProvider.id,
  stageMilestonesInjectionProvider.id,
] as const

export function createPromptInjectionRegistry(): PromptInjectionRegistry {
  const registry = new PromptInjectionRegistry()
  registry.register(stageConfigInjectionProvider)
  registry.register(stageMilestonesInjectionProvider)
  return registry
}
