/**
 * Tests for lifecycle hook execution ordering during workflow handover.
 *
 * Guarantees:
 * 1. afterStage hooks of the departing stage run first
 * 2. beforeStage hooks of the incoming stage run second
 * 3. adapter.sendPrompt() is called only AFTER both hook phases complete
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { existsSync, rmSync } from "fs"
import { join } from "path"
import { executeWorkflowHandover } from "../../../workflows/core"
import { readWorkflowStateFile, writeWorkflowStateFile } from "../../../workflows/core/state"
import type { WorkflowDefinition, StageHookFn, PlatformAdapter } from "../../../workflows/core"
import { createMockAdapter } from "../../helpers/mockAdapter"
import type { SendPromptParams, SendPromptResult } from "../../../adapters/types"

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")

// ─── helpers ────────────────────────────────────────────────────────────────

function makeWorkflow(overrides?: {
  afterStage?: StageHookFn[],
  beforeStage?: StageHookFn[],
}): WorkflowDefinition {
  return {
    id: "test-ordering",
    name: "Test Ordering Workflow",
    description: "Workflow for testing hook ordering",
    stageOrder: ["stage1", "stage2"],
    stages: {
      stage1: {
        name: "Stage 1",
        description: "First stage",
        agent: "AgentA",
        getHandoverPrompt: () => "Enter stage 1",
        ...(overrides?.afterStage !== undefined ? { afterStage: overrides.afterStage } : {}),
      },
      stage2: {
        name: "Stage 2",
        description: "Second stage",
        agent: "AgentB",
        getHandoverPrompt: () => "Enter stage 2",
        ...(overrides?.beforeStage !== undefined ? { beforeStage: overrides.beforeStage } : {}),
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
      gateResult: null,
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

  it("calls afterStage of departing stage before beforeStage of incoming stage", async () => {
    const callOrder: string[] = []

    const afterHook: StageHookFn = async () => {
      callOrder.push("afterStage:stage1")
    }
    const beforeHook: StageHookFn = async () => {
      callOrder.push("beforeStage:stage2")
    }

    const def = makeWorkflow({ afterStage: [afterHook], beforeStage: [beforeHook] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    expect(callOrder).toEqual(["afterStage:stage1", "beforeStage:stage2"])
  })

  it("awaits afterStage hooks fully before running beforeStage hooks", async () => {
    const callOrder: string[] = []

    // afterStage that completes asynchronously after a small delay
    const afterHook: StageHookFn = async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 10))
      callOrder.push("afterStage:stage1-done")
    }
    const beforeHook: StageHookFn = async () => {
      callOrder.push("beforeStage:stage2")
    }

    const def = makeWorkflow({ afterStage: [afterHook], beforeStage: [beforeHook] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    expect(callOrder[0]).toBe("afterStage:stage1-done")
    expect(callOrder[1]).toBe("beforeStage:stage2")
  })

  it("awaits beforeStage hooks fully before executeWorkflowHandover returns", async () => {
    let beforeStageDone = false

    const beforeHook: StageHookFn = async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 10))
      beforeStageDone = true
    }

    const def = makeWorkflow({ beforeStage: [beforeHook] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    // The function has returned — beforeStage must be complete
    expect(beforeStageDone).toBe(true)
  })

  it("runs multiple afterStage hooks in order before any beforeStage hook", async () => {
    const callOrder: string[] = []

    const afterHook1: StageHookFn = async () => { callOrder.push("after1") }
    const afterHook2: StageHookFn = async () => { callOrder.push("after2") }
    const beforeHook1: StageHookFn = async () => { callOrder.push("before1") }
    const beforeHook2: StageHookFn = async () => { callOrder.push("before2") }

    const def = makeWorkflow({
      afterStage: [afterHook1, afterHook2],
      beforeStage: [beforeHook1, beforeHook2],
    })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    expect(callOrder).toEqual(["after1", "after2", "before1", "before2"])
  })

  it("afterStage 看到的 currentStage 是离开的阶段（fromStep）", async () => {
    let currentStageDuringAfterHook: string | null = "not-set"

    const afterHook: StageHookFn = async () => {
      const s = readWorkflowStateFile()
      currentStageDuringAfterHook = s?.current?.name ?? null

    }

    const def = makeWorkflow({ afterStage: [afterHook] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    // afterStage 尚未切换，应该看到尚未更新的 currentStage（离开的阶段）
    expect(currentStageDuringAfterHook).toBe("stage1")
  })

  it("beforeStage 看到的 currentStage 是进入的阶段（toStep）", async () => {
    let currentStageDuringBeforeHook: string | null = "not-set"

    const beforeHook: StageHookFn = async () => {
      const s = readWorkflowStateFile()
      currentStageDuringBeforeHook = s?.current?.name ?? null

    }

    const def = makeWorkflow({ beforeStage: [beforeHook] })
    setupInitialState(def)

    await executeWorkflowHandover(def)

    expect(currentStageDuringBeforeHook).toBe("stage2")
  })
})

describe("event-handler ordering: sendPrompt called after executeHandover completes", () => {
  /**
   * This is a unit test of the event-handler contract:
   * The adapter.sendPrompt() must be called AFTER executeWorkflowHandover resolves,
   * meaning all beforeStage hooks have completed.
   */
  it("sendPrompt is not called until beforeStage hooks complete", async () => {
    const callOrder: string[] = []
    let resolveBeforeHook!: () => void

    const beforeHook: StageHookFn = async () => {
      await new Promise<void>((resolve) => {
        resolveBeforeHook = resolve
      })
      callOrder.push("beforeStage:done")
    }

    const def = makeWorkflow({ beforeStage: [beforeHook] })
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

    expect(callOrder).toEqual(["beforeStage:done", "sendPrompt:called"])
  })
})
