import type {
  WorkflowCurrentMilestone,
  WorkflowHistoryEvent,
  WorkflowState,
} from './types'

function ensureHistory(state: WorkflowState): WorkflowHistoryEvent[] {
  if (!state.history) {
    state.history = { events: [] }
  }
  return state.history.events
}

function nextSeq(state: WorkflowState): number {
  const events = ensureHistory(state)
  const last = events[events.length - 1]
  return last ? last.seq + 1 : 1
}

function getRunId(state: WorkflowState): string {
  return state.instance?.instanceId ?? 'legacy-run'
}

export function appendHistoryEvent(
  state: WorkflowState,
  event: Omit<WorkflowHistoryEvent, 'seq' | 'at' | 'runId'>,
): WorkflowHistoryEvent {
  const events = ensureHistory(state)
  const item: WorkflowHistoryEvent = {
    seq: nextSeq(state),
    at: new Date().toISOString(),
    runId: getRunId(state),
    ...event,
  }
  events.push(item)
  if (!state.runtime) {
    state.runtime = {
      status: 'running',
      flow: {
        fromNodeId: null,
        currentNodeId: null,
        nextNodeId: null,
        lastEventSeq: item.seq,
      },
      currentNodeContext: null,
    }
  } else {
    state.runtime.flow.lastEventSeq = item.seq
  }
  return item
}

export function setCurrentNodeContext(
  state: WorkflowState,
  input: {
    nodeId: string
    visit: number
    attempt: number
  },
): void {
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

  state.runtime.currentNodeContext = {
    nodeId: input.nodeId,
    visit: input.visit,
    attempt: input.attempt,
    milestones: {},
    info: {},
  }
}

export function setCurrentNodeMilestone(
  state: WorkflowState,
  input: {
    key: string
    milestone: WorkflowCurrentMilestone
  },
): void {
  const context = state.runtime?.currentNodeContext
  if (!context) {
    return
  }
  context.milestones[input.key] = input.milestone
}

export function patchCurrentNodeInfo(
  state: WorkflowState,
  patch: Record<string, unknown>,
): void {
  const context = state.runtime?.currentNodeContext
  if (!context) {
    return
  }
  for (const [key, value] of Object.entries(patch)) {
    context.info[key] = value
  }
}

export function flushCurrentNodeContextToHistory(state: WorkflowState): void {
  const context = state.runtime?.currentNodeContext
  if (!context) {
    return
  }

  for (const [key, value] of Object.entries(context.milestones)) {
    appendHistoryEvent(state, {
      type: 'milestone.set',
      nodeId: context.nodeId,
      key,
      value,
    })
  }

  if (Object.keys(context.info).length > 0) {
    appendHistoryEvent(state, {
      type: 'node.info.updated',
      nodeId: context.nodeId,
      patch: context.info,
    })
  }

  context.milestones = {}
  context.info = {}
}
