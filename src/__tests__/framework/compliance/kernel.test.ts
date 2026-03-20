import { describe, it, expect } from "vitest"
import { existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const IDENTITY_PATH = join(__dirname, '..', '..', '..', 'plugins', 'agent', 'HArchitect', 'prompts', 'identity.md')

describe("identity.md compliance", () => {
  it("identity.md exists", () => {
    expect(existsSync(IDENTITY_PATH)).toBe(true)
  })
})
