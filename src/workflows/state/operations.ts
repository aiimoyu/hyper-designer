/**
 * 工作流状态操作模块
 *
 * 提供工作流状态的高级操作函数，包括：
 * 1. 初始化工作流状态
 * 2. 设置阶段完成状态
 * 3. 设置当前步骤
 * 4. 设置交接目标
 * 5. 执行交接
 * 6. 设置质量门结果
 */

import type { WorkflowDefinition, WorkflowPlatformAdapter, MilestoneDefinition } from "../types";
import type {
  WorkflowState,
  WorkflowStage,
  StageMilestone,
  GateMilestoneDetail,
} from "./types";
import { readWorkflowStateFile, writeWorkflowStateFile } from "./persistence";
import { getWorkflowDefinition } from "../registry";
import { HyperDesignerLogger } from "../../utils/logger";
import {
  GATE_MILESTONE_KEY,
  GATE_PASS_THRESHOLD,
  FORCE_ADVANCE_MILESTONE_KEY,
  forceAdvanceToNextSelectedStage,
} from '../stageMilestone'
import {
  appendHistoryEvent,
  flushCurrentNodeContextToHistory,
  patchCurrentNodeInfo,
  setCurrentNodeContext,
  setCurrentNodeMilestone,
} from './history'
import { getStageOrder as getDefinitionStageOrder, resolveNextSelectedStage } from '../stageOrder'

function createHookNodeId(stageKey: string, lane: 'before' | 'after', hookId: string): string {
  return `workflow.${stageKey}.${lane}.${hookId}`
}

function createMainNodeId(stageKey: string): string {
  return `workflow.${stageKey}.main`
}

function getMilestoneId(milestone: string | MilestoneDefinition): string {
  return typeof milestone === 'string' ? milestone : milestone.id
}

function getRequiredMilestones(definition: WorkflowDefinition, stageKey: string): string[] {
  const stage = definition.stages[stageKey]
  if (!stage || !Array.isArray(stage.requiredMilestones)) {
    return []
  }
  return stage.requiredMilestones.map(getMilestoneId)
}

function ensureRuntimeInitialized(state: WorkflowState): void {
  if (!state.runtime) {
    state.runtime = {
      status: 'running',
      flow: {
        fromNodeId: null,
        currentNodeId: null,
        nextNodeId: null,
        lastEventSeq: 0,
      },
      currentNodeContext: null,
    }
  }

  if (!state.history) {
    state.history = { events: [] }
  }
}

function getLatestNodeMilestone(
  state: WorkflowState,
  nodeId: string,
  key: string,
): { mark?: boolean; detail?: unknown } | null {
  const events = state.history?.events
  if (!events) {
    return null
  }

  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i]
    if (event.type !== 'milestone.set' || event.nodeId !== nodeId || event.key !== key) {
      continue
    }
    if (typeof event.value === 'object' && event.value !== null) {
      return event.value as { mark?: boolean; detail?: unknown }
    }
    return null
  }

  return null
}

function createNodeContextSetters(state: WorkflowState): {
  setMilestone: (input: { key: string; mark: boolean; detail: unknown }) => void
  setInfo: (patch: Record<string, unknown>) => void
} {
  return {
    setMilestone: ({ key, mark, detail }) => {
      setCurrentNodeMilestone(state, {
        key,
        milestone: {
          mark,
          detail,
          updatedAt: new Date().toISOString(),
        },
      })
    },
    setInfo: patch => {
      patchCurrentNodeInfo(state, patch)
    },
  }
}

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
  return getDefinitionStageOrder(definition);
}

