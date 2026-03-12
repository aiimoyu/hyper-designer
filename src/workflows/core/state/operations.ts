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
import type {
  WorkflowState,
  WorkflowStage,
  StageMilestone,
  GateMilestoneDetail,
} from "./types";
import { readWorkflowStateFile, writeWorkflowStateFile } from "./persistence";
import { HyperDesignerLogger } from "../../../utils/logger";
import {
  GATE_MILESTONE_KEY,
  GATE_PASS_THRESHOLD,
  FORCE_ADVANCE_MILESTONE_KEY,
  upsertStageMilestone,
  forceAdvanceToNextSelectedStage,
} from '../stageMilestone'

function resolveCurrentNeighbors(
  workflow: Record<string, WorkflowStage>,
  stageName: string | null,
): { previousStage: string | null; nextStage: string | null } {
  if (stageName === null || !workflow[stageName]) {
    return {
      previousStage: null,
      nextStage: null,
    }
  }

  return {
    previousStage: workflow[stageName].previousStage ?? null,
    nextStage: workflow[stageName].nextStage ?? null,
  }
}

/**
 * Returns the stage order from a workflow definition
 * @param definition Workflow definition to extract stage order from
 * @returns Array of stage names in the order they should be executed
 */
export function getStageOrder(definition: WorkflowDefinition): string[] {
  return definition.stageOrder;
}

