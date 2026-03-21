import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC_DIR = join(__dirname, '..', '..', '..')
const OPENCODE_DIR = join(SRC_DIR, 'platformBridge', 'platform', 'opencode')
const TRANSFORM_INDEX = join(SRC_DIR, 'transform', 'index.ts')

describe('platform boundary compliance', () => {
  it('opencode adapter directory only keeps capabilities and orchestrator', () => {
    const entries = readdirSync(OPENCODE_DIR).sort()
    expect(entries).toEqual(['capabilities.ts', 'orchestrator.ts'])
  })

  it('transform barrel does not re-export opencode platform modules', () => {
    expect(existsSync(TRANSFORM_INDEX)).toBe(true)
    const content = readFileSync(TRANSFORM_INDEX, 'utf-8')
    expect(content).not.toContain('../platformBridge/platform/opencode/')
  })
})
