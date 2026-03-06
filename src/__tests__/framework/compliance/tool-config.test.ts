import { describe, it, expect } from "vitest"
import { createHArchitectAgent } from "../../../agents/HArchitect"
import { createHEngineerAgent } from "../../../agents/HEngineer"
import { createHCriticAgent } from "../../../agents/HCritic"
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
    it("defaultTools has hd_workflow_state: true and hd_handover: true", () => {
      const localAgent = createHArchitectAgent()
      const agent = toOpencodeAgentConfig(localAgent)
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_workflow_state).toBe(true)
      expect(agent.tools!.hd_handover).toBe(true)
    })
  })

  describe("HEngineer", () => {
    it("defaultTools has hd_workflow_state: true and hd_handover: true", () => {
      const localAgent = createHEngineerAgent()
      const agent = toOpencodeAgentConfig(localAgent)
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_workflow_state).toBe(true)
      expect(agent.tools!.hd_handover).toBe(true)
    })
  })

  describe("HCritic", () => {
    it("defaultTools has hd_submit_evaluation: true", () => {
      const localAgent = createHCriticAgent()
      const agent = toOpencodeAgentConfig(localAgent)
      expect(agent.tools).toBeDefined()
      expect(agent.tools!.hd_submit_evaluation).toBe(true)
    })

    it("defaultTools has hd_submit_evaluation: false for HArchitect and HEngineer", () => {
      const localArchitect = createHArchitectAgent()
      const localEngineer = createHEngineerAgent()
      const architect = toOpencodeAgentConfig(localArchitect)
      const engineer = toOpencodeAgentConfig(localEngineer)
      expect(architect.tools).toBeDefined()

      expect(engineer.tools).toBeDefined()
      expect(architect.tools!.hd_submit_evaluation).toBe(false)
      expect(engineer.tools!.hd_submit_evaluation).toBe(false)
    })
  })
})
