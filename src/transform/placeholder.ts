export type PlaceholderResolver = {
  token: string
  resolve: () => string | null
}

export function replacePlaceholders(
  systemMessages: string[],
  resolvers: PlaceholderResolver[],
): void {
  for (const resolver of resolvers) {
    const needsReplacement = systemMessages.some(message => message.includes(resolver.token))
    if (!needsReplacement) {
      continue
    }

    const replacement = resolver.resolve()
    const safeReplacement = replacement ?? ''

    for (let index = 0; index < systemMessages.length; index += 1) {
      const message = systemMessages[index]
      if (message.includes(resolver.token)) {
        systemMessages[index] = message.split(resolver.token).join(safeReplacement)
      }
    }
  }
}
