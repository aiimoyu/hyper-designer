/**
 * 工作流状态持久化模块
 *
 * 负责工作流状态的文件读写操作，包括：
 * 1. 从 workflow_state.json 读取状态
 * 2. 将状态写入 workflow_state.json
 * 3. 确保状态文件目录存在
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type {
  CurrentStageState,
  WorkflowCurrentMilestone,
  WorkflowHistoryEvent,
  WorkflowStage,
  WorkflowState,
} from './types'
import { HyperDesignerLogger } from '../../utils/logger'

/** Path to the workflow state file */
const WORKFLOW_STATE_PATH = join(process.cwd(), '.hyper-designer', 'workflow_state.json')

interface ParsedWorkflowState {
  schemaVersion?: number;
  initialized?: boolean;
  typeId?: string;
  projectRoot?: string;
  plan?: unknown;
  execution?: unknown;
  workflow?: Record<string, unknown>;
  current?: Record<string, unknown>;
  currentStage?: string;
  handoverTo?: string | null;
  selectedStages?: string[];
  instance?: unknown;
  runtime?: unknown;
  history?: unknown;
}

interface PersistedPlanStage {
  inclusion: 'selected' | 'skipped';
  completed: boolean;
  previous?: string | null;
  next?: string | null;
}

interface PersistedPlan {
  instanceId?: string;
  workflowId?: string;
  workflowVersion?: string;
  entryNodeId?: string;
  nodePlan?: WorkflowState['instance'] extends infer T
  ? T extends { nodePlan: infer N }
  ? N
  : never
  : never;
  stages: Record<string, PersistedPlanStage>;
}

interface PersistedExecution {
  status: 'running' | 'completed' | 'failed';
  stage: {
    current: string | null;
    previous: string | null;
    next: string | null;
    handoverTo: string | null;
    failureCount: number;
    agent?: string;
  };
  node: {
    from: string | null;
    current: string | null;
    next: string | null;
    lastEventSeq: number;
    context: WorkflowState['runtime'] extends infer T
    ? T extends { currentNodeContext: infer C }
    ? C
    : null
    : null;
  };
}

function sanitizeHistory(value: unknown): { events: WorkflowHistoryEvent[] } | undefined {
  if (!isObjectRecord(value)) {
    return undefined
  }
  const rawEvents = Array.isArray(value.events) ? value.events : []
  const events: WorkflowHistoryEvent[] = []
  for (const item of rawEvents) {
    if (!isObjectRecord(item)) {
      continue
    }
    if (typeof item.seq !== 'number' || typeof item.at !== 'string' || typeof item.type !== 'string' || typeof item.runId !== 'string') {
      continue
    }
    const event: WorkflowHistoryEvent = {
      seq: item.seq,
      at: item.at,
      type: item.type,
      runId: item.runId,
    }
    if (typeof item.nodeId === 'string') {
      event.nodeId = item.nodeId
    }
    if (typeof item.fromNodeId === 'string' || item.fromNodeId === null) {
      event.fromNodeId = item.fromNodeId
    }
    if (typeof item.toNodeId === 'string' || item.toNodeId === null) {
      event.toNodeId = item.toNodeId
    }
    if (typeof item.reason === 'string') {
      event.reason = item.reason
    }
    if (typeof item.key === 'string') {
      event.key = item.key
    }
    if ('value' in item) {
      event.value = item.value
    }
    if (isObjectRecord(item.patch)) {
      event.patch = item.patch
    }
    events.push(event)
  }
  return { events }
}

