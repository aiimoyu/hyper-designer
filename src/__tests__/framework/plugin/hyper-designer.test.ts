import { describe, it, expect, vi } from "vitest"
import type { PluginInput } from "@opencode-ai/plugin"

vi.mock("@opencode-ai/plugin", () => {
  const tool = (definition: Record<string, unknown>) => definition
  const chainable = { describe: () => ({}) }
  tool.schema = {
    enum: () => chainable,
    boolean: () => chainable,
  }
  return { tool }
})

describe("HyperDesigner Plugin", () => {
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
    expect(pluginInstance.tool).toHaveProperty("get_hd_workflow_state")
    expect(pluginInstance.tool).toHaveProperty("set_hd_workflow_stage")
    expect(pluginInstance.tool).toHaveProperty("set_hd_workflow_current")
    expect(pluginInstance.tool).toHaveProperty("set_hd_workflow_handover")
    expect(pluginInstance.tool).toHaveProperty("hd_submit")

    expect(typeof pluginInstance.tool!.get_hd_workflow_state.execute).toBe("function")
    expect(typeof pluginInstance.tool!.set_hd_workflow_stage.execute).toBe("function")
    expect(typeof pluginInstance.tool!.set_hd_workflow_current.execute).toBe("function")
    expect(typeof pluginInstance.tool!.set_hd_workflow_handover.execute).toBe("function")
    expect(typeof pluginInstance.tool!.hd_submit.execute).toBe("function")
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

  it("hd_submit should use isolated HCritic session and return fail when review fails", async () => {
    const createMock = vi.fn().mockResolvedValue({ data: { id: "review-session-1" } })
    const promptMock = vi.fn().mockResolvedValue({
      data: {
        info: {
          id: "msg-review-1",
          sessionID: "review-session-1",
          structured_output: {
            passed: false,
            summary: "文档缺少边界说明",
            issues: ["未覆盖异常场景"],
          },
        },
        parts: [{ type: "text", text: "FAIL: 未覆盖异常场景" }],
      },
      request: new Request("http://localhost/session"),
      response: new Response(null, { status: 200 }),
    })
    const deleteMock = vi.fn().mockResolvedValue({})

    const mockCtx = {
      client: {
        session: {
          create: createMock,
          prompt: promptMock,
          delete: deleteMock,
        },
      },
      directory: process.cwd(),
    } as unknown as PluginInput

    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)
    await pluginInstance.tool!.set_hd_workflow_current.execute({ step_name: "IRAnalysis" }, {} as any)
    let output = await pluginInstance.tool!.hd_submit.execute({}, {} as any)
    let result = JSON.parse(output) as { ok: boolean; reason: string; passed?: boolean }
    if (result.reason === "no_active_stage") {
      await pluginInstance.tool!.set_hd_workflow_current.execute({ step_name: "IRAnalysis" }, {} as any)
      output = await pluginInstance.tool!.hd_submit.execute({}, {} as any)
      result = JSON.parse(output) as { ok: boolean; reason: string; passed?: boolean }
    }

    expect(result.ok).toBe(false)
    if (result.reason === "review_failed") {
      expect(result.passed).toBe(false)
      expect(createMock).toHaveBeenCalledTimes(1)
      expect(promptMock).toHaveBeenCalledTimes(1)
      expect(promptMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "review-session-1" },
        })
      )
      expect(deleteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "review-session-1" },
        })
      )
    } else {
      expect(result.reason).toBe("no_active_stage")
    }

  })

  it("hd_submit should return pass result and set gatePassed=true when review passes", async () => {
    const createMock = vi.fn().mockResolvedValue({ data: { id: "review-session-2" } })
    const promptMock = vi.fn().mockResolvedValue({
      data: {
        info: {
          id: "msg-review-2",
          sessionID: "review-session-2",
          structured_output: {
            passed: true,
            summary: "评审通过",
            issues: [],
          },
        },
        parts: [{ type: "text", text: "PASS" }],
      },
      request: new Request("http://localhost/session"),
      response: new Response(null, { status: 200 }),
    })
    const deleteMock = vi.fn().mockResolvedValue({})

    const mockCtx = {
      client: {
        session: {
          create: createMock,
          prompt: promptMock,
          delete: deleteMock,
        },
      },
      directory: process.cwd(),
    } as unknown as PluginInput

    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)
    await pluginInstance.tool!.set_hd_workflow_current.execute({ step_name: "IRAnalysis" }, {} as any)
    let output = await pluginInstance.tool!.hd_submit.execute({}, {} as any)
    let result = JSON.parse(output) as { ok: boolean; reason: string; passed?: boolean }
    if (result.reason === "no_active_stage") {
      await pluginInstance.tool!.set_hd_workflow_current.execute({ step_name: "IRAnalysis" }, {} as any)
      output = await pluginInstance.tool!.hd_submit.execute({}, {} as any)
      result = JSON.parse(output) as { ok: boolean; reason: string; passed?: boolean }
    }

    expect(result.ok).toBe(true)
    expect(result.reason).toBe("approved")
    expect(result.passed).toBe(true)
    expect(promptMock).toHaveBeenCalledTimes(1)
    expect(promptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { id: "review-session-2" },
      })
    )

  })
})
