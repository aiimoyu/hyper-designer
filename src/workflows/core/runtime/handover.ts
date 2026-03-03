/**
 * 工作流交接管理模块
 * 
 * 负责获取交接代理和交接提示词，包括：
 * 1. 根据阶段名称获取对应的代理
 * 2. 生成阶段间的交接提示词
 */

import type { WorkflowDefinition } from "../types";
import { HyperDesignerLogger } from "../../../utils/logger";

export function getHandoverAgent(definition: WorkflowDefinition, stage: string): string | null {
  const stageConfig = definition.stages[stage];
  if (!stageConfig) {
    HyperDesignerLogger.warn("Workflow", `未知的工作流阶段`, {
      stage,
      availableStages: Object.keys(definition.stages),
      action: "getHandoverAgent",
      error: `Unknown stage: ${stage}`
    });
    return null;
  }

  HyperDesignerLogger.debug("Workflow", `获取交接代理`, {
    stage,
    agent: stageConfig.agent
  });

  return stageConfig.agent;
}

export function getHandoverPrompt(
  definition: WorkflowDefinition,
  currentStage: string | null,
  nextStep: string
): string | null {
  const stageConfig = definition.stages[nextStep];
  if (!stageConfig) {
    HyperDesignerLogger.warn("Workflow", `未知的工作流阶段`, {
      stage: nextStep,
      availableStages: Object.keys(definition.stages),
      action: "getHandoverPrompt",
      error: `Unknown stage: ${nextStep}`
    });
    return null;
  }

  if (!stageConfig.getHandoverPrompt) {
    HyperDesignerLogger.warn("Workflow", `阶段未定义交接提示词函数`, {
      stage: nextStep,
      action: "validateHandoverFunction",
      error: `Stage "${nextStep}" does not define getHandoverPrompt function`
    });
    return null;
  }

  HyperDesignerLogger.debug("Workflow", `生成交接提示词`, {
    currentStage,
    nextStep,
    action: "generateHandoverPrompt"
  });

  // 将 currentStage key 解析为阶段显示名称，传入 getHandoverPrompt 而非原始 key
  const currentStageName = currentStage ? (definition.stages[currentStage]?.name ?? currentStage) : null
  return stageConfig.getHandoverPrompt(currentStageName, stageConfig.name);
}