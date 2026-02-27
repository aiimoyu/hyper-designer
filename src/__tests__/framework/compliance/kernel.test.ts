import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const KERNEL_PATH = join(__dirname, "..", "..", "..", "agents", "HArchitect", "prompts", "kernel.md")

describe("kernel.md compliance", () => {
  it("kernel.md exists", () => {
    expect(existsSync(KERNEL_PATH)).toBe(true)
  })

  it("kernel.md word count is ≤375 (≈500 tokens)", () => {
    const content = readFileSync(KERNEL_PATH, "utf-8")
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
    expect(wordCount).toBeLessThanOrEqual(375)
  })

  it("kernel.md contains hd_submit keyword", () => {
    const content = readFileSync(KERNEL_PATH, "utf-8")
    expect(content).toContain("hd_submit")
  })

  it("kernel.md contains ask_user keyword", () => {
    const content = readFileSync(KERNEL_PATH, "utf-8")
    expect(content).toContain("ask_user")
  })
})
