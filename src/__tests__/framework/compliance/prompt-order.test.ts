import { describe, it, expect } from "vitest"
import { createHArchitectAgent } from "../../../agents/HArchitect"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const KERNEL_PATH = join(__dirname, "..", "..", "..", "agents", "HArchitect", "prompts", "kernel.md")

describe("prompt order compliance", () => {
  describe("HArchitect", () => {
    it("prompt begins with kernel.md content (promptGenerators[0])", () => {
      const agent = createHArchitectAgent()
      const kernelContent = readFileSync(KERNEL_PATH, "utf-8")

      // kernel.md must be the very first content in the concatenated prompt
      expect(agent.prompt).toBeDefined()
      expect(agent.prompt!.startsWith(kernelContent)).toBe(true)
    })

    it("kernel.md appears before identity.md in prompt", () => {
      const agent = createHArchitectAgent()

      const kernelIdx = agent.prompt!.indexOf("HArchitect Kernel — Constitutional Rules")
      const identityIdx = agent.prompt!.indexOf("Role Definition")

      expect(kernelIdx).toBeGreaterThanOrEqual(0)
      expect(identityIdx).toBeGreaterThan(kernelIdx)
    })
  })
})
