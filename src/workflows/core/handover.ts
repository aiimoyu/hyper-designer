/**
 * 工作流交接管理模块
 * 
 * 负责获取交接代理和交接提示词，包括：
 * 1. 根据阶段名称获取对应的代理
 * 2. 生成阶段间的交接提示词
 */

import type { WorkflowDefinition } from "./types"
import { HyperDesignerLogger } from "../../utils/logger"

export function getHandoverAgent(definition: WorkflowDefinition, stage: string): string | null {
  const stageConfig = definition.stages[stage]
  if (!stageConfig) {
    HyperDesignerLogger.error("Workflow", `未知的工作流阶段`, new Error(`Unknown stage: ${stage}`), {
      stage,
      availableStages: Object.keys(definition.stages),
      action: "getHandoverAgent"
    })
    return null
  }
  
  HyperDesignerLogger.debug("Workflow", `获取交接代理`, {
    stage,
    agent: stageConfig.agent
  })
  
  return stageConfig.agent
}

export function getHandoverPrompt(
  definition: WorkflowDefinition,
  currentStep: string | null,
  nextStep: string
): string | null {
  const stageConfig = definition.stages[nextStep]
  if (!stageConfig) {
    HyperDesignerLogger.error("Workflow", `未知的工作流阶段`, new Error(`Unknown stage: ${nextStep}`), {
      stage: nextStep,
      availableStages: Object.keys(definition.stages),
      action: "getHandoverPrompt"
    })
    return null
  }
  
  if (!stageConfig.getHandoverPrompt) {
    HyperDesignerLogger.error("Workflow", `阶段未定义交接提示词函数`, new Error(`Stage "${nextStep}" does not define getHandoverPrompt function`), {
      stage: nextStep,
      action: "validateHandoverFunction"
    })
    return null
  }
  
  HyperDesignerLogger.debug("Workflow", `生成交接提示词`, {
    currentStep,
    nextStep,
    action: "generateHandoverPrompt"
  })
  
  return stageConfig.getHandoverPrompt(currentStep)
}
