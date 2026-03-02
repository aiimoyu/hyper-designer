import { describe, it, expect } from "vitest"
import { createHArchitectAgent } from "../../../agents/HArchitect"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const IDENTITY_PATH = join(__dirname, "..", "..", "..", "agents", "HArchitect", "prompts", "identity.md")

describe("prompt order compliance", () => {
  describe("HArchitect", () => {
    it("prompt begins with identity.md content (promptGenerators[0])", () => {
      const agent = createHArchitectAgent()
      const identityContent = readFileSync(IDENTITY_PATH, "utf-8")

      // identity.md must be the very first content in the concatenated prompt
      expect(agent.prompt).toBeDefined()
      expect(agent.prompt!.startsWith(identityContent)).toBe(true)
    })

    it("identity.md appears before step.md in prompt", () => {
      const agent = createHArchitectAgent()

      const identityIdx = agent.prompt!.indexOf("Role Definition")
      const stepIdx = agent.prompt!.indexOf("Single-Stage Processing Pipeline")

      expect(identityIdx).toBeGreaterThanOrEqual(0)
      expect(stepIdx).toBeGreaterThan(identityIdx)
    })
  })
})
