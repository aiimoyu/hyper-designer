import type { ToolDefinition } from '../toolTypes'

/**
 * WorkflowService - 工作流服务类
 *
 * 提供工作流状态管理的统一接口，封装状态操作并提供事件通知。
 * 作为工作流引擎的核心服务层，负责状态持久化和业务逻辑协调。
 */

import { EventEmitter } from "events";
import type { StageTransitionDefinition, WorkflowDefinition, PlatformAdapter, MilestoneDefinition, StageFileItem } from "../types";
import type { WorkflowState, GateMilestoneDetail } from "../state/types";
import {
  getWorkflowState,
  areRequiredMilestonesCompletedForStage,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowStageMilestone,
  setWorkflowHandover,
  executeWorkflowHandover,
  forceWorkflowNextStep,
  writeWorkflowStateFile,
} from "../state";
import { getWorkflowDefinition, getAvailableWorkflows } from "../registry";
import { getHandoverAgent, getHandoverPrompt } from "../runtime/handover";
import { HyperDesignerLogger } from "../../../utils/logger";
import {
  GATE_MILESTONE_KEY,
  GATE_PASS_THRESHOLD,
  isGateMilestoneDetail,
} from '../stageMilestone'
import { checkStageOutputs, formatMissingOutputsMessage } from '../outputChecker'

function getStageOrder(definition: WorkflowDefinition): string[] {
  const visited = new Set<string>()
  const order: string[] = []
  const walk = (stageId: string): void => {
    if (visited.has(stageId) || !definition.stages[stageId]) {
      return
    }
    visited.add(stageId)
    order.push(stageId)
    const transitions: StageTransitionDefinition[] = definition.stages[stageId].transitions ?? []
    const autoTransitions = [...transitions]
      .filter(item => item.mode === 'auto')
      .sort((a, b) => a.priority - b.priority)
    for (const transition of autoTransitions) {
      walk(transition.toStageId)
    }
  }
  if (typeof definition.entryStageId === 'string') {
    walk(definition.entryStageId)
  }
  for (const stageId of Object.keys(definition.stages)) {
    if (!visited.has(stageId)) {
      walk(stageId)
    }
  }
  return order
}

function resolveNextSelectedStage(
  definition: WorkflowDefinition,
  selectedSet: Set<string>,
  fromStageId: string,
): string | null {
  const visited = new Set<string>()
  let current: string | null = fromStageId

  while (current !== null) {
    if (visited.has(current)) {
      throw new Error(`Detected transition cycle while resolving next stage from ${fromStageId}`)
    }
    visited.add(current)

    const stage = definition.stages[current]
    if (!stage) {
      return null
    }

    const transitions: StageTransitionDefinition[] = stage.transitions ?? []
    const nextTransition = [...transitions]
      .filter(item => item.mode === 'auto')
      .sort((a, b) => a.priority - b.priority)[0]

    if (!nextTransition) {
      return null
    }

    const candidate = nextTransition.toStageId
    if (selectedSet.has(candidate)) {
      return candidate
    }
    current = candidate
  }

  return null
}

function createMainNodeId(stageId: string): string {
  return `workflow.${stageId}.main`
}

function createBeforeNodeId(stageId: string, hookId: string): string {
  return `workflow.${stageId}.before.${hookId}`
}

function createAfterNodeId(stageId: string, hookId: string): string {
  return `workflow.${stageId}.after.${hookId}`
}

