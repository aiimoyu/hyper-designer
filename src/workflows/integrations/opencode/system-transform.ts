/**
 * 系统消息转换器
 *
 * 替换系统消息中的工作流相关占位符令牌和工具名称占位符。
 */

import { workflowService } from '../../core/service'
import {
  loadPromptBindings,
  resolvePromptBindingsForMode,
} from '../../core/runtime'
import { replacePlaceholders, type PlaceholderResolver } from './utils'
import { replaceToolPlaceholders, OPENCODE_TOOL_MAPPING } from './tool-transform'

const WORKFLOW_PROMPT_TOKEN_PATTERN = /\{HYPER_DESIGNER_WORKFLOW_[A-Z0-9_]+_PROMPT\}/g

function clearUnresolvedWorkflowPromptTokens(systemMessages: string[]): void {
  for (let index = 0; index < systemMessages.length; index += 1) {
    systemMessages[index] = systemMessages[index].replace(WORKFLOW_PROMPT_TOKEN_PATTERN, '')
  }
}

/**
 * 创建系统消息转换器
 *
 * @returns 系统消息转换函数
 */
export function createSystemTransformer() {
  return async (_input: unknown, output: { system: string[] }) => {
    const workflow = workflowService.getDefinition()
    const workflowState = workflowService.getState()
    const currentStage = workflowState?.current?.name || null

    const promptBindings = loadPromptBindings({
      definition: workflow ?? undefined,
      stage: currentStage,
    })
    const resolvedBindings = resolvePromptBindingsForMode({
      bindings: promptBindings,
      isFallbackMode: currentStage === null,
    })

    const placeholderResolvers: PlaceholderResolver[] = Object.keys(resolvedBindings).map(token => ({
      token,
      resolve: () => resolvedBindings[token] ?? '',
    }))

    replacePlaceholders(output.system, placeholderResolvers)

    if (currentStage === null) {
      clearUnresolvedWorkflowPromptTokens(output.system)
    }

    for (let index = 0; index < output.system.length; index += 1) {
      output.system[index] = replaceToolPlaceholders(output.system[index], OPENCODE_TOOL_MAPPING)
    }
  }
}
