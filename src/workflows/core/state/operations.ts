/**
 * 工作流状态操作模块
 *
 * 提供工作流状态的高级操作函数，包括：
 * 1. 初始化工作流状态
 * 2. 设置阶段完成状态
 * 3. 设置当前步骤
 * 4. 设置交接目标
 * 5. 执行交接
 * 6. 设置质量门结果（替代旧的 setWorkflowGatePassed）
 */

import type { WorkflowDefinition, PlatformAdapter } from "../types";
import type { WorkflowState, GateResult } from "./types";
import { readWorkflowStateFile, writeWorkflowStateFile } from "./persistence";
import { getWorkflowDefinition } from "../registry";
import { HyperDesignerLogger } from "../../../utils/logger";

/**
 * Returns the stage order from a workflow definition
 * @param definition Workflow definition to extract stage order from
 * @returns Array of stage names in the order they should be executed
 */
export function getStageOrder(definition: WorkflowDefinition): string[] {
  return definition.stageOrder;
}

/**
 * Initializes a WorkflowState from a WorkflowDefinition
 * @param definition Workflow definition to create state from
 * @returns Newly initialized workflow state
 */
export function initializeWorkflowState(definition: WorkflowDefinition): WorkflowState {
  HyperDesignerLogger.debug("Workflow", "初始化工作流状态", { workflowId: definition.id });
  
  const workflow: Record<string, { isCompleted: boolean; score?: number | null; comment?: string | null }> = {};
  for (const stage of definition.stageOrder) {
    workflow[stage] = { isCompleted: false };
  }
  
  const state: WorkflowState = {
    typeId: definition.id,
    workflow,
    currentStep: null,
    handoverTo: null,
    gateResult: null,
  };
  
  HyperDesignerLogger.debug("Workflow", "工作流状态初始化完成", { 
    workflowId: definition.id, 
    stageCount: Object.keys(workflow).length 
  });
  return state;
}

/**
 * Gets the current workflow state
 * @returns Current workflow state or null if no state exists
 */
export function getWorkflowState(): WorkflowState | null {
  HyperDesignerLogger.info("Workflow", "获取当前工作流状态");
  return readWorkflowStateFile();
}

/**
 * Ensures a workflow state exists, creating one if it doesn't
 * @param definition Optional workflow definition to use for initialization
 * @returns Existing or newly created workflow state
 */
export function ensureWorkflowStateExists(definition?: WorkflowDefinition): WorkflowState {
  const state = readWorkflowStateFile();
  if (state !== null) {
    HyperDesignerLogger.debug("Workflow", "使用现有工作流状态", { workflowId: state.typeId });
    return state;
  }
  
  HyperDesignerLogger.info("Workflow", "未找到工作流状态，创建新的状态");
  
  const workflowDef = definition ?? getWorkflowDefinition("classic");
  
  if (workflowDef) {
    HyperDesignerLogger.debug("Workflow", "从定义初始化工作流状态", { workflowId: workflowDef.id });
    const newState = initializeWorkflowState(workflowDef);
    writeWorkflowStateFile(newState);
    return newState;
  }
  
  HyperDesignerLogger.warn("Workflow", "获取工作流定义失败", {
    workflowId: "classic",
    action: "getWorkflowDefinition",
    error: "Workflow definition 'classic' not found"
  });
  
  const fallbackState: WorkflowState = {
    typeId: "classic",
    workflow: {},
    currentStep: null,
    handoverTo: null,
    gateResult: null,
  };
  writeWorkflowStateFile(fallbackState);
  return fallbackState;
}

/**
 * Updates the completion status of a workflow stage
 * @param stageName Name of the stage to update
 * @param isCompleted Whether the stage is completed
 * @param definition Optional workflow definition
 * @returns Updated workflow state
 */
export function setWorkflowStage(stageName: string, isCompleted: boolean, definition?: WorkflowDefinition): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置工作流阶段状态", { 
    stage: stageName, 
    status: isCompleted ? "completed" : "not completed" 
  });
  
  const state = ensureWorkflowStateExists(definition);
  
  if (state.workflow[stageName]) {
    state.workflow[stageName].isCompleted = isCompleted;
    writeWorkflowStateFile(state);
    HyperDesignerLogger.debug("Workflow", "工作流阶段状态更新完成", { 
      stage: stageName, 
      status: isCompleted 
    });
  } else {
    HyperDesignerLogger.warn("Workflow", "无效的工作流阶段", {
      stage: stageName,
      availableStages: Object.keys(state.workflow),
      error: `Invalid workflow stage: ${stageName}`
    });
  }
  
  return state;
}