function buildInstancePlan(
  definition: WorkflowDefinition,
  selectedStageKeys: string[],
): {
  entryNodeId: string
  nodePlan: Record<string, {
    nodeId: string
    stageId: string
    kind: 'before' | 'main' | 'after'
    hookId?: string
    fromNodeId: string | null
    nextNodeId: string | null
  }>
} {
  const stageOrder = getStageOrder(definition)
  const selectedSet = new Set(selectedStageKeys)
  const nodePlan: Record<string, {
    nodeId: string
    stageId: string
    kind: 'before' | 'main' | 'after'
    hookId?: string
    fromNodeId: string | null
    nextNodeId: string | null
  }> = {}

  const stageEntryNode = (stageId: string): string => {
    const stage = definition.stages[stageId]
    const beforeHooks = stage ? (stage.before ?? []) : []
    if (beforeHooks.length > 0) {
      const hookId = beforeHooks[0]?.id ?? 'before-0'
      return createBeforeNodeId(stageId, hookId)
    }
    return createMainNodeId(stageId)
  }

  for (const stageId of selectedStageKeys) {
    const stage = definition.stages[stageId]
    if (!stage) {
      continue
    }
    const beforeHooks = stage.before ?? []
    const afterHooks = stage.after ?? []

    const beforeNodeIds = beforeHooks.map((hook, index) =>
      createBeforeNodeId(stageId, hook.id ?? `before-${index}`),
    )
    const mainNodeId = createMainNodeId(stageId)
    const afterNodeIds = afterHooks.map((hook, index) =>
      createAfterNodeId(stageId, hook.id ?? `after-${index}`),
    )

    for (let i = 0; i < beforeNodeIds.length; i += 1) {
      const nodeId = beforeNodeIds[i]!
      const hookId = beforeHooks[i]?.id
      nodePlan[nodeId] = {
        nodeId,
        stageId,
        kind: 'before',
        ...(hookId ? { hookId } : {}),
        fromNodeId: i === 0 ? null : beforeNodeIds[i - 1]!,
        nextNodeId: i < beforeNodeIds.length - 1 ? beforeNodeIds[i + 1]! : mainNodeId,
      }
    }

    nodePlan[mainNodeId] = {
      nodeId: mainNodeId,
      stageId,
      kind: 'main',
      fromNodeId: beforeNodeIds.length > 0 ? beforeNodeIds[beforeNodeIds.length - 1]! : null,
      nextNodeId: null,
    }

    for (let i = 0; i < afterNodeIds.length; i += 1) {
      const nodeId = afterNodeIds[i]!
      const hookId = afterHooks[i]?.id
      nodePlan[nodeId] = {
        nodeId,
        stageId,
        kind: 'after',
        ...(hookId ? { hookId } : {}),
        fromNodeId: i === 0 ? mainNodeId : afterNodeIds[i - 1]!,
        nextNodeId: i < afterNodeIds.length - 1 ? afterNodeIds[i + 1]! : null,
      }
    }

    if (afterNodeIds.length > 0) {
      nodePlan[mainNodeId].nextNodeId = afterNodeIds[0]!
    }

  const fallbackNext = (() => {
      const idx = stageOrder.indexOf(stageId)
      if (idx < 0) {
        return null
      }
      for (let i = idx + 1; i < stageOrder.length; i += 1) {
        const candidate = stageOrder[i]!
        if (selectedSet.has(candidate)) {
          return candidate
        }
      }
      return null
    })()

  const resolvedNextStage = resolveNextSelectedStage(definition, selectedSet, stageId) ?? fallbackNext
    const resolvedNextNode = resolvedNextStage ? stageEntryNode(resolvedNextStage) : null

    if (afterNodeIds.length > 0) {
      const terminalAfterNode = afterNodeIds[afterNodeIds.length - 1]!
      nodePlan[terminalAfterNode].nextNodeId = resolvedNextNode
    } else {
      nodePlan[mainNodeId].nextNodeId = resolvedNextNode
    }
  }

  const firstStage = selectedStageKeys[0]
  const entryNodeId = firstStage ? stageEntryNode(firstStage) : ''
  return {
    entryNodeId,
    nodePlan,
  }
}

/**
 * WorkflowService 事件类型映射
 */
export interface WorkflowServiceEvents {
  stageCompleted: { stageName: string; isCompleted: boolean };
  currentChanged: { previousStep: string | null; newStep: string };
  handoverScheduled: { targetStep: string };
  handoverExecuted: { fromStep: string; toStep: string };
  gateChanged: { score: number | null; comment?: string | null; stage?: string | null };
}

/**
 * hdScheduleHandover 返回值类型
 */
export interface HandoverResult {
  success: boolean;
  handover_to?: string;
  instruction?: string;
  error?: string;
  state?: WorkflowState;
}

export interface ForceNextStepResult {
  success: boolean;
  error?: string;
  reason?: string;
  state?: WorkflowState;
}

/**
 * 工作流摘要信息
 */
export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  stageCount: number;
}

/**
 * 阶段详情
 */
export interface StageDetail {
  key: string;
  name: string;
  description: string;
  required: boolean;
  agent: string;
  inputs?: StageFileItem[];
  outputs?: StageFileItem[];
}

/**
 * 工作流详情
 */
export interface WorkflowDetail {
  id: string;
  name: string;
  description: string;
  stages: StageDetail[];
}

