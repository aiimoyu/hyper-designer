import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const IDENTITY_PATH = join(__dirname, "..", "..", "..", "agents", "HArchitect", "prompts", "identity.md")

describe("identity.md compliance", () => {
  it("identity.md exists", () => {
    expect(existsSync(IDENTITY_PATH)).toBe(true)
  })

  it("identity.md word count is ≤375 (≈500 tokens)", () => {
    const content = readFileSync(IDENTITY_PATH, "utf-8")
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
    expect(wordCount).toBeLessThanOrEqual(375)
  })

  it("identity.md contains requirements keyword", () => {
    const content = readFileSync(IDENTITY_PATH, "utf-8")
    expect(content).toContain("requirements")
  })

  it("identity.md contains workflow keyword", () => {
    const content = readFileSync(IDENTITY_PATH, "utf-8")
    expect(content).toContain("workflow")
  })
})
