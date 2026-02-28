/**
 * 占位符替换工具
 *
 * 用于系统消息中工作流相关占位符的解析和替换。
 */

export type PlaceholderResolver = {
  token: string
  resolve: () => string | null
}

/**
 * 替换系统消息数组中的占位符令牌
 * @param systemMessages 系统消息数组（原地修改）
 * @param resolvers 占位符解析器列表
 */
export function replacePlaceholders(
  systemMessages: string[],
  resolvers: PlaceholderResolver[]
): void {
  for (const resolver of resolvers) {
    const needsReplacement = systemMessages.some(message => message.includes(resolver.token))
    if (!needsReplacement) {
      continue
    }

    const replacement = resolver.resolve()
    const safeReplacement = replacement ?? ""

    for (let index = 0; index < systemMessages.length; index += 1) {
      const message = systemMessages[index]
      if (message.includes(resolver.token)) {
        systemMessages[index] = message.split(resolver.token).join(safeReplacement)
      }
    }
  }
}