export function initializeWorkflowState(definition: WorkflowDefinition, selectedStages?: string[]): WorkflowState {
  HyperDesignerLogger.debug("Workflow", "初始化工作流状态", { workflowId: definition.id });

  const stageOrder = getDefinitionStageOrder(definition)
  const selectedSet = new Set(selectedStages ?? stageOrder)
  const workflow: Record<string, WorkflowStage> = {};
  for (const stage of stageOrder) {
    // 如果提供了 selectedStages，则根据它设置 selected；否则默认全部选中
    const isSelected = selectedStages ? selectedStages.includes(stage) : true;
    workflow[stage] = { mark: false, selected: isSelected };
  }

  // Compute neighbor links for selected stages
  const selectedStageList = selectedStages ?? stageOrder;
  for (let i = 0; i < selectedStageList.length; i++) {
    const currentStage = selectedStageList[i];
    const previousStage = i > 0 ? selectedStageList[i - 1] : null;
    const nextStage = i < selectedStageList.length - 1 ? selectedStageList[i + 1] : null;

    if (workflow[currentStage]) {
      workflow[currentStage].previousStage = previousStage;
      workflow[currentStage].nextStage = resolveNextSelectedStage(definition, selectedSet, currentStage) ?? nextStage;
    }
  }

  const state: WorkflowState = {
    initialized: false,
    typeId: definition.id,
    projectRoot: process.cwd(),
    workflow,
    current: null,
  };
  ensureRuntimeInitialized(state)
  state.runtime!.flow.nextNodeId = typeof definition.entryStageId === 'string' ? createMainNodeId(definition.entryStageId) : null

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
    projectRoot: null,
    workflow: {},
    current: null,
  };
  return uninitializedState;
}


/**
 * Updates the completion status of a workflow stage
 * @param stageName Name of the stage to update
 * @param mark Whether the stage is completed
 * @returns Updated workflow state
 */