function sanitizeRuntime(value: unknown): WorkflowState['runtime'] {
  if (!isObjectRecord(value)) {
    return undefined
  }

  const status = value.status
  const flow = isObjectRecord(value.flow) ? value.flow : null
  if ((status !== 'running' && status !== 'completed' && status !== 'failed') || !flow) {
    return undefined
  }

  const fromNodeId = typeof flow.fromNodeId === 'string' || flow.fromNodeId === null ? flow.fromNodeId : null
  const currentNodeId = typeof flow.currentNodeId === 'string' || flow.currentNodeId === null ? flow.currentNodeId : null
  const nextNodeId = typeof flow.nextNodeId === 'string' || flow.nextNodeId === null ? flow.nextNodeId : null
  const lastEventSeq = typeof flow.lastEventSeq === 'number' ? flow.lastEventSeq : 0

  const rawContext = isObjectRecord(value.currentNodeContext) ? value.currentNodeContext : null
  const milestones: Record<string, WorkflowCurrentMilestone> = {}
  if (rawContext && isObjectRecord(rawContext.milestones)) {
    for (const [key, milestone] of Object.entries(rawContext.milestones)) {
      if (!isObjectRecord(milestone)) {
        continue
      }
      if (typeof milestone.mark !== 'boolean' || typeof milestone.updatedAt !== 'string') {
        continue
      }
      milestones[key] = {
        name: typeof milestone.name === 'string' ? milestone.name : key,
        mark: milestone.mark,
        detail: 'detail' in milestone ? milestone.detail : null,
        updatedAt: milestone.updatedAt,
      }
    }
  }

  const currentNodeContext = rawContext && typeof rawContext.nodeId === 'string'
    ? {
      nodeId: rawContext.nodeId,
      visit: typeof rawContext.visit === 'number' ? rawContext.visit : 1,
      attempt: typeof rawContext.attempt === 'number' ? rawContext.attempt : 1,
      milestones,
      info: isObjectRecord(rawContext.info) ? rawContext.info : {},
    }
    : null

  return {
    status,
    flow: {
      fromNodeId,
      currentNodeId,
      nextNodeId,
      lastEventSeq,
    },
    currentNodeContext,
  }
}