/**
 * 选择工作流参数
 */
export interface SelectWorkflowParams {
  typeId: string;
  stages: Array<{ key: string; selected: boolean }>;
}

/**
 * 选择工作流结果
 */
export interface SelectWorkflowResult {
  success: boolean;
  state?: WorkflowState;
  error?: string;
}

/**
 * 工作流服务类
 *
 * 提供工作流状态管理的统一接口，封装底层状态操作并提供事件通知机制。
 * 使用模块级单例模式确保全局状态一致性。
 */
export class WorkflowService extends EventEmitter {
  private definition: WorkflowDefinition | null = null;
  /** 内存锁：防止 session.idle 在 after 钩子执行期间触发重入交接 */
  private _handoverInProgress = false;

  private incrementCurrentFailureCount(): WorkflowState | null {
    const state = getWorkflowState();
    if (!state?.current) {
      return state;
    }

    state.current.failureCount = (state.current.failureCount ?? 0) + 1;
    writeWorkflowStateFile(state);
    return state;
  }

  private getGateDetail(stageKey: string): GateMilestoneDetail | null {
    const state = getWorkflowState();
    const mainNodeId = createMainNodeId(stageKey)
    const events = state?.history?.events ?? []
    let detail: unknown = null
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i]
      if (event.type !== 'milestone.set' || event.nodeId !== mainNodeId || event.key !== GATE_MILESTONE_KEY) {
        continue
      }
      if (typeof event.value === 'object' && event.value !== null && 'detail' in event.value) {
        detail = (event.value as { detail?: unknown }).detail
      }
      break
    }
    if (!isGateMilestoneDetail(detail)) {
      return null;
    }
    return {
      score: detail.score,
      ...(detail.comment === undefined ? {} : { comment: detail.comment ?? null }),
    };
  }

  private getGateScore(stageKey: string): number | null {
    return this.getGateDetail(stageKey)?.score ?? null;
  }

  private getRequiredHandoverMilestones(stageKey: string): (string | MilestoneDefinition)[] {
    const stageDefinition = this.definition?.stages[stageKey]
    if (!stageDefinition) {
      return []
    }

    if (stageDefinition.requiredMilestones !== undefined) {
      return [...stageDefinition.requiredMilestones]
    }

    return []
  }

  private getMilestoneId(milestone: string | MilestoneDefinition): string {
    return typeof milestone === 'string' ? milestone : milestone.id
  }

  private getMilestoneFailureMessage(milestone: string | MilestoneDefinition): string {
    return typeof milestone === 'string' ? `请先完成里程碑 "${milestone}"` : milestone.failureMessage
  }

  /**
   * 创建工作流服务实例
   * 断点恢复时从 state 恢复 definition
   */
  constructor() {
    super();
    this.definition = this.tryRestoreDefinition();
  }

  /**
   * 断点恢复：从 state 读取 typeId 并获取 definition
   */
  private tryRestoreDefinition(): WorkflowDefinition | null {
    const state = getWorkflowState();
    // 恢复条件：typeId 已设置即可（initialized 可能为 false，在首次 handover 前）
    if (state?.typeId) {
      const definition = getWorkflowDefinition(state.typeId);
      if (definition) {
        HyperDesignerLogger.debug("Workflow", "断点恢复：从 state 恢复工作流定义", {
          workflowId: state.typeId,
          initialized: state.initialized
        });
        return definition;
      }
    }
    return null;
  }

  /**
   * 检查工作流是否已初始化
   * @returns 是否已初始化
   */
  isInitialized(): boolean {
    const state = getWorkflowState();
    return state?.initialized === true;
  }

  /**
   * 获取当前活动阶段
   * @returns 当前阶段名称或 null（无活动阶段）
   */
  getCurrentStage(): string | null {
    const state = getWorkflowState();
    return state?.current?.name ?? null;
  }


  /**
   * 获取工作流定义
   * @returns 当前工作流定义或 null（未初始化）
   */
  getDefinition(): WorkflowDefinition | null {
    return this.definition;
  }

  /**
   * 获取当前工作流状态
   * @returns 工作流状态或 null（无状态）
   */
  getState(): WorkflowState | null {
    return getWorkflowState();
  }

  // ─── 工作流选择 API ──────────────────────────────────────────────────────────────

  /**
   * 获取所有已注册的工作流列表
   * @returns 工作流摘要列表
   */
  listWorkflows(): WorkflowSummary[] {
    const workflowIds = getAvailableWorkflows();
    return workflowIds.map(id => {
      const definition = getWorkflowDefinition(id);
      return {
        id,
        name: definition?.name ?? id,
        description: definition?.description ?? '',
        stageCount: definition ? getStageOrder(definition).length : 0,
      };
    });
  }

  /**
   * 获取指定工作流的详情
   * @param typeId 工作流类型 ID
   * @returns 工作流详情或 null（不存在）
   */
  getWorkflowDetail(typeId: string): WorkflowDetail | null {
    const definition = getWorkflowDefinition(typeId);
    if (!definition) {
      return null;
    }

    const stageOrder = getStageOrder(definition)
    const stages: StageDetail[] = stageOrder.map(stageKey => {
      const stageDef = definition.stages[stageKey];
      return {
        key: stageKey,
        name: stageDef.name,
        description: stageDef.description,
        required: stageDef.required ?? false,
        agent: stageDef.agent,
        ...(stageDef.inputs ? { inputs: stageDef.inputs } : {}),
        ...(stageDef.outputs ? { outputs: stageDef.outputs } : {}),
      };
    });

    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      stages,
    };
  }

  /**
   * 选择并初始化工作流
   * @param params 选择参数，包含 typeId 和 stages 选择
   * @returns 选择结果
   */
  selectWorkflow(params: SelectWorkflowParams): SelectWorkflowResult {
    const { typeId, stages } = params;

    // 检查 typeId 是否有效
    const definition = getWorkflowDefinition(typeId);
    if (!definition) {
      return {
        success: false,
        error: `Unknown workflow: ${typeId}`,
      };
    }

    // 检查是否已选择（不允许重复选择）
    const currentState = getWorkflowState();
    if (currentState?.typeId) {
      return {
        success: false,
        error: `Workflow already selected. Current workflow: ${currentState.typeId}`,
      };
    }

    // 构建阶段选择映射
    const stageSelectionMap = new Map<string, boolean>();
    for (const { key, selected } of stages) {
      stageSelectionMap.set(key, selected);
    }

    // 找出所有 required stages
    const stageOrder = getStageOrder(definition)
    const requiredStages = stageOrder.filter(
      stageKey => definition.stages[stageKey]?.required !== false
    );

    // 检查是否所有 required stages 都被选中
    const missingRequiredStages = requiredStages.filter(
      stageKey => stageSelectionMap.get(stageKey) !== true
    );

    if (missingRequiredStages.length > 0) {
      return {
        success: false,
        error: `Missing required stages: ${missingRequiredStages.join(', ')}`,
      };
    }

    // 获取选中的阶段列表（按拓扑顺序）
    const selectedStageKeys = stageOrder.filter(
      stageKey => stageSelectionMap.get(stageKey) === true
    );

    // 创建初始状态
    const workflow: Record<string, { isCompleted: boolean; selected?: boolean; previousStage?: string | null; nextStage?: string | null }> = {};
    for (const stageKey of stageOrder) {
      workflow[stageKey] = {
        isCompleted: false,
        selected: stageSelectionMap.get(stageKey) ?? false,
      };
    }

    // Compute neighbor links for selected stages
    for (let i = 0; i < selectedStageKeys.length; i++) {
      const currentStage = selectedStageKeys[i]!;
      const previousStage = i > 0 ? selectedStageKeys[i - 1]! : null;
      const nextStage = i < selectedStageKeys.length - 1 ? selectedStageKeys[i + 1]! : null;

      if (workflow[currentStage]) {
        workflow[currentStage].previousStage = previousStage;
        workflow[currentStage].nextStage = nextStage;
      }
    }

    const newState: WorkflowState = {
      initialized: false,
      typeId: definition.id,
      workflow,
      current: null,
    };

    const instancePlan = buildInstancePlan(definition, selectedStageKeys)
    newState.instance = {
      instanceId: `${definition.id}-${Date.now()}`,
      workflowId: definition.id,
      workflowVersion: definition.version ?? 'v1',
      selectedStageIds: selectedStageKeys,
      skippedStageIds: stageOrder.filter(stageKey => !selectedStageKeys.includes(stageKey)),
      entryNodeId: instancePlan.entryNodeId,
      nodePlan: instancePlan.nodePlan,
    }

    newState.runtime = {
      status: 'running',
      flow: {
        fromNodeId: null,
        currentNodeId: null,
        nextNodeId: instancePlan.entryNodeId || null,
        lastEventSeq: 0,
      },
      currentNodeContext: null,
    }
    newState.history = {
      events: [],
    }

    // 缓存 definition
    this.definition = definition;

    // 写入状态
    writeWorkflowStateFile(newState);

    HyperDesignerLogger.info("Workflow", "工作流选择完成", {
      workflowId: definition.id,
      selectedStages: selectedStageKeys,
    });

    return {
      success: true,
      state: newState,
    };
  }

  // ─── 阶段操作 API ──────────────────────────────────────────────────────────────

  /**
   * 设置阶段完成状态
   * @param stageName 阶段名称
   * @param isCompleted 是否完成
   * @returns 更新后的工作流状态
   */
  setStage(stageName: string, isCompleted: boolean): WorkflowState {
    const state = setWorkflowStage(stageName, isCompleted);
    if (state.workflow[stageName]) {
      this.emit('stageCompleted', { stageName, isCompleted });
    }
    return state;
  }

  /**
   * 设置当前活动步骤
   * @param stepName 步骤名称或 null（清除当前步骤）
   * @returns 更新后的工作流状态
   */
  setCurrent(stepName: string): WorkflowState {
    const previousStep = this.getCurrentStage();
    const state = setWorkflowCurrent(stepName);
    if (state.current?.name === stepName) {
      this.emit('currentChanged', { previousStep, newStep: stepName });
    }
    return state;
  }


  /**
   * 设置工作流交接目标
   * @param stepName 目标步骤名称或 null（清除交接）
   * @returns 更新后的工作流状态
   */
  setHandover(stepName: string | null): WorkflowState {
    if (!this.definition) {
      throw new Error("Workflow not initialized. Call selectWorkflow first.");
    }
    const state = setWorkflowHandover(stepName, this.definition);
    if (stepName !== null && state.current?.handoverTo === stepName) {
      this.emit('handoverScheduled', { targetStep: stepName });
    }
    return state;
  }


  /**
   * 执行工作流交接
   * @param sessionID 可选的会话ID
   * @param adapter 可选的平台适配器
   * @returns 更新后的工作流状态
   */
  async executeHandover(sessionID?: string, adapter?: PlatformAdapter): Promise<WorkflowState> {
    if (!this.definition) {
      throw new Error("Workflow not initialized. Call selectWorkflow first.");
    }
    const fromStep = this.getCurrentStage();
    const preState = this.getState();
    const toStep = preState?.current?.handoverTo ?? null;
    this._handoverInProgress = true;
    try {
      const state = await executeWorkflowHandover(this.definition, sessionID, adapter);
      if (toStep !== null && state.current?.name === toStep) {
        this.emit('handoverExecuted', { fromStep: fromStep ?? '', toStep });
      }
      return state;
    } finally {
      this._handoverInProgress = false;
    }
  }

  /**
   * 检查是否有交接正在执行中（内存锁）
   * 供 event-handler 在 session.idle 时查询，防止重入
   * @returns 是否有交接正在执行
   */
  isHandoverInProgress(): boolean {
    return this._handoverInProgress;
  }


  // ─── 质量门 API ──────────────────────────────────────────────────────────────────────

  /**
   * 检查质量门是否通过（score > 75）
   * @returns 门禁是否通过
   */
  isGateApproved(): boolean {
    const currentStage = this.getCurrentStage();
    if (!currentStage) {
      return false;
    }
    const score = this.getGateScore(currentStage);
    return typeof score === 'number' && score > GATE_PASS_THRESHOLD;
  }

  /**
   * 设置质量门结果（score + comment）
   * 仅供 HCritic 调用。
   * @param params 质量门结果参数
   * @returns 更新后的工作流状态
   */
  setGateResult(params: { score: number | null; comment?: string | null; stage?: string | null }): WorkflowState {
    const currentStage = this.getCurrentStage();
    const targetStage = params.stage ?? currentStage;
    const detail: GateMilestoneDetail = {
      score: params.score,
      comment: params.comment ?? null,
    };
    if (!targetStage) {
      return this.getState() ?? {
        initialized: false,
        typeId: null,
        workflow: {},
        current: null,
      }
    }
    const isCompleted = typeof detail.score === 'number' && detail.score > GATE_PASS_THRESHOLD
    const state = this.setStageMilestone({
      stage: targetStage,
      milestone: {
        type: GATE_MILESTONE_KEY,
        isCompleted,
        detail,
      },
    })
    this.emit('gateChanged', { score: detail.score, comment: detail.comment, stage: targetStage });
    return state;
  }

  setStageMilestone(params: { stage: string; milestone: { type: string; isCompleted: boolean; detail: unknown } }): WorkflowState {
    const nodeId = `workflow.${params.stage}.main`
    return setWorkflowStageMilestone({ nodeId, milestone: params.milestone })
  }
  // ─── 平台无关工具方法（供 plugin 工具直接调用）─────────────────────────────────

  /**
   * 获取完整工作流状态（供 hd_workflow_state 工具使用）
   * @returns 工作流状态或未初始化信息对象
   */
  hdGetWorkflowState(): WorkflowState | { initialized: false; message: string } {
    const state = getWorkflowState();
    if (state === null || !state.initialized) {
      return {
        initialized: false,
        message: "Workflow not initialized. Use hd_workflow_list to see available workflows, then use hd_workflow_select to choose one.",
      };
    }
    return state;
  }

  /**
   * 调度工作流交接（供 hd_handover 工具使用）
   *
   * 在调度交接前验证质量门是否通过（score > 75）。
   * 成功时返回包含 instruction 的对象，要求 Agent 立即停止所有工作。
   *
   * @param stepName 目标步骤名称（可选）。若省略，自动计算下一阶段：
   *                 - 当前阶段为 null → 第一个被选中的阶段
   *                 - 当前阶段不为 null → 下一个被选中的阶段
   * @returns 结构化结果对象
   */
  async hdScheduleHandover(stepName?: string): Promise<HandoverResult> {
    // 检查工作流是否已初始化
    if (!this.definition) {
      return {
        success: false,
        error: "Workflow not initialized. Use hd_workflow_select to choose a workflow first.",
      };
    }

    const state = this.getState();
    const currentStage = this.getCurrentStage();
    const selectedStages = getStageOrder(this.definition).filter(
      s => state?.workflow[s]?.selected !== false
    );

    // 计算目标阶段：若未提供 stepName，自动选择下一阶段
    let targetStep: string;
    if (stepName) {
      targetStep = stepName;
    } else if (!currentStage && state?.current === null) {
      // 初始状态：选择第一个被选中的阶段
      targetStep = selectedStages[0];
    } else if (currentStage) {
      // 有当前阶段：选择下一个被选中的阶段
      const currentIndex = selectedStages.indexOf(currentStage);
      if (currentIndex === -1) {
        return {
          success: false,
          error: `当前阶段 "${currentStage}" 不在被选中的阶段列表中。`,
        };
      }
      const nextIndex = currentIndex + 1;
      if (nextIndex >= selectedStages.length) {
        return {
          success: false,
          error: `当前阶段 "${currentStage}" 已是最后一个阶段，无法继续交接。`,
        };
      }
      targetStep = selectedStages[nextIndex];
    } else {
      return {
        success: false,
        error: '当前阶段未设置，无法执行交接。',
      };
    }

    // 初始状态：允许从无阶段进入第一个被选中的阶段
    if (!currentStage && state?.current === null) {
      const firstSelectedStage = selectedStages[0];

      if (targetStep !== firstSelectedStage) {
        return {
          success: false,
          error: `初始交接只能进入第一个阶段 "${firstSelectedStage}"，不能直接进入 "${targetStep}"。`,
        };
      }

      // 设置交接目标（setWorkflowHandover 会创建 current 对象并设置 handoverTo）
      const newState = this.setHandover(targetStep);

      if (newState.current?.handoverTo !== targetStep) {
        return {
          success: false,
          error: `无法设置初始交接目标 "${targetStep}"。`,
        };
      }

      return {
        success: true,
        handover_to: targetStep,
        instruction:
          "You have successfully scheduled the handover. NOW STOP ALL WORK and return to the user immediately. Do NOT continue with any tasks, do NOT call any other tools. The system will automatically process the handover when this session enters idle state.",
        state: newState,
      };
    }

    if (!currentStage) {
      return {
        success: false,
        error: '当前阶段未设置，无法执行交接。',
      };
    }

    const requiredMilestones = this.getRequiredHandoverMilestones(currentStage)
    const stateForCheck = this.getState()
    const incompleteMilestones = requiredMilestones.filter(milestone => {
      const milestoneId = this.getMilestoneId(milestone)
      if (!stateForCheck || !this.definition) {
        return true
      }
      const completed = areRequiredMilestonesCompletedForStage(stateForCheck, this.definition, currentStage)
      if (milestoneId === GATE_MILESTONE_KEY) {
        return !completed
      }
      const mainNodeId = `workflow.${currentStage}.main`
      const events = stateForCheck.history?.events ?? []
      for (let i = events.length - 1; i >= 0; i -= 1) {
        const event = events[i]
        if (event.type !== 'milestone.set' || event.nodeId !== mainNodeId || event.key !== milestoneId) {
          continue
        }
        if (typeof event.value === 'object' && event.value !== null && 'isCompleted' in event.value) {
          return (event.value as { isCompleted?: unknown }).isCompleted !== true
        }
      }
      return true
    })

    if (incompleteMilestones.length > 0) {
      this.incrementCurrentFailureCount();
      const failureMessages = incompleteMilestones.map(m => this.getMilestoneFailureMessage(m))
      return {
        success: false,
        error: `阶段交接所需里程碑未完成：\n${failureMessages.join('\n')}`,
      };
    }

    // 检查当前阶段的输出文件是否完整
    const currentStageDef = this.definition.stages[currentStage]
    if (currentStageDef?.outputs && currentStageDef.outputs.length > 0) {
      const outputCheck = await checkStageOutputs(currentStageDef.outputs)
      if (!outputCheck.success) {
        this.incrementCurrentFailureCount();
        const missingMessage = formatMissingOutputsMessage(outputCheck.missing, outputCheck.matchCounts)
        return {
          success: false,
          error: missingMessage,
        };
      }
    }

    // 调度交接
    const handoverState = this.setHandover(targetStep);

    // 如果 handoverTo 没有设置成功（被验证逻辑拒绝），返回错误
    if (handoverState.current?.handoverTo !== targetStep) {
      return {
        success: false,
        error: `无法设置交接目标 "${targetStep}"。请检查目标步骤是否有效，或是否试图跳过步骤。`,
      };
    }

    return {
      success: true,
      handover_to: targetStep,
      instruction:
        "You have successfully scheduled the handover. NOW STOP ALL WORK and return to the user immediately. Do NOT continue with any tasks, do NOT call any other tools. The system will automatically process the handover when this session enters idle state.",
      state: handoverState,
    };
  }

  hdForceNextStep(): ForceNextStepResult {
    if (!this.definition) {
      return {
        success: false,
        error: "Workflow not initialized. Use hd_workflow_select to choose a workflow first.",
        reason: "workflow not initialized",
      };
    }

    const result = forceWorkflowNextStep(this.definition);
    if ('error' in result) {
      return {
        success: false,
        error: result.error,
        reason: result.reason,
      };
    }

    return {
      success: true,
      state: result,
    };
  }



  /**
   * 获取指定阶段的交接代理名称
   * @param stage 阶段名称
   * @returns 代理名称或 null（阶段不存在时）
   */
  getHandoverAgent(stage: string): string | null {
    if (!this.definition) return null;
    return getHandoverAgent(this.definition, stage);
  }

  /**
   * 获取阶段间交接提示词
   * @param currentStage 当前阶段名称
   * @param nextStep 目标阶段名称
   * @returns 交接提示词或 null
   */
  getHandoverPrompt(currentStage: string | null, nextStep: string): string | null {
    if (!this.definition) return null;
    return getHandoverPrompt(this.definition, currentStage, nextStep);
  }

  /**
   * 获取所有已注册工作流的工具列表
   * 
   * 从工作流注册表中收集所有工作流定义的 tools 字段，
   * 供插件入口在初始化时注册到平台。
   * 
   * @returns 所有工作流提供的工具定义列表
   */
  listAllTools(): ToolDefinition[] {
    const allTools: ToolDefinition[] = []
    
    for (const workflowId of getAvailableWorkflows()) {
      const definition = getWorkflowDefinition(workflowId)
      if (definition?.tools) {
        allTools.push(...definition.tools)
      }
    }
    
    return allTools
  }

  /**
   * 重置工作流状态
   * 当前为空操作 - 磁盘是唯一数据源，无内存缓存需要清除
   */
  reset(): void {
    // No-op: disk is source of truth, no in-memory cache to clear
    // Method signature preserved for future use
  }
}

/**
 * 全局工作流服务单例实例
 */
export const workflowService = new WorkflowService();