/**
 * Sets the currently active workflow step
 * @param stepName Name of the step to set as current, or null to clear
 * @param definition Optional workflow definition
 * @returns Updated workflow state
 */
export function setWorkflowCurrent(stepName: string | null, definition?: WorkflowDefinition): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置当前工作流步骤", { step: stepName });
  
  const state = ensureWorkflowStateExists(definition);
  
  if (stepName === null || state.workflow[stepName]) {
    const previousStep = state.currentStep;
    state.currentStep = stepName;
    // 进入新阶段时重置门禁状态，避免沿用上阶段结果
    if (previousStep !== stepName) {
      state.gateResult = null;
    }
    writeWorkflowStateFile(state);
    HyperDesignerLogger.debug("Workflow", "当前工作流步骤更新完成", { step: stepName });
  } else {
    HyperDesignerLogger.warn("Workflow", "无效的工作流步骤", {
      step: stepName,
      availableSteps: Object.keys(state.workflow),
      error: `Invalid workflow step: ${stepName}`
    });
  }
  
  return state;
}

/**
 * Sets the workflow handover target
 * 
 * 交接验证逻辑：
 * 1. 如果当前没有活动步骤，只能交接给第一个步骤（确保工作流从正确位置开始）
 * 2. 如果有活动步骤，只能交接给下一个步骤或返回之前的步骤（防止跳过关键步骤）
 * 3. 不允许向前跳过步骤（确保工作流顺序执行）
 * 
 * @param stepName Name of the step to hand over to, or null to clear
 * @param definition Workflow definition
 * @returns Updated workflow state
 */
export function setWorkflowHandover(stepName: string | null, definition: WorkflowDefinition): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置工作流交接目标", { targetStep: stepName });
  
  const state = ensureWorkflowStateExists(definition);

  // 清除交接目标
  if (stepName === null) {
    state.handoverTo = null;
    writeWorkflowStateFile(state);
    HyperDesignerLogger.debug("Workflow", "工作流交接目标已清除");
    return state;
  }

  // 验证目标步骤是否存在
  if (!state.workflow[stepName]) {
    HyperDesignerLogger.warn("Workflow", "无效的工作流步骤", {
      targetStep: stepName,
      availableSteps: Object.keys(state.workflow),
      error: `Invalid workflow step: ${stepName}`
    });
    return state;
  }

  const stageOrder = definition.stageOrder;
  const currentStep = state.currentStep;
  const currentIndex = currentStep ? stageOrder.indexOf(currentStep) : -1;
  const targetIndex = stageOrder.indexOf(stepName);

  // 如果没有当前步骤，只能交接给第一个步骤
  if (currentIndex === -1) {
    if (targetIndex !== 0) {
      HyperDesignerLogger.warn("Workflow", "无法设置交接：没有当前步骤", {
        targetStep: stepName,
        targetIndex,
        firstStep: stageOrder[0],
        validation: "mustBeFirstStep",
        error: "No current step set"
      });
      return state;
    }
  } else {
    // 正常逻辑：只允许下一个步骤或向后步骤
    const isNextStep = targetIndex === currentIndex + 1;
    const isBackwardStep = targetIndex <= currentIndex;

    if (!isNextStep && !isBackwardStep) {
      HyperDesignerLogger.warn("Workflow", "无法跳过步骤设置交接", {
        currentStep,
        currentIndex,
        targetStep: stepName,
        targetIndex,
        validation: "noStepSkipping",
        error: "Cannot skip steps"
      });
      return state;
    }
  }

  state.handoverTo = stepName;
  writeWorkflowStateFile(state);
  HyperDesignerLogger.debug("Workflow", "工作流交接目标设置完成", { targetStep: stepName });
  return state;
}

/**
 * Sets the workflow quality gate result (score + comment)
 * 替代旧的 setWorkflowGatePassed(boolean)
 *
 * @param gateResult 质量门结果，包含 score 和可选的 comment/stage
 * @returns Updated workflow state
 */
export function setWorkflowGateResult(gateResult: GateResult): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置门禁结果", { score: gateResult.score, stage: gateResult.stage });
  const state = ensureWorkflowStateExists();
  state.gateResult = gateResult;

  // 同步更新当前阶段的 score/comment 字段（按阶段持久化评审历史）
  const stageKey = gateResult.stage ?? state.currentStep;
  if (stageKey && state.workflow[stageKey]) {
    state.workflow[stageKey].score = gateResult.score;
    state.workflow[stageKey].comment = gateResult.comment ?? null;
  }

  writeWorkflowStateFile(state);
  return state;
}