function sanitizeInstance(value: unknown): WorkflowState['instance'] {
  if (!isObjectRecord(value)) {
    return undefined
  }
  if (
    typeof value.instanceId !== 'string'
    || typeof value.workflowId !== 'string'
    || typeof value.workflowVersion !== 'string'
    || !Array.isArray(value.selectedStageIds)
    || !Array.isArray(value.skippedStageIds)
    || typeof value.entryNodeId !== 'string'
    || !isObjectRecord(value.nodePlan)
  ) {
    return undefined
  }

  const selectedStageIds = value.selectedStageIds.filter((item): item is string => typeof item === 'string')
  const skippedStageIds = value.skippedStageIds.filter((item): item is string => typeof item === 'string')
  const nodePlan: NonNullable<WorkflowState['instance']>['nodePlan'] = {}
  for (const [key, node] of Object.entries(value.nodePlan)) {
    if (!isObjectRecord(node)) {
      continue
    }
    if (
      typeof node.nodeId !== 'string'
      || typeof node.stageId !== 'string'
      || (node.kind !== 'before' && node.kind !== 'main' && node.kind !== 'after')
      || (typeof node.fromNodeId !== 'string' && node.fromNodeId !== null)
      || (typeof node.nextNodeId !== 'string' && node.nextNodeId !== null)
    ) {
      continue
    }
    nodePlan[key] = {
      nodeId: node.nodeId,
      stageId: node.stageId,
      kind: node.kind,
      ...(typeof node.hookId === 'string' ? { hookId: node.hookId } : {}),
      ...(typeof node.agent === 'string' ? { agent: node.agent } : {}),
      fromNodeId: node.fromNodeId,
      nextNodeId: node.nextNodeId,
    }
  }

  return {
    instanceId: value.instanceId,
    workflowId: value.workflowId,
    workflowVersion: value.workflowVersion,
    selectedStageIds,
    skippedStageIds,
    entryNodeId: value.entryNodeId,
    nodePlan,
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitizeWorkflowStage(value: unknown): WorkflowStage {
  const stage = isObjectRecord(value) ? value : {}

  const normalized: WorkflowStage = {
    mark: Boolean(stage.mark),
  }

  if (typeof stage.selected === 'boolean') {
    normalized.selected = stage.selected
  }

  if (typeof stage.previousStage === 'string' || stage.previousStage === null) {
    normalized.previousStage = stage.previousStage
  }

  if (typeof stage.nextStage === 'string' || stage.nextStage === null) {
    normalized.nextStage = stage.nextStage
  }

  return normalized
}

function sanitizePlanState(plan: unknown): {
  workflow: Record<string, WorkflowStage>;
  instance?: WorkflowState['instance'];
} | null {
  if (!isObjectRecord(plan) || !isObjectRecord(plan.stages)) {
    return null
  }

  const workflow: Record<string, WorkflowStage> = {}
  for (const [stageKey, rawStage] of Object.entries(plan.stages)) {
    if (!isObjectRecord(rawStage)) {
      continue
    }
    const inclusion = rawStage.inclusion === 'selected' ? 'selected' : 'skipped'
    const stage: WorkflowStage = {
      mark: Boolean(rawStage.completed),
      selected: inclusion === 'selected',
    }
    if (typeof rawStage.previous === 'string' || rawStage.previous === null) {
      stage.previousStage = rawStage.previous
    }
    if (typeof rawStage.next === 'string' || rawStage.next === null) {
      stage.nextStage = rawStage.next
    }
    workflow[stageKey] = stage
  }

  const hasInstanceFields =
    typeof plan.instanceId === 'string'
    || typeof plan.workflowId === 'string'
    || typeof plan.workflowVersion === 'string'
    || typeof plan.entryNodeId === 'string'
    || isObjectRecord(plan.nodePlan)

  if (!hasInstanceFields) {
    return { workflow }
  }

  const selectedStageIds = Object.entries(workflow)
    .filter(([, stage]) => stage.selected !== false)
    .map(([stageKey]) => stageKey)
  const skippedStageIds = Object.entries(workflow)
    .filter(([, stage]) => stage.selected === false)
    .map(([stageKey]) => stageKey)

  const nodePlanValue = isObjectRecord(plan.nodePlan) ? plan.nodePlan : {}
  const instance = sanitizeInstance({
    instanceId: typeof plan.instanceId === 'string' ? plan.instanceId : 'legacy-instance',
    workflowId: typeof plan.workflowId === 'string' ? plan.workflowId : 'legacy-workflow',
    workflowVersion: typeof plan.workflowVersion === 'string' ? plan.workflowVersion : '1.0.0',
    selectedStageIds,
    skippedStageIds,
    entryNodeId: typeof plan.entryNodeId === 'string' ? plan.entryNodeId : 'workflow.entry',
    nodePlan: nodePlanValue,
  })

  return {
    workflow,
    ...(instance ? { instance } : {}),
  }
}

function sanitizeExecutionState(execution: unknown): {
  current: CurrentStageState | null;
  runtime?: WorkflowState['runtime'];
} | null {
  if (!isObjectRecord(execution) || !isObjectRecord(execution.stage) || !isObjectRecord(execution.node)) {
    return null
  }

  const stage = execution.stage
  const node = execution.node
  const runtime = sanitizeRuntime({
    status: execution.status,
    flow: {
      fromNodeId: node.from,
      currentNodeId: node.current,
      nextNodeId: node.next,
      lastEventSeq: node.lastEventSeq,
    },
    currentNodeContext: node.context,
  })

  const current: CurrentStageState = {
    name: typeof stage.current === 'string' || stage.current === null ? stage.current : null,
    handoverTo: typeof stage.handoverTo === 'string' || stage.handoverTo === null ? stage.handoverTo : null,
    previousStage: typeof stage.previous === 'string' || stage.previous === null ? stage.previous : null,
    nextStage: typeof stage.next === 'string' || stage.next === null ? stage.next : null,
    failureCount: typeof stage.failureCount === 'number' ? stage.failureCount : 0,
    ...(typeof stage.agent === 'string' ? { agent: stage.agent } : {}),
  }

  const isEmptyCurrent =
    current.name === null
    && current.handoverTo === null
    && (current.previousStage ?? null) === null
    && (current.nextStage ?? null) === null
    && (current.failureCount ?? 0) === 0
    && current.agent === undefined

  return {
    current: isEmptyCurrent ? null : current,
    ...(runtime ? { runtime } : {}),
  }
}

function sanitizeCurrentState(parsed: ParsedWorkflowState): CurrentStageState | null {
  const parsedCurrent = isObjectRecord(parsed.current) ? parsed.current : null
  if (parsedCurrent) {
    const previousStage =
      typeof parsedCurrent.previousStage === 'string' || parsedCurrent.previousStage === null
        ? parsedCurrent.previousStage
        : null
    const nextStage =
      typeof parsedCurrent.nextStage === 'string' || parsedCurrent.nextStage === null
        ? parsedCurrent.nextStage
        : null

    const current: CurrentStageState = {
      name: typeof parsedCurrent.name === 'string' || parsedCurrent.name === null ? parsedCurrent.name : null,
      handoverTo: typeof parsedCurrent.handoverTo === 'string' || parsedCurrent.handoverTo === null ? parsedCurrent.handoverTo : null,
      previousStage,
      nextStage,
      failureCount: typeof parsedCurrent.failureCount === 'number' ? parsedCurrent.failureCount : 0,
      ...(typeof parsedCurrent.agent === 'string' ? { agent: parsedCurrent.agent } : {}),
    }
    return current
  }

  if (typeof parsed.currentStage === 'string') {
    return {
      name: parsed.currentStage,
      handoverTo: typeof parsed.handoverTo === 'string' || parsed.handoverTo === null ? parsed.handoverTo : null,
      previousStage: null,
      nextStage: null,
      failureCount: 0,
    }
  }

  return null
}

function sanitizeStateForWrite(state: WorkflowState): WorkflowState {
  const sanitizedWorkflow: Record<string, WorkflowStage> = {}
  for (const [stageKey, stageValue] of Object.entries(state.workflow)) {
    const stage: WorkflowStage = {
      mark: Boolean(stageValue.mark),
    }

    if (typeof stageValue.selected === 'boolean') {
      stage.selected = stageValue.selected
    }
    if (typeof stageValue.previousStage === 'string' || stageValue.previousStage === null) {
      stage.previousStage = stageValue.previousStage
    }
    if (typeof stageValue.nextStage === 'string' || stageValue.nextStage === null) {
      stage.nextStage = stageValue.nextStage
    }
    sanitizedWorkflow[stageKey] = stage
  }

  return {
    initialized: state.initialized,
    typeId: state.typeId,
    projectRoot: state.projectRoot ?? null,
    workflow: sanitizedWorkflow,
    current: state.current
      ? {
        name: state.current.name,
        handoverTo: state.current.handoverTo,
        previousStage: state.current.previousStage ?? null,
        nextStage: state.current.nextStage ?? null,
        failureCount: state.current.failureCount ?? 0,
        ...(state.current.agent ? { agent: state.current.agent } : {}),
      }
      : null,
    ...(state.instance ? { instance: state.instance } : {}),
    ...(state.runtime ? { runtime: state.runtime } : {}),
    ...(state.history ? { history: state.history } : {}),
  }
}

function buildPlanForWrite(state: WorkflowState): PersistedPlan {
  const stages: Record<string, PersistedPlanStage> = {}
  for (const [stageKey, stage] of Object.entries(state.workflow)) {
    const normalized: PersistedPlanStage = {
      inclusion: stage.selected === false ? 'skipped' : 'selected',
      completed: Boolean(stage.mark),
    }
    if (typeof stage.previousStage === 'string' || stage.previousStage === null) {
      normalized.previous = stage.previousStage
    }
    if (typeof stage.nextStage === 'string' || stage.nextStage === null) {
      normalized.next = stage.nextStage
    }
    stages[stageKey] = normalized
  }

  return {
    ...(state.instance?.instanceId ? { instanceId: state.instance.instanceId } : {}),
    ...(state.instance?.workflowId ? { workflowId: state.instance.workflowId } : {}),
    ...(state.instance?.workflowVersion ? { workflowVersion: state.instance.workflowVersion } : {}),
    ...(state.instance?.entryNodeId ? { entryNodeId: state.instance.entryNodeId } : {}),
    ...(state.instance?.nodePlan ? { nodePlan: state.instance.nodePlan } : {}),
    stages,
  }
}

function buildExecutionForWrite(state: WorkflowState): PersistedExecution {
  return {
    status: state.runtime?.status ?? 'running',
    stage: {
      current: state.current?.name ?? null,
      previous: state.current?.previousStage ?? null,
      next: state.current?.nextStage ?? null,
      handoverTo: state.current?.handoverTo ?? null,
      failureCount: state.current?.failureCount ?? 0,
      ...(state.current?.agent ? { agent: state.current.agent } : {}),
    },
    node: {
      from: state.runtime?.flow.fromNodeId ?? null,
      current: state.runtime?.flow.currentNodeId ?? null,
      next: state.runtime?.flow.nextNodeId ?? null,
      lastEventSeq: state.runtime?.flow.lastEventSeq ?? 0,
      context: state.runtime?.currentNodeContext ?? null,
    },
  }
}

/**
 * 获取工作流状态文件路径（供测试使用）
 * @returns 状态文件的绝对路径
 */
export function getWorkflowStatePath(): string {
  return WORKFLOW_STATE_PATH
}

/**
 * Reads the workflow state from the JSON file
 * @returns Workflow state if file exists and is valid, null otherwise
 */
export function readWorkflowStateFile(): WorkflowState | null {
  try {
    if (!existsSync(WORKFLOW_STATE_PATH)) {
      HyperDesignerLogger.debug('Workflow', '工作流状态文件不存在', { path: WORKFLOW_STATE_PATH })
      return null
    }

    HyperDesignerLogger.debug('Workflow', '读取工作流状态文件', { path: WORKFLOW_STATE_PATH })
    const data = readFileSync(WORKFLOW_STATE_PATH, 'utf-8')
    const parsed = JSON.parse(data) as ParsedWorkflowState

    if (parsed.schemaVersion === 2) {
      const parsedPlan = sanitizePlanState(parsed.plan)
      const parsedExecution = sanitizeExecutionState(parsed.execution)

      const workflow = parsedPlan?.workflow ?? {}
      const current = parsedExecution?.current ?? null
      const instance = parsedPlan?.instance
      const runtime = parsedExecution?.runtime
      const history = sanitizeHistory(parsed.history)

      const state: WorkflowState = {
        initialized: parsed.initialized ?? (typeof parsed.typeId === 'string'),
        typeId: typeof parsed.typeId === 'string' ? parsed.typeId : null,
        projectRoot: typeof parsed.projectRoot === 'string' ? parsed.projectRoot : null,
        workflow,
        current,
        ...(instance !== undefined ? { instance } : {}),
        ...(runtime !== undefined ? { runtime } : {}),
        ...(history !== undefined ? { history } : {}),
      }

      HyperDesignerLogger.debug('Workflow', '工作流状态读取完成(v2)', {
        currentStage: state.current?.name || null,
        workflowId: state.typeId,
      })
      return state
    }

    const workflow: Record<string, WorkflowStage> = {}
    if (isObjectRecord(parsed.workflow)) {
      for (const [stageKey, stageValue] of Object.entries(parsed.workflow)) {
        workflow[stageKey] = sanitizeWorkflowStage(stageValue)
      }
    }

    // 从旧的 selectedStages 迁移到 workflow[].selected
    if (Array.isArray(parsed.selectedStages)) {
      for (const stageKey of Object.keys(workflow)) {
        workflow[stageKey].selected = parsed.selectedStages.includes(stageKey)
      }
    }

    const current = sanitizeCurrentState(parsed)

    const instance = sanitizeInstance(parsed.instance)
    const runtime = sanitizeRuntime(parsed.runtime)
    const history = sanitizeHistory(parsed.history)

    const state: WorkflowState = {
      initialized: parsed.initialized ?? (typeof parsed.typeId === 'string'),
      typeId: typeof parsed.typeId === 'string' ? parsed.typeId : null,
      projectRoot: typeof parsed.projectRoot === 'string' ? parsed.projectRoot : null,
      workflow,
      current,
      ...(instance !== undefined ? { instance } : {}),
      ...(runtime !== undefined ? { runtime } : {}),
      ...(history !== undefined ? { history } : {}),
    }

    HyperDesignerLogger.debug('Workflow', '工作流状态读取完成', {
      currentStage: state.current?.name || null,
      workflowId: state.typeId,
    })
    return state
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.warn('Workflow', '读取工作流状态文件失败', {
      path: WORKFLOW_STATE_PATH,
      action: 'readStateFile',
      error: err.message,
    })
    return null
  }
}


/**
 * Writes the workflow state to the JSON file
 * @param state Workflow state to write
 */
export function writeWorkflowStateFile(state: WorkflowState): void {
  try {
    HyperDesignerLogger.debug('Workflow', '写入工作流状态文件', { path: WORKFLOW_STATE_PATH })

    const dir = dirname(WORKFLOW_STATE_PATH)
    if (!existsSync(dir)) {
      HyperDesignerLogger.debug('Workflow', '创建目录', { directory: dir })
      mkdirSync(dir, { recursive: true })
    }

    const sanitizedState = sanitizeStateForWrite(state)
    const persisted = {
      schemaVersion: 2,
      initialized: sanitizedState.initialized,
      typeId: sanitizedState.typeId,
      plan: buildPlanForWrite(sanitizedState),
      execution: buildExecutionForWrite(sanitizedState),
      ...(sanitizedState.history ? { history: sanitizedState.history } : {}),
    }
    writeFileSync(WORKFLOW_STATE_PATH, JSON.stringify(persisted, null, 2), 'utf-8')
    HyperDesignerLogger.debug('Workflow', '工作流状态写入完成', {
      currentStage: state.current?.name || null,
      workflowId: state.typeId,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.error('Workflow', '写入工作流状态文件失败', err, {
      path: WORKFLOW_STATE_PATH,
      action: 'writeStateFile',
    })
    throw error
  }
}
