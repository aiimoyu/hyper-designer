import { describe, it, expect, beforeEach, vi } from "vitest"
import type { PluginInput, ToolContext } from "@opencode-ai/plugin"
import { existsSync, rmSync } from "fs"
import { join } from "path"
import { workflowService } from "../../../workflows/core/service"

vi.mock("@opencode-ai/plugin", () => {
  const tool = (definition: Record<string, unknown>) => definition
  // Chainable Zod-like stub: every method returns itself so .string().optional().describe() works
  const chainable: Record<string, unknown> = {}
  const chainFn = () => chainable
  chainable.describe = chainFn
  chainable.optional = chainFn
  chainable.nullable = chainFn
  chainable.min = chainFn
  chainable.max = chainFn
  tool.schema = {
    enum: () => chainable,
    boolean: () => chainable,
    number: () => chainable,
    string: () => chainable,
    object: () => chainable,
    array: () => chainable,
  }
  return { tool }
})

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")

function initClassicWorkflowSelection(): void {
  const detail = workflowService.getWorkflowDetail("classic")
  if (!detail) {
    throw new Error("Classic workflow detail should be defined")
  }

  const stages = detail.stageOrder.map(key => ({ key, selected: true }))
  const result = workflowService.selectWorkflow({ typeId: "classic", stages })
  if (!result.success && !result.error?.includes("already initialized")) {
    throw new Error(result.error ?? "Failed to select classic workflow")
  }
}

function createMockToolContext(): ToolContext {
  return {
    sessionID: "test-session",
    messageID: "test-message",
    agent: "HArchitect",
    directory: process.cwd(),
    worktree: process.cwd(),
    abort: new AbortController().signal,
    metadata: () => { },
    ask: async () => { },
  }
}

describe("HyperDesigner Plugin", () => {
  beforeEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
    initClassicWorkflowSelection()
  })

  it("should create plugin with required methods", async () => {
    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const plugin = HyperDesignerPlugin

    expect(typeof plugin).toBe("function")
  })

  it("should return plugin object with expected structure", async () => {
    const mockCtx = {
      client: { session: { prompt: async () => {} } },
      directory: process.cwd(),
    } as unknown as PluginInput

    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)

    expect(pluginInstance).toHaveProperty("config")
    expect(pluginInstance).toHaveProperty("tool")
    expect(pluginInstance).toHaveProperty("event")
    expect(pluginInstance).toHaveProperty("experimental.chat.system.transform")

    expect(typeof pluginInstance.config).toBe("function")
    expect(typeof pluginInstance.tool).toBe("object")
    expect(typeof pluginInstance.event).toBe("function")
    expect(typeof pluginInstance["experimental.chat.system.transform"]).toBe("function")
  })

  it("should provide workflow state management tools", async () => {
    const mockCtx = {
      client: {
        session: {
          create: async () => ({ data: { id: "review-session" } }),
          prompt: async () => {},
          delete: async () => ({}),
        },
      },
      directory: process.cwd(),
    } as unknown as PluginInput
    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)

    expect(pluginInstance.tool).toBeDefined()
    expect(pluginInstance.tool).toHaveProperty("hd_workflow_state")
    expect(pluginInstance.tool).toHaveProperty("hd_handover")
    expect(pluginInstance.tool).toHaveProperty("hd_submit_evaluation")

    expect(typeof pluginInstance.tool!.hd_workflow_state.execute).toBe("function")
    expect(typeof pluginInstance.tool!.hd_handover.execute).toBe("function")
    expect(typeof pluginInstance.tool!.hd_submit_evaluation.execute).toBe("function")
  })

  it("should handle config agent mapping", async () => {
    const mockCtx = {
      client: { session: { prompt: async () => {} } },
      directory: process.cwd(),
    } as unknown as PluginInput
    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)

    expect(pluginInstance.config).toBeDefined()

    const configInput = {
      agent: {
        existingAgent: { model: "gpt-4" }
      }
    }

    // Test that config function exists and can be called
    expect(() => {
      pluginInstance.config!(configInput)
    }).not.toThrow()
  })

  it("hd_submit_evaluation should store score and comment in workflow state", async () => {
    const mockCtx = {
      client: {
        session: {
          create: vi.fn(),
          prompt: vi.fn(),
          delete: vi.fn(),
        },
      },
      directory: process.cwd(),
    } as unknown as PluginInput

    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)

    const output = await pluginInstance.tool!.hd_submit_evaluation.execute(
      { score: 85, comment: "评审通过" },
      createMockToolContext(),
    )
    const result = JSON.parse(output) as { success: boolean; score: number; comment: string }

    expect(result.success).toBe(true)
    expect(result.score).toBe(85)
    expect(result.comment).toBe("评审通过")
  })

  it("hd_submit_evaluation should work with score only (no comment)", async () => {
    const mockCtx = {
      client: {
        session: {
          create: vi.fn(),
          prompt: vi.fn(),
          delete: vi.fn(),
        },
      },
      directory: process.cwd(),
    } as unknown as PluginInput

    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)

    const output = await pluginInstance.tool!.hd_submit_evaluation.execute(
      { score: 60 },
      createMockToolContext(),
    )
    const result = JSON.parse(output) as { success: boolean; score: number; comment: null }

    expect(result.success).toBe(true)
    expect(result.score).toBe(60)
    expect(result.comment).toBeNull()
  })
})
