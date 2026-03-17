import type { InjectionConfig, PromptInjectionProvider, PromptInjectionRequest } from './types'

export interface InjectionResult {
  providerId: string
  content: string
}

export class PromptInjectionRegistry {
  private readonly providers = new Map<string, PromptInjectionProvider>()

  register(provider: PromptInjectionProvider): void {
    this.providers.set(provider.id, provider)
  }

  async run(injectionConfigs: InjectionConfig[], input: PromptInjectionRequest): Promise<InjectionResult[]> {
    const results: InjectionResult[] = []
    for (const config of injectionConfigs) {
      const provider = this.providers.get(config.provider)
      if (!provider) {
        continue
      }
      const content = await provider.inject({ ...input, config })
      if (content && content.trim()) {
        results.push({ providerId: config.provider, content })
      }
    }
    return results
  }
}
