import { describe, it, expect } from "vitest"
import { createHArchitectAgent } from "../../../plugins/agent/builtin/HArchitect"
import { createHEngineerAgent } from "../../../plugins/agent/builtin/HEngineer"
import { createHCriticAgent } from "../../../plugins/agent/builtin/HCritic"
import type { AgentConfig as LocalAgentConfig } from "../../../agents/types"
import type { AgentConfig as OpencodeAgentConfig } from "@opencode-ai/sdk"

const toOpencodeAgentConfig = (agent: LocalAgentConfig): OpencodeAgentConfig => {
  const result: OpencodeAgentConfig = {
    ...(agent.model !== undefined ? { model: agent.model } : {}),
    ...(agent.temperature !== undefined ? { temperature: agent.temperature } : {}),
    ...(agent.maxTokens !== undefined ? { maxTokens: agent.maxTokens } : {}),
    ...(agent.variant !== undefined ? { variant: agent.variant } : {}),
    ...(agent.prompt !== undefined ? { prompt: agent.prompt } : {}),
    ...(agent.description !== undefined ? { description: agent.description } : {}),
    ...(agent.mode !== undefined ? { mode: agent.mode } : {}),
    ...(agent.color !== undefined ? { color: agent.color } : {}),
    ...(agent.permission !== undefined ? { permission: agent.permission } : {}),
  }
  // 将权限转换为工具配置：Permission是deny就是false、其他就是true，默认false
  if (agent.permission !== undefined) {
    const tools: Record<string, boolean> = {}
    for (const [tool, perm] of Object.entries(agent.permission)) {
      tools[tool] = perm === "deny" ? false : true
    }
    result.tools = tools
  }
  return result
}

describe("tool config compliance", () => {
  describe("HArchitect", () => {
    it("defaultTools has hd_workflow_state: true, hd_handover: true, and hd_force_next_step: true", () => {
      const localAgent = createHArchitectAgent()
      const agent = toOpencodeAgentConfig(localAgent)
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_workflow_state).toBe(true)
      expect(agent.tools!.hd_handover).toBe(true)
      expect(agent.tools!.hd_force_next_step).toBe(true)
    })
  })

  describe("HEngineer", () => {
    it("defaultTools has hd_workflow_state: true, hd_handover: true, and hd_force_next_step: true", () => {
      const localAgent = createHEngineerAgent()
      const agent = toOpencodeAgentConfig(localAgent)
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_workflow_state).toBe(true)
      expect(agent.tools!.hd_handover).toBe(true)
      expect(agent.tools!.hd_force_next_step).toBe(true)
    })
  })

  describe("HCritic", () => {
    it("defaultTools has hd_record_milestone: true", () => {
      const localAgent = createHCriticAgent()
      const agent = toOpencodeAgentConfig(localAgent)
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_record_milestone).toBe(true)
    })

    it("defaultTools does NOT have hd_force_next_step (undefined)", () => {
      const localCritic = createHCriticAgent()
      const critic = toOpencodeAgentConfig(localCritic)
      expect(critic.tools).toBeDefined()
    })

    it("defaultTools does NOT have hd_submit_evaluation (undefined)", () => {
      const localCritic = createHCriticAgent()
      const critic = toOpencodeAgentConfig(localCritic)
      expect(critic.tools).toBeDefined()
      expect(critic.tools!.hd_submit_evaluation).toBeUndefined()
    })
  })
})
