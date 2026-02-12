import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { PluginInput } from "@opencode-ai/plugin"
import { rmSync, existsSync } from "fs"
import { join } from "path"

vi.mock("@opencode-ai/plugin", () => {
  const tool = (definition: Record<string, unknown>) => definition
  const chainable = { describe: () => ({}) }
  tool.schema = {
    enum: () => chainable,
    boolean: () => chainable,
  }
  return { tool }
})

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")

describe("HyperDesigner Plugin", () => {
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
      client: { session: { prompt: async () => {} } },
      directory: process.cwd(),
    } as unknown as PluginInput
    const { HyperDesignerPlugin } = await import("../../../../opencode/.plugins/hyper-designer")
    const pluginInstance = await HyperDesignerPlugin(mockCtx)

    expect(pluginInstance.tool).toBeDefined()
    expect(pluginInstance.tool).toHaveProperty("get_hd_workflow_state")
    expect(pluginInstance.tool).toHaveProperty("set_hd_workflow_stage")
    expect(pluginInstance.tool).toHaveProperty("set_hd_workflow_current")
    expect(pluginInstance.tool).toHaveProperty("set_hd_workflow_handover")

    expect(typeof pluginInstance.tool!.get_hd_workflow_state.execute).toBe("function")
    expect(typeof pluginInstance.tool!.set_hd_workflow_stage.execute).toBe("function")
    expect(typeof pluginInstance.tool!.set_hd_workflow_current.execute).toBe("function")
    expect(typeof pluginInstance.tool!.set_hd_workflow_handover.execute).toBe("function")
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
})
