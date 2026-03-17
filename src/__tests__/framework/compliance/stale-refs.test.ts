import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC_DIR = join(__dirname, "..", "..", "..")
const BUILTIN_AGENTS_DIR = join(SRC_DIR, "plugins", "agent", "builtin")

// Collect all .md files under src/plugins/agent/builtin/*/prompts/
function getPromptFiles(): string[] {
  const agentDirs = readdirSync(BUILTIN_AGENTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  const mdFiles: string[] = []
  for (const agent of agentDirs) {
    const promptsDir = join(BUILTIN_AGENTS_DIR, agent, "prompts")
    if (!existsSync(promptsDir)) continue
    const files = readdirSync(promptsDir)
      .filter(f => f.endsWith(".md"))
      .map(f => join(promptsDir, f))
    mdFiles.push(...files)
  }
  return mdFiles
}

describe("stale references compliance", () => {
  it("finds prompt files to scan", () => {
    const files = getPromptFiles()
    expect(files.length).toBeGreaterThan(0)
  })

  it("no prompt files reference hd_delegate", () => {
    const files = getPromptFiles()

    const violations: string[] = []
    for (const file of files) {
      const content = readFileSync(file, "utf-8")
      if (content.includes("hd_delegate")) {
        violations.push(file)
      }
    }

    expect(violations, `Files containing 'hd_delegate': ${violations.join(", ")}`).toHaveLength(0)
  })

  it("no prompt files reference delegate_task", () => {
    const files = getPromptFiles()

    const violations: string[] = []
    for (const file of files) {
      const content = readFileSync(file, "utf-8")
      if (content.includes("delegate_task")) {
        violations.push(file)
      }
    }

    expect(violations, `Files containing 'delegate_task': ${violations.join(", ")}`).toHaveLength(0)
  })
})
