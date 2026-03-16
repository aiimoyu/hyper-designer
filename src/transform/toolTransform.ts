export const HD_TOOL_PLACEHOLDERS = {
  ASK_USER: 'HD_TOOL_ASK_USER',
  DELEGATE: 'HD_TOOL_DELEGATE',
} as const

export type HdToolPlaceholder = (typeof HD_TOOL_PLACEHOLDERS)[keyof typeof HD_TOOL_PLACEHOLDERS]

export type ToolNameMapping = Record<HdToolPlaceholder, string>

export const OPENCODE_TOOL_MAPPING: ToolNameMapping = {
  [HD_TOOL_PLACEHOLDERS.ASK_USER]: 'question',
  [HD_TOOL_PLACEHOLDERS.DELEGATE]: 'task',
}

export function replaceToolPlaceholders(text: string, mapping: ToolNameMapping): string {
  let result = text
  for (const [placeholder, actualName] of Object.entries(mapping)) {
    result = result.replaceAll(placeholder, actualName)
  }
  return result
}

export function createToolTransformer(mapping: ToolNameMapping = OPENCODE_TOOL_MAPPING) {
  return (text: string): string => replaceToolPlaceholders(text, mapping)
}
