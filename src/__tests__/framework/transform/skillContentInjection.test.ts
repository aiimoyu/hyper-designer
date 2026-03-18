import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolve } from 'path'
import { skillContentInjectionProvider } from '../../../transform/injections/skillContentInjection'
import type { InjectionConfig } from '../../../workflows/core/types'

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}))

import { readFile, readdir, stat } from 'fs/promises'

function dir(name: string): { name: string; isDirectory: () => true } {
  return { name, isDirectory: () => true }
}

function fileExists(path: string): void {
  vi.mocked(stat).mockImplementation(async (target: unknown) => {
    if (target === path) {
      return { isFile: () => true } as never
    }
    throw new Error('ENOENT')
  })
}

describe('skillContentInjectionProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when config is missing', async () => {
    const result = await skillContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
    })

    expect(result).toBeNull()
  })

  it('returns null when skill is missing', async () => {
    const result = await skillContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: { provider: 'skill-content' } as unknown as InjectionConfig,
    })

    expect(result).toBeNull()
  })

  it('finds skills recursively and injects SKILL.md', async () => {
    const projectRoot = process.cwd()
    const skillsRoot = resolve(projectRoot, '.opencode', 'skills')
    const nested = resolve(skillsRoot, 'subdir')
    const skillDir = resolve(nested, 'lite-designer')
    const skillFile = resolve(skillDir, 'SKILL.md')

    vi.mocked(readdir).mockImplementation(async (target: unknown) => {
      if (target === skillsRoot) return [dir('subdir')]
      if (target === nested) return [dir('lite-designer')]
      return []
    })

    fileExists(skillFile)
    vi.mocked(readFile).mockResolvedValue('skill content')

    const result = await skillContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: {
        provider: 'skill-content',
        skill: 'lite-designer',
      } as unknown as InjectionConfig,
    })

    expect(result).toContain('<using_skill>')
    expect(result).toContain('<id>lite-designer</id>')
    expect(result).toContain('<name>SKILL.md</name>')
    expect(result).toContain('skill content')
  })

  it('deduplicates SKILL.md and keeps it first when files are provided', async () => {
    const projectRoot = process.cwd()
    const skillsRoot = resolve(projectRoot, '.opencode', 'skills')
    const skillDir = resolve(skillsRoot, 'lite-designer')
    const skillFile = resolve(skillDir, 'SKILL.md')
    const extraFile = resolve(skillDir, 'references', 'phase1.md')

    vi.mocked(readdir).mockImplementation(async (target: unknown) => {
      if (target === skillsRoot) return [dir('lite-designer')]
      return []
    })

    fileExists(skillFile)
    vi.mocked(readFile).mockImplementation(async (target: unknown) => {
      if (target === skillFile) return 'skill body'
      if (target === extraFile) return 'phase1 content'
      throw new Error('ENOENT')
    })

    const result = await skillContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: {
        provider: 'skill-content',
        skill: 'lite-designer',
        files: ['references/phase1.md', 'SKILL.md'],
      } as unknown as InjectionConfig,
    })

    expect(result).toContain('<name>SKILL.md</name>')
    expect(result?.match(/<name>SKILL.md<\/name>/g)).toHaveLength(1)
    const skillIndex = result?.indexOf('<name>SKILL.md</name>') ?? -1
    const refIndex = result?.indexOf('<name>references/phase1.md</name>') ?? -1
    expect(skillIndex).toBeGreaterThan(-1)
    expect(refIndex).toBeGreaterThan(-1)
    expect(skillIndex).toBeLessThan(refIndex)
    expect(result).toContain('phase1 content')
  })

  it('includes an error when the skill is not found', async () => {
    vi.mocked(readdir).mockResolvedValue([])

    const result = await skillContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: {
        provider: 'skill-content',
        skill: 'missing-skill',
      } as unknown as InjectionConfig,
    })

    expect(result).toContain('<id>missing-skill</id>')
    expect(result).toContain('<error>Skill not found</error>')
  })

  it('includes per-file errors when reads fail', async () => {
    const projectRoot = process.cwd()
    const skillsRoot = resolve(projectRoot, '.opencode', 'skills')
    const skillDir = resolve(skillsRoot, 'lite-designer')
    const skillFile = resolve(skillDir, 'SKILL.md')

    vi.mocked(readdir).mockImplementation(async (target: unknown) => {
      if (target === skillsRoot) return [dir('lite-designer')]
      return []
    })

    fileExists(skillFile)
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'))

    const result = await skillContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: {
        provider: 'skill-content',
        skill: 'lite-designer',
      } as unknown as InjectionConfig,
    })

    expect(result).toContain('<name>SKILL.md</name>')
    expect(result).toContain('<error>Failed to read file:')
  })
})
