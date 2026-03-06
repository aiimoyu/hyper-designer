/**
 * 系统消息转换器
 *
 * 替换系统消息中的工作流相关占位符令牌和工具名称占位符。
 */

import { workflowService } from '../../core/service'
import {
  loadPromptBindings,
  WORKFLOW_OVERVIEW_PROMPT_TOKEN,
  WORKFLOW_STEP_PROMPT_TOKEN,
} from '../../core/runtime'
import { replacePlaceholders, type PlaceholderResolver } from './utils'
import { replaceToolPlaceholders, OPENCODE_TOOL_MAPPING } from './tool-transform'

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
      definition: workflow,
      stage: currentStage,
    })

    const placeholderResolvers: PlaceholderResolver[] = [
      {
        token: WORKFLOW_OVERVIEW_PROMPT_TOKEN,
        resolve: () => promptBindings[WORKFLOW_OVERVIEW_PROMPT_TOKEN] ?? '',
      },
      {
        token: WORKFLOW_STEP_PROMPT_TOKEN,
        resolve: () => promptBindings[WORKFLOW_STEP_PROMPT_TOKEN] ?? '',
      },
    ]

    replacePlaceholders(output.system, placeholderResolvers)

    for (let index = 0; index < output.system.length; index += 1) {
      output.system[index] = replaceToolPlaceholders(output.system[index], OPENCODE_TOOL_MAPPING)
    }
  }
}
