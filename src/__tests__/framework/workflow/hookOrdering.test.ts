/**
 * Tests for lifecycle hook execution ordering during workflow handover.
 *
 * Guarantees:
 * 1. after hooks of the departing stage run first
 * 2. before hooks of the incoming stage run second
 * 3. adapter.sendPrompt() is called only AFTER both hook phases complete
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { existsSync, rmSync } from "fs"
import { join } from "path"
import { executeWorkflowHandover } from "../../../workflows/core"
import { readWorkflowStateFile, writeWorkflowStateFile } from "../../../workflows/core/state"
import type { WorkflowDefinition, StageHookFn, StageHook, PlatformAdapter } from "../../../workflows/core"
import { createMockAdapter } from "../../helpers/mockAdapter"
import type { SendPromptParams, SendPromptResult } from "../../../platformBridge/capabilities/types"

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")

// ─── helpers ────────────────────────────────────────────────────────────────

function makeWorkflow(overrides?: {
  after?: StageHook[],
  before?: StageHook[],
}): WorkflowDefinition {
  return {
    id: "test-ordering",
    name: "Test Ordering Workflow",
    description: "Workflow for testing hook ordering",
    entryStageId: 'stage1',
    stages: {
      stage1: {
        stageId: 'stage1',
        name: "Stage 1",
        description: "First stage",
        agent: "AgentA",
        transitions: [{ id: 'to-stage2', toStageId: 'stage2', mode: 'auto', priority: 0 }],
        getHandoverPrompt: () => "Enter stage 1",
        ...(overrides?.after !== undefined ? { after: overrides.after } : {}),
      },
      stage2: {
        stageId: 'stage2',
        name: "Stage 2",
        description: "Second stage",
        agent: "AgentB",
        getHandoverPrompt: () => "Enter stage 2",
        transitions: [],
        ...(overrides?.before !== undefined ? { before: overrides.before } : {}),
      },
    },
  }
}

function makeAdapterWithSpy(
  onSendPrompt: (params: SendPromptParams) => Promise<SendPromptResult>
): PlatformAdapter {
  return createMockAdapter({
    sendPrompt: vi.fn(onSendPrompt),
  })
}

function setupInitialState(def: WorkflowDefinition): void {
  writeWorkflowStateFile({
    initialized: true,
    typeId: def.id,
    workflow: {
      stage1: { isCompleted: false, selected: true },
      stage2: { isCompleted: false, selected: true },
    },
    current: {
      name: "stage1",
      handoverTo: "stage2",
    },
  })
}
// ─── setup / teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  if (existsSync(STATE_FILE)) {
    rmSync(STATE_FILE, { force: true })
  }
})

afterEach(() => {
  if (existsSync(STATE_FILE)) {
    rmSync(STATE_FILE, { force: true })
  }
})

// ─── tests ──────────────────────────────────────────────────────────────────

describe("hook execution ordering during executeWorkflowHandover", () => {

  it("calls after hook of departing stage before before hook of incoming stage", async () => {
    const callOrder: string[] = []

    const afterHook: StageHookFn = async () => {
      callOrder.push("after:stage1")
    }
    const beforeHook: StageHookFn = async () => {
      callOrder.push("before:stage2")
    }

    const def = makeWorkflow({ after: [{ fn: afterHook }], before: [{ fn: beforeHook }] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    expect(callOrder).toEqual(["after:stage1", "before:stage2"])
  })

  it("awaits after hooks fully before running before hooks", async () => {
    const callOrder: string[] = []

    // after hook that completes asynchronously after a small delay
    const afterHook: StageHookFn = async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 10))
      callOrder.push("after:stage1-done")
    }
    const beforeHook: StageHookFn = async () => {
      callOrder.push("before:stage2")
    }

    const def = makeWorkflow({ after: [{ fn: afterHook }], before: [{ fn: beforeHook }] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    expect(callOrder[0]).toBe("after:stage1-done")
    expect(callOrder[1]).toBe("before:stage2")
  })

  it("awaits before hooks fully before executeWorkflowHandover returns", async () => {
    let beforeDone = false

    const beforeHook: StageHookFn = async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 10))
      beforeDone = true
    }

    const def = makeWorkflow({ before: [{ fn: beforeHook }] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    // The function has returned — before hook must be complete
    expect(beforeDone).toBe(true)
  })

  it("runs multiple after hooks in order before any before hook", async () => {
    const callOrder: string[] = []

    const afterHook1: StageHookFn = async () => { callOrder.push("after1") }
    const afterHook2: StageHookFn = async () => { callOrder.push("after2") }
    const beforeHook1: StageHookFn = async () => { callOrder.push("before1") }
    const beforeHook2: StageHookFn = async () => { callOrder.push("before2") }

    const def = makeWorkflow({
      after: [{ fn: afterHook1 }, { fn: afterHook2 }],
      before: [{ fn: beforeHook1 }, { fn: beforeHook2 }],
    })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    expect(callOrder).toEqual(["after1", "after2", "before1", "before2"])
  })

  it("after hook 看到的 currentStage 是离开的阶段（fromStep）", async () => {
    let currentStageDuringAfterHook: string | null = "not-set"

    const afterHook: StageHookFn = async () => {
      const s = readWorkflowStateFile()
      currentStageDuringAfterHook = s?.current?.name ?? null

    }

    const def = makeWorkflow({ after: [{ fn: afterHook }] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    // after 尚未切换，应该看到尚未更新的 currentStage（离开的阶段）
    expect(currentStageDuringAfterHook).toBe("stage1")
  })

  it("before hook 看到的 currentStage 是进入的阶段（toStep）", async () => {
    let currentStageDuringBeforeHook: string | null = "not-set"

    const beforeHook: StageHookFn = async () => {
      const s = readWorkflowStateFile()
      currentStageDuringBeforeHook = s?.current?.name ?? null

    }

    const def = makeWorkflow({ before: [{ fn: beforeHook }] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    expect(currentStageDuringBeforeHook).toBe("stage2")
  })
})

describe("event-handler ordering: sendPrompt called after executeHandover completes", () => {
  /**
   * This is a unit test of the event-handler contract:
   * The adapter.sendPrompt() must be called AFTER executeWorkflowHandover resolves,
   * meaning all before hooks have completed.
   */
  it("sendPrompt is not called until before hooks complete", async () => {
    const callOrder: string[] = []
    let resolveBeforeHook!: () => void

    const beforeHook: StageHookFn = async () => {
      await new Promise<void>((resolve) => {
        resolveBeforeHook = resolve
      })
      callOrder.push("before:done")
    }

    const def = makeWorkflow({ before: [{ fn: beforeHook }] })
    setupInitialState(def)

    const sendPromptSpy = vi.fn<[SendPromptParams], Promise<SendPromptResult>>(async () => {
      callOrder.push("sendPrompt:called")
      return { text: "" }
    })
    const adapter = makeAdapterWithSpy(sendPromptSpy)

    // Simulate what event-handler does: executeHandover then sendPrompt
    const handoverPromise = executeWorkflowHandover(def, "session123", adapter).then(async () => {
      // This mirrors event-handler.ts line 78
      await sendPromptSpy({ sessionId: "session123", agent: "AgentB", text: "Enter stage 2" })
    })

    // beforeHook is suspended; sendPrompt should NOT have been called yet
    expect(callOrder).toEqual([])

    // Unblock beforeHook
    resolveBeforeHook()
    await handoverPromise

    expect(callOrder).toEqual(["before:done", "sendPrompt:called"])
  })
})
