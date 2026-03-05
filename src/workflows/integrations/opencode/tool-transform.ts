/**
 * 工具名称转换器
 *
 * 替换提示词中的工具名称占位符，实现跨平台兼容。
 * OpenCode 平台：HD_TOOL_ASK_USER -> question, HD_TOOL_DELEGATE -> task
 */

/**
 * 工具占位符常量
 *
 * 命名规范：HD_TOOL_* 格式，语义化且避免与实际工具名冲突
 */
export const HD_TOOL_PLACEHOLDERS = {
  /** 向用户提问/确认的交互工具 */
  ASK_USER: 'HD_TOOL_ASK_USER',
  /** 委派任务给子代理的工具 */
  DELEGATE: 'HD_TOOL_DELEGATE',
} as const

export type HdToolPlaceholder = (typeof HD_TOOL_PLACEHOLDERS)[keyof typeof HD_TOOL_PLACEHOLDERS]

/**
 * 工具名称映射表类型
 */
export type ToolNameMapping = Record<HdToolPlaceholder, string>

/**
 * OpenCode 平台工具名称映射表
 */
export const OPENCODE_TOOL_MAPPING: ToolNameMapping = {
  [HD_TOOL_PLACEHOLDERS.ASK_USER]: 'question',
  [HD_TOOL_PLACEHOLDERS.DELEGATE]: 'task',
}

/**
 * 替换提示词中的工具占位符
 *
 * @param text 原始提示词文本
 * @param mapping 工具名称映射表
 * @returns 替换后的提示词
 */
export function replaceToolPlaceholders(text: string, mapping: ToolNameMapping): string {
  let result = text
  for (const [placeholder, actualName] of Object.entries(mapping)) {
    result = result.replaceAll(placeholder, actualName)
  }
  return result
}

/**
 * 创建工具名称转换器
 *
 * @param mapping 工具名称映射表（默认使用 OpenCode 映射）
 * @returns 转换函数
 */
export function createToolTransformer(mapping: ToolNameMapping = OPENCODE_TOOL_MAPPING) {
  return (text: string): string => replaceToolPlaceholders(text, mapping)
}
