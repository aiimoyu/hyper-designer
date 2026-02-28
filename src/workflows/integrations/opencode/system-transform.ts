/**
 * 系统消息转换器
 *
 * 替换系统消息中的工作流相关占位符令牌。
 */

import { workflowService } from "../../core/service"
import { loadWorkflowPrompt, loadStagePrompt } from "../../core/runtime"
import { replacePlaceholders, type PlaceholderResolver } from "./utils"

/**
 * 创建系统消息转换器
 *
 * @returns 系统消息转换函数
 */
export function createSystemTransformer() {
  return async (_input: unknown, output: { system: string[] }) => {
    const workflow = workflowService.getDefinition()
    const workflowState = workflowService.getState()

    const placeholderResolvers: PlaceholderResolver[] = [
      {
        token: "{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}",
        resolve: () => {
          return loadWorkflowPrompt(workflow)
        },
      },
      {
        token: "{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}",
        resolve: () => {
          const currentStep = workflowState?.currentStep || null
          return loadStagePrompt(currentStep, workflow)
        },
      },
    ]

    replacePlaceholders(output.system, placeholderResolvers)
  }
}