/**
 * @deprecated 使用 setWorkflowGateResult 替代。
 * 兼容层：将旧的 boolean 参数转换为 GateResult。
 * true => score: 100；false => score: 0
 */
export function setWorkflowGatePassed(isPassed: boolean): WorkflowState {
  HyperDesignerLogger.info("Workflow", "[deprecated] 设置门禁状态（boolean）", { gatePassed: isPassed });
  return setWorkflowGateResult({
    score: isPassed ? 100 : 0,
    comment: isPassed ? "Passed (legacy)" : "Failed (legacy)",
  });
}

/**
 * Executes a pending workflow handover
 * @param definition Workflow definition
 * @returns Updated workflow state
 */
export async function executeWorkflowHandover(definition: WorkflowDefinition, sessionID?: string, adapter?: PlatformAdapter): Promise<WorkflowState> {
  HyperDesignerLogger.info("Workflow", "执行工作流交接");
  
  let state = readWorkflowStateFile();

  // 如果状态不存在，自动初始化
  if (state === null) {
    HyperDesignerLogger.debug("Workflow", "未找到工作流状态，初始化新状态");
    state = initializeWorkflowState(definition);
  }

  if (state.handoverTo === null) {
    HyperDesignerLogger.warn("Workflow", "未设置交接目标", {
      action: "executeHandover",
      validation: "handoverTargetRequired",
      error: "No handover target set"
    });
    return state;
  }

  const stageOrder = definition.stageOrder;
  const fromStep = state.currentStep;
  const toStep = state.handoverTo;
  const fromIndex = fromStep ? stageOrder.indexOf(fromStep) : -1;
  const toIndex = stageOrder.indexOf(toStep);

  HyperDesignerLogger.debug("Workflow", "交接详情", { 
    fromStep, 
    fromIndex, 
    toStep, 
    toIndex 
  });

  // 如果没有当前步骤，这是到第一个步骤的初始交接
  if (fromIndex === -1) {
    if (toIndex !== 0) {
      HyperDesignerLogger.warn("Workflow", "无法执行交接：没有当前步骤", {
        toStep,
        toIndex,
        firstStep: stageOrder[0],
        validation: "initialHandoverMustBeFirstStep",
        error: "No current step set"
      });
      return state;
    }
  } else if (toIndex > fromIndex) {
    // 向前移动时将当前步骤标记为完成
    state.workflow[fromStep!].isCompleted = true;
    HyperDesignerLogger.debug("Workflow", "步骤标记为完成", { step: fromStep });
  } else if (toIndex < fromIndex) {
    // 重置正在重新访问的步骤的完成状态
    for (let i = toIndex; i <= fromIndex; i++) {
      const step = stageOrder[i];
      state.workflow[step].isCompleted = false;
      HyperDesignerLogger.debug("Workflow", "步骤标记为未完成", { step });
    }
  }

  // 完成交接
  state.handoverTo = null;
  state.currentStep = toStep;
  
  writeWorkflowStateFile(state);
  HyperDesignerLogger.info("Workflow", "工作流交接执行完成", { 
    toStep,
    workflowId: state.typeId
  });
  
  // 状态转换完成后执行生命周期钩子
  // afterStage：离开阶段时执行（在状态更新之后，针对已离开的阶段）
  const departingStage = fromStep ? definition.stages[fromStep] : null;
  if (departingStage?.afterStage && departingStage.afterStage.length > 0) {
    HyperDesignerLogger.debug("Workflow", "执行 afterStage 钩子", { step: fromStep, hookCount: departingStage.afterStage.length });
    for (const hook of departingStage.afterStage) {
      await hook({ stageKey: fromStep!, stageName: departingStage.name, workflow: definition, ...(sessionID !== undefined && { sessionID }), ...(adapter !== undefined && { adapter }) });
    }
  }

  // beforeStage：进入新阶段时执行（在状态更新之后，针对即将进入的阶段）
  const incomingStage = definition.stages[toStep];
  if (incomingStage?.beforeStage && incomingStage.beforeStage.length > 0) {
    HyperDesignerLogger.debug("Workflow", "执行 beforeStage 钩子", { step: toStep, hookCount: incomingStage.beforeStage.length });
    for (const hook of incomingStage.beforeStage) {
      await hook({ stageKey: toStep, stageName: incomingStage.name, workflow: definition, ...(sessionID !== undefined && { sessionID }), ...(adapter !== undefined && { adapter }) });
    }
  }

  return state;
}
