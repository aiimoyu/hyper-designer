import { describe, it, expect, beforeEach, vi } from "vitest"
import type { PluginInput, ToolContext } from "@opencode-ai/plugin"
import { existsSync, rmSync } from "fs"
import { join } from "path"
import { workflowService } from "../../../workflows/service"
import { resetSDKForTest } from "../../../sdk"

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
  const objectFn = (_args?: Record<string, unknown>) => chainable
  const arrayFn = (_item?: unknown) => chainable
  tool.schema = {
    enum: () => chainable,
    boolean: () => chainable,
    number: () => chainable,
    string: () => chainable,
    object: objectFn,
    array: arrayFn,
  }
  return { tool }
})

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")

function initClassicWorkflowSelection(): void {
  const detail = workflowService.getWorkflowDetail("classic")
  if (!detail) {
    throw new Error("Classic workflow detail should be defined")
  }

  const stages = detail.stages.map(stage => ({ key: stage.key, selected: true }))
  const result = workflowService.selectWorkflow({ typeId: "classic", stages })
  if (!result.success && !result.error?.includes("already initialized")) {
    throw new Error(result.error ?? "Failed to select classic workflow")
  }
}

function setCurrentStage(stageName: string): void {
  workflowService.setCurrent(stageName)
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
    resetSDKForTest()
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
      client: { session: { prompt: async () => { } } },
      directory: process.cwd(),
    } as unknown as PluginInput

    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)

    expect(pluginInstance).toHaveProperty("config")
    expect(pluginInstance).toHaveProperty("tool")
    expect(pluginInstance).toHaveProperty("event")
    expect(pluginInstance).toHaveProperty("experimental.chat.system.transform")

    expect(pluginInstance.config).toBe("function")
    expect(pluginInstance.tool).toBe("object")
    expect(pluginInstance.event).toBe("function")
    expect(pluginInstance["experimental.chat.system.transform"]).toBe("function")
  })

  it("should provide workflow state management tools", async () => {
    const mockCtx = {
      client: {
        session: {
          create: async () => ({ data: { id: "review-session" } }),
          prompt: async () => { },
          delete: async () => ({}),
        },
      },
      directory: process.cwd(),
    } as unknown as PluginInput
    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)

    expect(pluginInstance.tool).toBeDefined()
    expect(pluginInstance.tool).toBeDefined()
    expect(pluginInstance.tool).toHaveProperty("hd_workflow_state")
    expect(pluginInstance.tool).toHaveProperty("hd_handover")
    expect(pluginInstance.tool).toHaveProperty("hd_record_milestone")

    expect(typeof pluginInstance.tool!.hd_workflow_state.execute).toBe("function")
    expect(typeof pluginInstance.tool!.hd_handover.execute).toBe("function")
    expect(typeof pluginInstance.tool!.hd_record_milestone.execute).toBe("function")
  })

  it("should handle config agent mapping", async () => {
    const mockCtx = {
      client: { session: { prompt: async () => { } } },
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

  it("should NOT have hd_submit_evaluation tool", async () => {
    const mockCtx = {
      client: { session: { prompt: async () => { } } },
      directory: process.cwd(),
    } as unknown as PluginInput

    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)

    expect(pluginInstance.tool).not.toHaveProperty("hd_submit_evaluation")
  })

  describe("hd_record_milestone", () => {
    it("should exist as a tool", async () => {
      const mockCtx = {
        client: { session: { prompt: async () => { } } },
        directory: process.cwd(),
      } as unknown as PluginInput

      const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
      const pluginInstance = await HyperDesignerPlugin(mockCtx)

      expect(pluginInstance.tool).toHaveProperty("hd_record_milestone")
      expect(typeof pluginInstance.tool!.hd_record_milestone.execute).toBe("function")
    })

    it("should record gate milestone with score and comment", async () => {
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

      setCurrentStage("IRAnalysis")
      const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
      const pluginInstance = await HyperDesignerPlugin(mockCtx)

      const output = await pluginInstance.tool!.hd_record_milestone.execute(
        {
          id: "gate",
          mark: true,
          detail: { score: 85, comment: "评审通过" }
        },
        createMockToolContext(),
      )
      const result = JSON.parse(output) as { success: boolean; stage: string; milestone: { id: string; timestamp: string; mark: boolean; detail: { score: number; comment: string } } }

      expect(result.success).toBe(true)
      expect(result.stage).toBe("IRAnalysis")
      expect(result.milestone.id).toBe("gate")
      expect(result.milestone.mark).toBe(true)
      expect(result.milestone.detail.score).toBe(85)
      expect(result.milestone.detail.comment).toBe("评审通过")
      expect(result.milestone.timestamp).toBeDefined()
    })

    it('should record non-gate milestone completion status', async () => {
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

      setCurrentStage('IRAnalysis')
      const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
      const pluginInstance = await HyperDesignerPlugin(mockCtx)

      const output = await pluginInstance.tool!.hd_record_milestone.execute(
        {
          id: 'doc_review',
          mark: false,
          detail: { reason: 'Need revision' },
        },
        createMockToolContext(),
      )

      const result = JSON.parse(output) as {
        success: boolean
        stage: string
        milestone: {
          id: string
          timestamp: string
          mark: boolean
          detail: { reason: string }
        }
      }

      expect(result.success).toBe(true)
      expect(result.stage).toBe('IRAnalysis')
      expect(result.milestone.id).toBe('doc_review')
      expect(result.milestone.mark).toBe(false)
      expect(result.milestone.detail.reason).toBe('Need revision')
    })

    it("should record gate milestone with score only (no comment)", async () => {
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

      setCurrentStage("IRAnalysis")
      const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
      const pluginInstance = await HyperDesignerPlugin(mockCtx)

      const output = await pluginInstance.tool!.hd_record_milestone.execute(
        {
          id: "gate",
          mark: false,
          detail: { score: 60 }
        },
        createMockToolContext(),
      )
      const result = JSON.parse(output) as { success: boolean; stage: string; milestone: { id: string; timestamp: string; mark: boolean; detail: { score: number; comment?: string | null } } }

      expect(result.success).toBe(true)
      expect(result.stage).toBe("IRAnalysis")
      expect(result.milestone.id).toBe("gate")
      expect(result.milestone.mark).toBe(false)
      expect(result.milestone.detail.score).toBe(60)
      expect(result.milestone.detail.comment).toBeUndefined()
      expect(result.milestone.timestamp).toBeDefined()
    })

    it("should record force_advance milestone", async () => {
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

      setCurrentStage("IRAnalysis")
      const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
      const pluginInstance = await HyperDesignerPlugin(mockCtx)

      const output = await pluginInstance.tool!.hd_record_milestone.execute(
        {
          id: "force_advance",
          mark: true,
          detail: { reason: "Three failed attempts" }
        },
        createMockToolContext(),
      )
      const result = JSON.parse(output) as { success: boolean; stage: string; milestone: { id: string; timestamp: string; mark: boolean; detail: { reason: string } } }

      expect(result.success).toBe(true)
      expect(result.stage).toBe("IRAnalysis")
      expect(result.milestone.id).toBe("force_advance")
      expect(result.milestone.mark).toBe(true)
      expect(result.milestone.detail.reason).toBe("Three failed attempts")
      expect(result.milestone.timestamp).toBeDefined()
    })

    it("should return error when no current stage is set", async () => {
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

      workflowService.setCurrent(null as unknown as string)
      const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
      const pluginInstance = await HyperDesignerPlugin(mockCtx)

      const output = await pluginInstance.tool!.hd_record_milestone.execute(
        {
          id: "gate",
          mark: true,
          detail: { score: 85 }
        },
        createMockToolContext(),
      )
      const result = JSON.parse(output) as { success: boolean; error: string }

      expect(result.success).toBe(false)
      expect(result.error).toContain("No current stage")
    })
  })
})