export function setWorkflowStage(stageName: string, mark: boolean): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置工作流阶段状态", {
    stage: stageName,
    status: mark ? "completed" : "not completed"
  });

  const state = ensureWorkflowStateExists();

  if (state.workflow[stageName]) {
    state.workflow[stageName].mark = mark;
    writeWorkflowStateFile(state);
    HyperDesignerLogger.debug("Workflow", "工作流阶段状态更新完成", {
      stage: stageName,
      status: mark
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
      // 从工作流定义获取阶段对应的 agent
      const definition = state.typeId ? getWorkflowDefinition(state.typeId) : null;
      const stageAgent = definition?.stages[stepName]?.agent;
      state.current = {
        name: stepName,
        handoverTo: null,
        previousStage: neighbors.previousStage,
        nextStage: neighbors.nextStage,
        ...(stageAgent ? { agent: stageAgent } : {}),
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
 * 1. 如果当前没有活动阶段，只能交接给第一个被选中的阶段
 * 2. 如果有活动阶段，只能交接给下一个被选中的阶段或返回之前的阶段
 * 3. 不允许向前跳过被选中的阶段
 * 
 * @param stageName Name of the stage to hand over to, or null to clear
 * @param definition Workflow definition
 * @returns Updated workflow state
 */
export function setWorkflowHandover(stageName: string | null, definition: WorkflowDefinition): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置工作流交接目标", { targetStage: stageName });

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
    // 初始逻辑：如果没有当前活动阶段，创建一个初始 current 对象
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
  if (stageName === null) {
    state.current.handoverTo = null;
    writeWorkflowStateFile(state);
    HyperDesignerLogger.debug("Workflow", "工作流交接目标已清除");
    return state;
  }

  // 验证目标阶段是否存在
  if (!state.workflow[stageName]) {
    HyperDesignerLogger.warn("Workflow", "无效的工作流阶段", {
      targetStage: stageName,
      availableStages: Object.keys(state.workflow),
      error: `Invalid workflow stage: ${stageName}`
    });
    return incrementCurrentFailureCount();
  }

  // 获取被选中的阶段列表（按拓扑顺序）
  const stageOrder = getDefinitionStageOrder(definition)
  const selectedStages = stageOrder.filter(s => state.workflow[s]?.selected !== false);
  const firstSelectedStage = selectedStages[0];

  if (state.current.name === null) {
    // 初始交接验证：只能交接给第一个被选中的阶段
    if (stageName === firstSelectedStage) {
      state.current.handoverTo = stageName;
      writeWorkflowStateFile(state);
      HyperDesignerLogger.debug("Workflow", "初始交接目标设置完成", { targetStage: stageName });
      return state;
    }

    HyperDesignerLogger.warn("Workflow", "无法设置交接：没有当前活动阶段且目标不是首个被选中的阶段", {
      targetStage: stageName,
      firstSelectedStage
    });
    return incrementCurrentFailureCount();
  }

  const currentIndex = selectedStages.indexOf(state.current.name);
  const targetIndex = selectedStages.indexOf(stageName);

  // 目标阶段不在被选中列表中
  if (targetIndex === -1) {
    HyperDesignerLogger.warn("Workflow", "目标阶段未被选中", {
      targetStage: stageName,
      selectedStages
    });
    return incrementCurrentFailureCount();
  }

  // 正常逻辑：只允许下一个阶段或向后阶段
  const isNextStage = targetIndex === currentIndex + 1;
  const isBackwardStage = targetIndex <= currentIndex;

  if (!isNextStage && !isBackwardStage) {
    HyperDesignerLogger.warn("Workflow", "无法跳过阶段设置交接", {
      currentStage: state.current.name,
      currentIndex,
      targetStage: stageName,
      targetIndex,
      validation: "noStageSkipping",
      error: "Cannot skip stages"
    });
    return incrementCurrentFailureCount();
  }

  state.current.handoverTo = stageName;
  const neighbors = resolveCurrentNeighbors(state.workflow, state.current.name)
  state.current.previousStage = neighbors.previousStage
  state.current.nextStage = neighbors.nextStage
  writeWorkflowStateFile(state);
  HyperDesignerLogger.debug("Workflow", "工作流交接目标设置完成", { targetStage: stageName });
  return state;
}


interface GateEvaluationInput {
  detail: GateMilestoneDetail;
  stage?: string | null;
}

interface StageMilestoneInput {
  nodeId: string
  milestone: {
    type: string
    mark: boolean
    detail: unknown
  }
}

function createGateMilestone(detail: GateMilestoneDetail): StageMilestone {
  const passed = typeof detail.score === 'number' && detail.score > GATE_PASS_THRESHOLD
  return {
    type: GATE_MILESTONE_KEY,
    timestamp: new Date().toISOString(),
    mark: passed,
    detail,
  };
}
export function setWorkflowGateResult(gateEvaluation: GateEvaluationInput): WorkflowState {
  HyperDesignerLogger.info("Workflow", "设置门禁结果", { stage: gateEvaluation.stage });
  const state = ensureWorkflowStateExists();

  const stageKey = gateEvaluation.stage ?? state.current?.name;
  if (stageKey) {
    const nodeId = createMainNodeId(stageKey)
    setCurrentNodeMilestone(state, {
      key: GATE_MILESTONE_KEY,
      milestone: {
        mark: createGateMilestone(gateEvaluation.detail).mark,
        detail: gateEvaluation.detail,
        updatedAt: new Date().toISOString(),
      },
    })
    appendHistoryEvent(state, {
      type: 'milestone.set',
      nodeId,
      key: GATE_MILESTONE_KEY,
      value: {
        mark: createGateMilestone(gateEvaluation.detail).mark,
        detail: gateEvaluation.detail,
      },
    })
  }

  writeWorkflowStateFile(state);
  return state;
}

export function setWorkflowStageMilestone(input: StageMilestoneInput): WorkflowState {
  HyperDesignerLogger.info('Workflow', '设置节点里程碑', { nodeId: input.nodeId, type: input.milestone.type })
  const state = ensureWorkflowStateExists()
  setCurrentNodeMilestone(state, {
    key: input.milestone.type,
    milestone: {
      mark: input.milestone.mark,
      detail: input.milestone.detail,
      updatedAt: new Date().toISOString(),
    },
  })
  appendHistoryEvent(state, {
    type: 'milestone.set',
    nodeId: input.nodeId,
    key: input.milestone.type,
    value: {
      mark: input.milestone.mark,
      detail: input.milestone.detail,
    },
  })
  writeWorkflowStateFile(state)
  return state
}

/**
 * Executes a pending workflow handover
 * @param definition Workflow definition
 * @returns Updated workflow state
 * @throws Error if workflow not initialized
 */
export async function executeWorkflowHandover(definition: WorkflowDefinition, sessionID?: string, adapter?: WorkflowPlatformAdapter): Promise<WorkflowState> {
  HyperDesignerLogger.info("Workflow", "执行工作流交接");

  const state = readWorkflowStateFile();

  // 检查工作流是否已选择（允许首次交接：initialized 为 false 但 typeId 已设置）
  if (state === null || !state.typeId) {
    const error = "Workflow not selected. Call hd_workflow_select first.";
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

  ensureRuntimeInitialized(state)

  // 获取被选中的阶段列表（按拓扑顺序）
  const selectedStages = getDefinitionStageOrder(definition).filter(s => state.workflow[s]?.selected !== false);
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
    state.workflow[fromStep].mark = true;
    HyperDesignerLogger.debug("Workflow", "步骤标记为完成", { step: fromStep });
  } else if (toIndex < fromIndex && fromStep !== null) {
    // 重置正在重新访问的步骤的完成状态
    for (let i = toIndex; i <= fromIndex; i++) {
      const step = selectedStages[i];
      if (step) {
        state.workflow[step].mark = false;
      }
      HyperDesignerLogger.debug("Workflow", "步骤标记为未完成", { step });
    }
  }

  // Phase 1: after 钩子在 stage 切换之前执行（重入由 WorkflowService 内存锁保护）
  const departingStage = fromStep ? definition.stages[fromStep] : null;
  const incomingStage = definition.stages[toStep];
  const departingAfterHooks = departingStage ? departingStage.after ?? [] : []

  try {
    if (departingStage && departingAfterHooks.length > 0) {
      HyperDesignerLogger.debug("Workflow", "执行 after 钩子", { step: fromStep, hookCount: departingAfterHooks.length });
      for (const [i, hook] of departingAfterHooks.entries()) {
        const { fn, agent: hookAgent } = hook;
        const hookId = hook.id
        const nodeId = createHookNodeId(fromStep!, 'after', hookId ?? `after-${i}`)
        setCurrentNodeContext(state, { nodeId, visit: 1, attempt: 1 })
        appendHistoryEvent(state, { type: 'node.entered', nodeId })
        const setters = createNodeContextSetters(state)
        if (state.current) {
          state.current.agent = hookAgent ?? departingStage.agent;
          if (state.runtime) {
            state.runtime.flow.fromNodeId = state.runtime.flow.currentNodeId
            state.runtime.flow.currentNodeId = nodeId
            state.runtime.flow.nextNodeId = createMainNodeId(toStep)
          }
          writeWorkflowStateFile(state);
        }
        await fn({ stageKey: fromStep!, stageName: departingStage.name, workflow: definition, nodeId, setMilestone: setters.setMilestone, setInfo: setters.setInfo, ...(sessionID !== undefined && { sessionID }), ...(adapter !== undefined && { adapter }) });
        flushCurrentNodeContextToHistory(state)
        appendHistoryEvent(state, { type: 'node.completed', nodeId })
      }
    }
  } catch (error) {
    // after hook 失败时清除 handoverTo 防止重复执行
    if (state.current) {
      state.current.handoverTo = null;
      writeWorkflowStateFile(state);
    }
    throw error;
  }

  // Stage 切换
  const previousNodeId = state.runtime?.flow.currentNodeId ?? null
  const nextMainNodeId = createMainNodeId(toStep)
  appendHistoryEvent(state, {
    type: 'transition',
    fromNodeId: previousNodeId,
    toNodeId: nextMainNodeId,
    reason: 'normal',
  })
  state.current = {
    name: toStep,
    handoverTo: null,
    agent: incomingStage.agent,
    previousStage: state.workflow[toStep]?.previousStage ?? null,
    nextStage: state.workflow[toStep]?.nextStage ?? null,
    failureCount: 0,
  };

  // 首次交接：设置 initialized 为 true
  if (!state.initialized) {
    state.initialized = true;
    HyperDesignerLogger.info("Workflow", "工作流首次交接完成，初始化状态已设置");
  }

  setCurrentNodeContext(state, { nodeId: nextMainNodeId, visit: 1, attempt: 1 })
  appendHistoryEvent(state, { type: 'node.entered', nodeId: nextMainNodeId })
  if (state.runtime) {
    state.runtime.flow.fromNodeId = previousNodeId
    state.runtime.flow.currentNodeId = nextMainNodeId
    state.runtime.flow.nextNodeId = null
  }

  writeWorkflowStateFile(state);
  HyperDesignerLogger.info("Workflow", "工作流交接执行完成", {
    toStep,
    workflowId: state.typeId
  });

  // Phase 2: before 钩子在 stage 切换之后执行
  const incomingBeforeHooks = incomingStage ? incomingStage.before ?? [] : []
  if (incomingStage && incomingBeforeHooks.length > 0) {
    HyperDesignerLogger.debug("Workflow", "执行 before 钩子", { step: toStep, hookCount: incomingBeforeHooks.length });
    for (const [i, hook] of incomingBeforeHooks.entries()) {
      const { fn, agent: hookAgent } = hook;
      const hookId = hook.id
      const nodeId = createHookNodeId(toStep, 'before', hookId ?? `before-${i}`)
      appendHistoryEvent(state, {
        type: 'transition',
        fromNodeId: state.runtime?.flow.currentNodeId ?? null,
        toNodeId: nodeId,
        reason: 'normal',
      })
      setCurrentNodeContext(state, { nodeId, visit: 1, attempt: 1 })
      appendHistoryEvent(state, { type: 'node.entered', nodeId })
      const setters = createNodeContextSetters(state)
      if (state.current) {
        state.current.agent = hookAgent ?? incomingStage.agent;
        if (state.runtime) {
          state.runtime.flow.fromNodeId = createMainNodeId(toStep)
          state.runtime.flow.currentNodeId = nodeId
          state.runtime.flow.nextNodeId = createMainNodeId(toStep)
        }
        writeWorkflowStateFile(state);
      }
      await fn({ stageKey: toStep, stageName: incomingStage.name, workflow: definition, nodeId, setMilestone: setters.setMilestone, setInfo: setters.setInfo, ...(sessionID !== undefined && { sessionID }), ...(adapter !== undefined && { adapter }) });
      flushCurrentNodeContextToHistory(state)
      appendHistoryEvent(state, { type: 'node.completed', nodeId })
    }
    // before hooks 执行完成后，恢复 agent 为阶段主流程的 agent
    if (state.current) {
      state.current.agent = incomingStage.agent;
      writeWorkflowStateFile(state);
    }
  }

  if (state.current) {
    appendHistoryEvent(state, {
      type: 'transition',
      fromNodeId: state.runtime?.flow.currentNodeId ?? null,
      toNodeId: nextMainNodeId,
      reason: 'normal',
    })
    setCurrentNodeContext(state, { nodeId: nextMainNodeId, visit: 1, attempt: 1 })
    if (state.runtime) {
      state.runtime.flow.fromNodeId = state.runtime.flow.currentNodeId
      state.runtime.flow.currentNodeId = nextMainNodeId
      state.runtime.flow.nextNodeId = state.current.nextStage ? createMainNodeId(state.current.nextStage) : null
    }
    writeWorkflowStateFile(state);
  }
  // 交接完成：取消旧会话（fire-and-forget）
  if (adapter && sessionID) {
    adapter.cancelSession({ sessionId: sessionID }).catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error))
      HyperDesignerLogger.warn('Workflow', `取消旧会话失败: ${err.message}`, {
        sessionId: sessionID,
        action: 'cancelSession',
        recovery: 'continueHandover',
      })
    })
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

  if (fromStage) {
    appendHistoryEvent(state, {
      type: 'milestone.set',
      nodeId: createMainNodeId(fromStage),
      key: FORCE_ADVANCE_MILESTONE_KEY,
      value: {
        mark: true,
        detail: {
          reason: 'Forced transition after 1+ failed handover attempts',
        },
      },
    })
  }

  writeWorkflowStateFile(state);
  return state;
}

export function areRequiredMilestonesCompletedForStage(state: WorkflowState, definition: WorkflowDefinition, stageKey: string): boolean {
  const requiredMilestones = getRequiredMilestones(definition, stageKey)
  if (requiredMilestones.length === 0) {
    return true
  }

  const mainNodeId = createMainNodeId(stageKey)
  return requiredMilestones.every(key => {
    const milestone = getLatestNodeMilestone(state, mainNodeId, key)
    return milestone?.mark === true
  })
}
