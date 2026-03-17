import type { PromptInjectionProvider, PromptInjectionRequest } from './types'

export interface InjectionResult {
  providerId: string
  content: string
}

export class PromptInjectionRegistry {
  private readonly providers = new Map<string, PromptInjectionProvider>()

  register(provider: PromptInjectionProvider): void {
    this.providers.set(provider.id, provider)
  }

  run(providerIds: string[], input: PromptInjectionRequest): InjectionResult[] {
    const results: InjectionResult[] = []
    for (const providerId of providerIds) {
      const provider = this.providers.get(providerId)
      if (!provider) {
        continue
      }
      const content = provider.inject(input)
      if (content && content.trim()) {
        results.push({ providerId, content })
      }
    }
    return results
  }
}
