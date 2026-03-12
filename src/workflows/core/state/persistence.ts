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
import type { CurrentStageState, StageMilestone, WorkflowStage, WorkflowState } from './types'
import { HyperDesignerLogger } from '../../../utils/logger'
import { GATE_MILESTONE_KEY, GATE_PASS_THRESHOLD } from '../stageMilestone'

/** Path to the workflow state file */
const WORKFLOW_STATE_PATH = join(process.cwd(), '.hyper-designer', 'workflow_state.json')

interface ParsedWorkflowState {
  initialized?: boolean;
  typeId?: string;
  workflow?: Record<string, unknown>;
  current?: Record<string, unknown>;
  currentStage?: string;
  handoverTo?: string | null;
  selectedStages?: string[];
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitizeMilestones(value: unknown): Record<string, StageMilestone> {
  if (!isObjectRecord(value)) {
    return {}
  }

  const milestones: Record<string, StageMilestone> = {}
  for (const [key, milestone] of Object.entries(value)) {
    if (!isObjectRecord(milestone)) {
      continue
    }
    if (typeof milestone.type !== 'string' || typeof milestone.timestamp !== 'string' || !('detail' in milestone)) {
      continue
    }

    const providedCompletion = (milestone as { isCompleted?: unknown }).isCompleted
    const score = (milestone as { detail?: { score?: unknown } }).detail?.score
    const inferredCompletion =
      milestone.type === GATE_MILESTONE_KEY && typeof score === 'number'
        ? score > GATE_PASS_THRESHOLD
        : true

    milestones[key] = {
      type: milestone.type,
      timestamp: milestone.timestamp,
      isCompleted: typeof providedCompletion === 'boolean' ? providedCompletion : inferredCompletion,
      detail: milestone.detail,
    }
  }

  return milestones
}

function sanitizeWorkflowStage(value: unknown): WorkflowStage {
  const stage = isObjectRecord(value) ? value : {}

  const normalized: WorkflowStage = {
    isCompleted: Boolean(stage.isCompleted),
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

  const milestones = sanitizeMilestones(stage.stageMilestones)
  if (Object.keys(milestones).length > 0) {
    normalized.stageMilestones = milestones
  }

  return normalized
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
      isCompleted: Boolean(stageValue.isCompleted),
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
    if (stageValue.stageMilestones && Object.keys(stageValue.stageMilestones).length > 0) {
      stage.stageMilestones = stageValue.stageMilestones
    }

    sanitizedWorkflow[stageKey] = stage
  }

  return {
    initialized: state.initialized,
    typeId: state.typeId,
    workflow: sanitizedWorkflow,
    current: state.current
      ? {
          name: state.current.name,
          handoverTo: state.current.handoverTo,
          previousStage: state.current.previousStage ?? null,
          nextStage: state.current.nextStage ?? null,
          failureCount: state.current.failureCount ?? 0,
        }
      : null,
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

    const state: WorkflowState = {
      initialized: parsed.initialized ?? (typeof parsed.typeId === 'string'),
      typeId: typeof parsed.typeId === 'string' ? parsed.typeId : null,
      workflow,
      current,
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
    writeFileSync(WORKFLOW_STATE_PATH, JSON.stringify(sanitizedState, null, 2), 'utf-8')
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
