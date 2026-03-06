/**
 * 工作流提示词工具
 *
 * 为 workflow/stage/fallback 级别的 promptBindings 提供便捷构造函数。
 */

import { readFileSync } from 'fs'
import { HyperDesignerLogger } from '../../utils/logger'

/**
 * Create a prompt binding by loading content from a file immediately.
 *
 * @param filePath Absolute file path to the prompt file
 * @returns Prompt content loaded from the specified file
 */
export function filePrompt(filePath: string): string {
  try {
    HyperDesignerLogger.debug('Workflow', '从文件加载工作流提示词', { filePath })
    return readFileSync(filePath, 'utf-8')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.warn('Workflow', '加载工作流提示词文件失败', {
      filePath,
      action: 'loadWorkflowPromptBinding',
      error: err.message,
    })
    return `# Failed to load ${filePath}`
  }
}

/**
 * Create a prompt binding from inline text.
 *
 * @param value Literal prompt content
 * @returns Static prompt content
 */
export function stringPrompt(value: string): string {
  return value
}