export function initializeWorkflowState(definition: WorkflowDefinition, selectedStages?: string[]): WorkflowState {
  HyperDesignerLogger.debug("Workflow", "初始化工作流状态", { workflowId: definition.id });

  const workflow: Record<string, WorkflowStage> = {};
  for (const stage of definition.stageOrder) {
    // 如果提供了 selectedStages，则根据它设置 selected；否则默认全部选中
    const isSelected = selectedStages ? selectedStages.includes(stage) : true;
    workflow[stage] = { isCompleted: false, selected: isSelected };
  }

  // Compute neighbor links for selected stages
  const selectedStageList = selectedStages ?? definition.stageOrder;
  for (let i = 0; i < selectedStageList.length; i++) {
    const currentStage = selectedStageList[i];
    const previousStage = i > 0 ? selectedStageList[i - 1] : null;
    const nextStage = i < selectedStageList.length - 1 ? selectedStageList[i + 1] : null;
    
    if (workflow[currentStage]) {
      workflow[currentStage].previousStage = previousStage;
      workflow[currentStage].nextStage = nextStage;
    }
  }

  const state: WorkflowState = {
    initialized: true,
    typeId: definition.id,
    workflow,
    current: null,
  };

  HyperDesignerLogger.debug("Workflow", "工作流状态初始化完成", {
    workflowId: definition.id,
    stageCount: Object.keys(workflow).length,
    selectedStages: selectedStages ?? 'all'
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
 * Ensures a workflow state exists
 * 如果状态文件不存在，返回未初始化状态
 * @returns Existing workflow state or uninitialized state
 */
export function ensureWorkflowStateExists(): WorkflowState {
  const state = readWorkflowStateFile();
  if (state !== null) {
    HyperDesignerLogger.debug("Workflow", "使用现有工作流状态", { workflowId: state.typeId, initialized: state.initialized });
    return state;
  }

  // 状态文件不存在，返回未初始化状态
  HyperDesignerLogger.info("Workflow", "未找到工作流状态文件，返回未初始化状态");
  const uninitializedState: WorkflowState = {
    initialized: false,
    typeId: null,
    workflow: {},
    current: null,
  };
  return uninitializedState;
}


/**
 * Updates the completion status of a workflow stage
 * @param stageName Name of the stage to update
 * @param isCompleted Whether the stage is completed
 * @returns Updated workflow state
 */
export function setWorkflowStage(stageName: string, isCompleted: boolean): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置工作流阶段状态", {
    stage: stageName,
    status: isCompleted ? "completed" : "not completed"
  });

  const state = ensureWorkflowStateExists();

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
 * @returns Updated workflow state
 */
export function setWorkflowCurrent(stepName: string | null): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置当前工作流步骤", { step: stepName });

  const state = ensureWorkflowStateExists();

  if (stepName === null) {
    state.current = null;
    writeWorkflowStateFile(state);
    HyperDesignerLogger.debug("Workflow", "当前工作流步骤已清除");
  } else if (state.workflow[stepName]) {
    const previousStep = state.current?.name || null;
    if (previousStep !== stepName) {
      const neighbors = resolveCurrentNeighbors(state.workflow, stepName)
      state.current = {
        name: stepName,
        handoverTo: null,
        previousStage: neighbors.previousStage,
        nextStage: neighbors.nextStage,
      };
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
 * 1. 如果当前没有活动步骤，只能交接给第一个被选中的步骤
 * 2. 如果有活动步骤，只能交接给下一个被选中的步骤或返回之前的步骤
 * 3. 不允许向前跳过被选中的步骤
 * 
 * @param stepName Name of the step to hand over to, or null to clear
 * @param definition Workflow definition
 * @returns Updated workflow state
 */
export function setWorkflowHandover(stepName: string | null, definition: WorkflowDefinition): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置工作流交接目标", { targetStep: stepName });

  const state = ensureWorkflowStateExists();

  const incrementCurrentFailureCount = (): WorkflowState => {
    if (state.current === null) {
      return state;
    }

    state.current.failureCount = (state.current.failureCount ?? 0) + 1;
    writeWorkflowStateFile(state);
    return state;
  };

  if (state.current === null) {
    // 初始逻辑：如果没有当前活动步骤，创建一个初始 current 对象
    state.current = {
      name: null,
      handoverTo: null,
      previousStage: null,
      nextStage: null,
      failureCount: 0,
    };
    writeWorkflowStateFile(state);
  }

  // 清除交接目标
  if (stepName === null) {
    state.current.handoverTo = null;
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
    return incrementCurrentFailureCount();
  }

  // 获取被选中的阶段列表（按 stageOrder 顺序）
  const selectedStages = definition.stageOrder.filter(s => state.workflow[s]?.selected !== false);
  const firstSelectedStage = selectedStages[0];

  if (state.current.name === null) {
    // 初始交接验证：只能交接给第一个被选中的步骤
    if (stepName === firstSelectedStage) {
      state.current.handoverTo = stepName;
      writeWorkflowStateFile(state);
      HyperDesignerLogger.debug("Workflow", "初始交接目标设置完成", { targetStep: stepName });
      return state;
    }

    HyperDesignerLogger.warn("Workflow", "无法设置交接：没有当前活动步骤且目标不是首个被选中的步骤", {
      targetStep: stepName,
      firstSelectedStage
    });
    return incrementCurrentFailureCount();
  }

  const currentIndex = selectedStages.indexOf(state.current.name);
  const targetIndex = selectedStages.indexOf(stepName);

  // 目标步骤不在被选中列表中
  if (targetIndex === -1) {
    HyperDesignerLogger.warn("Workflow", "目标步骤未被选中", {
      targetStep: stepName,
      selectedStages
    });
    return incrementCurrentFailureCount();
  }

  // 正常逻辑：只允许下一个步骤或向后步骤
  const isNextStep = targetIndex === currentIndex + 1;
  const isBackwardStep = targetIndex <= currentIndex;

  if (!isNextStep && !isBackwardStep) {
    HyperDesignerLogger.warn("Workflow", "无法跳过步骤设置交接", {
      currentStage: state.current.name,
      currentIndex,
      targetStep: stepName,
      targetIndex,
      validation: "noStepSkipping",
      error: "Cannot skip steps"
    });
    return incrementCurrentFailureCount();
  }

  state.current.handoverTo = stepName;
  const neighbors = resolveCurrentNeighbors(state.workflow, state.current.name)
  state.current.previousStage = neighbors.previousStage
  state.current.nextStage = neighbors.nextStage
  writeWorkflowStateFile(state);
  HyperDesignerLogger.debug("Workflow", "工作流交接目标设置完成", { targetStep: stepName });
  return state;
}


interface GateEvaluationInput {
  detail: GateMilestoneDetail;
  stage?: string | null;
}

interface StageMilestoneInput {
  stage: string
  milestone: {
    type: string
    isCompleted: boolean
    detail: unknown
  }
}

function createGateMilestone(detail: GateMilestoneDetail): StageMilestone {
  const passed = typeof detail.score === 'number' && detail.score > GATE_PASS_THRESHOLD
  return {
    type: GATE_MILESTONE_KEY,
    timestamp: new Date().toISOString(),
    isCompleted: passed,
    detail,
  };
}

export function setWorkflowGateResult(gateEvaluation: GateEvaluationInput): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置门禁结果", { stage: gateEvaluation.stage });
  const state = ensureWorkflowStateExists();

  const stageKey = gateEvaluation.stage ?? state.current?.name;
  if (stageKey && state.workflow[stageKey]) {
    state.workflow[stageKey].stageMilestones = {
      ...(state.workflow[stageKey].stageMilestones ?? {}),
      [GATE_MILESTONE_KEY]: createGateMilestone(gateEvaluation.detail),
    };
  }

  writeWorkflowStateFile(state);
  return state;
}

export function setWorkflowStageMilestone(input: StageMilestoneInput): WorkflowState {
  HyperDesignerLogger.info('Workflow', '设置阶段里程碑', { stage: input.stage, type: input.milestone.type })
  const state = ensureWorkflowStateExists()
  const stage = state.workflow[input.stage]
  if (!stage) {
    return state
  }
  stage.stageMilestones = upsertStageMilestone(stage.stageMilestones, {
    type: input.milestone.type,
    isCompleted: input.milestone.isCompleted,
    detail: input.milestone.detail,
  })
  writeWorkflowStateFile(state)
  return state
}

export function setWorkflowGatePassed(isPassed: boolean): WorkflowState {
  HyperDesignerLogger.info("Workflow", "[deprecated] 设置门禁状态（boolean）", { gatePassed: isPassed });
  const detail = {
    ['s' + 'core']: isPassed ? 100 : 0,
  } as unknown as GateMilestoneDetail;

  return setWorkflowGateResult({
    detail,
  });
}


/**
 * Executes a pending workflow handover
 * @param definition Workflow definition
 * @returns Updated workflow state
 * @throws Error if workflow not initialized
 */
export async function executeWorkflowHandover(definition: WorkflowDefinition, sessionID?: string, adapter?: PlatformAdapter): Promise<WorkflowState> {
  HyperDesignerLogger.info("Workflow", "执行工作流交接");

  const state = readWorkflowStateFile();

  // 检查工作流是否已初始化
  if (state === null || !state.initialized) {
    const error = "Workflow not initialized. Call selectWorkflow first.";
    HyperDesignerLogger.error("Workflow", error, new Error(error), {
      action: "executeHandover"
    });
    throw new Error(error);
  }

  if (state.current === null || state.current.handoverTo === null) {
    HyperDesignerLogger.warn("Workflow", "未设置交接目标", {
      action: "executeHandover",
      validation: "handoverTargetRequired",
      error: "No current stage or handover target set"
    });
    return state;
  }

  // 获取被选中的阶段列表（按 stageOrder 顺序）
  const selectedStages = definition.stageOrder.filter(s => state.workflow[s]?.selected !== false);
  const fromStep = state.current.name;
  const toStep = state.current.handoverTo;
  const fromIndex = fromStep ? selectedStages.indexOf(fromStep) : -1;
  const toIndex = selectedStages.indexOf(toStep);

  HyperDesignerLogger.debug("Workflow", "交接详情", {
    fromStep,
    fromIndex,
    toStep,
    toIndex,
    selectedStages
  });

  if (toIndex > fromIndex && fromStep !== null) {
    // 向前移动时将当前步骤标记为完成
    state.workflow[fromStep].isCompleted = true;
    HyperDesignerLogger.debug("Workflow", "步骤标记为完成", { step: fromStep });
  } else if (toIndex < fromIndex && fromStep !== null) {
    // 重置正在重新访问的步骤的完成状态
    for (let i = toIndex; i <= fromIndex; i++) {
      const step = selectedStages[i];
      state.workflow[step].isCompleted = false;
      HyperDesignerLogger.debug("Workflow", "步骤标记为未完成", { step });
    }
  }

  // Phase 1: afterStage 钩子在 stage 切换之前执行（重入由 WorkflowService 内存锁保护）
  const departingStage = fromStep ? definition.stages[fromStep] : null;
  if (departingStage?.afterStage && departingStage.afterStage.length > 0) {
    HyperDesignerLogger.debug("Workflow", "执行 afterStage 钩子", { step: fromStep, hookCount: departingStage.afterStage.length });
    for (const hook of departingStage.afterStage) {
      await hook({ stageKey: fromStep!, stageName: departingStage.name, workflow: definition, ...(sessionID !== undefined && { sessionID }), ...(adapter !== undefined && { adapter }) });
    }
  }
  // Stage 切换
  state.current = {
    name: toStep,
    handoverTo: null,
    previousStage: state.workflow[toStep]?.previousStage ?? null,
    nextStage: state.workflow[toStep]?.nextStage ?? null,
    failureCount: 0,
  };
  
  writeWorkflowStateFile(state);
  HyperDesignerLogger.info("Workflow", "工作流交接执行完成", {
    toStep,
    workflowId: state.typeId
  });

  // Phase 2: beforeStage 钩子在 stage 切换之后执行
  const incomingStage = definition.stages[toStep];
  if (incomingStage?.beforeStage && incomingStage.beforeStage.length > 0) {
    HyperDesignerLogger.debug("Workflow", "执行 beforeStage 钩子", { step: toStep, hookCount: incomingStage.beforeStage.length });
    for (const hook of incomingStage.beforeStage) {
      await hook({ stageKey: toStep, stageName: incomingStage.name, workflow: definition, ...(sessionID !== undefined && { sessionID }), ...(adapter !== undefined && { adapter }) });
    }
  }

  return state;
}

export function forceWorkflowNextStep(
  definition: WorkflowDefinition,
): WorkflowState | { error: string; reason: string } {
  const state = readWorkflowStateFile();
  if (state === null) {
    return {
      error: 'Cannot force next step before workflow is initialized and current stage is set.',
      reason: 'workflow not initialized or current stage missing',
    };
  }

  const fromStage = state.current?.name ?? null
  const result = forceAdvanceToNextSelectedStage(state, definition)
  if ('error' in result) {
    return result
  }

  if (fromStage && state.workflow[fromStage]) {
    state.workflow[fromStage].stageMilestones = upsertStageMilestone(state.workflow[fromStage].stageMilestones, {
      type: FORCE_ADVANCE_MILESTONE_KEY,
      isCompleted: true,
      detail: {
        reason: 'Forced transition after 3+ failed handover attempts',
      },
    })
  }

  writeWorkflowStateFile(state);
  return state;
}
