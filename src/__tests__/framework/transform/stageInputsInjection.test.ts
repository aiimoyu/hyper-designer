import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { stageInputsInjectionProvider } from '../../../transform/injections/stageInputsInjection'

// Mock fs/promises and glob
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
}))

vi.mock('glob', () => ({
  sync: vi.fn(),
}))

import { readFile } from 'fs/promises'
import * as glob from 'glob'

describe('stageInputsInjectionProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when inputs are missing', async () => {
    const result = await stageInputsInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: {
        name: 'Test',
        description: 'Test',
        agent: 'TestAgent',
        getHandoverPrompt: () => '',
      },
      systemMessages: [],
    })

    expect(result).toBeNull()
  })

  it('returns null when inputs array is empty', async () => {
    const result = await stageInputsInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: {
        name: 'Test',
        description: 'Test',
        agent: 'TestAgent',
        getHandoverPrompt: () => '',
        inputs: [],
      },
      systemMessages: [],
    })

    expect(result).toBeNull()
  })

  it('returns null when currentStage is missing', async () => {
    const result = await stageInputsInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: null,
      stageDefinition: {
        name: 'Test',
        description: 'Test',
        agent: 'TestAgent',
        getHandoverPrompt: () => '',
        inputs: [{ id: 'a', path: './a.md', type: 'file', description: 'A' }],
      },
      systemMessages: [],
    })

    expect(result).toBeNull()
  })

  it('injects single file item with content', async () => {
    vi.mocked(readFile).mockResolvedValue('hello world')

    const result = await stageInputsInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: {
        name: 'Test',
        description: 'Test',
        agent: 'TestAgent',
        getHandoverPrompt: () => '',
        inputs: [{ id: 'doc1', path: './doc1.md', type: 'file', description: 'Document 1' }],
      },
      systemMessages: [],
    })

    expect(result).toContain('<stage-input-files>')
    expect(result).toContain('<id>doc1</id>')
    expect(result).toContain('<path>')
    expect(result).toContain('doc1.md')
    expect(result).toContain('hello world')
    expect(result).toContain('</stage-input-files>')
  })

  it('expands pattern type into multiple file items', async () => {
    // Mock glob to return 3 matching files
    vi.mocked(glob.sync).mockReturnValue(['docs/a.md', 'docs/b.md', 'docs/c.md'])
    vi.mocked(readFile)
      .mockResolvedValueOnce('content of a')
      .mockResolvedValueOnce('content of b')
      .mockResolvedValueOnce('content of c')

    const result = await stageInputsInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: {
        name: 'Test',
        description: 'Test',
        agent: 'TestAgent',
        getHandoverPrompt: () => '',
        inputs: [
          { id: 'allDocs', path: 'docs/*.md', type: 'pattern', description: 'All markdown docs' },
        ],
      },
      systemMessages: [],
    })

    // Should have 3 separate <item> blocks
    const itemMatches = result?.match(/<item>/g)
    expect(itemMatches).toHaveLength(3)

    // Each item should have its own path
    expect(result).toContain('<path>docs/a.md</path>')
    expect(result).toContain('<path>docs/b.md</path>')
    expect(result).toContain('<path>docs/c.md</path>')

    // Each item should have its own content
    expect(result).toContain('content of a')
    expect(result).toContain('content of b')
    expect(result).toContain('content of c')

    // Items should have expanded IDs
    expect(result).toContain('<id>allDocs:docs/a.md</id>')
    expect(result).toContain('<id>allDocs:docs/b.md</id>')
    expect(result).toContain('<id>allDocs:docs/c.md</id>')
  })

  it('pattern with no matches returns item with error', async () => {
    vi.mocked(glob.sync).mockReturnValue([])

    const result = await stageInputsInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: {
        name: 'Test',
        description: 'Test',
        agent: 'TestAgent',
        getHandoverPrompt: () => '',
        inputs: [
          { id: 'noMatch', path: 'nonexistent/*.xyz', type: 'pattern', description: 'No matches' },
        ],
      },
      systemMessages: [],
    })

    // Should have 1 item with error
    const itemMatches = result?.match(/<item>/g)
    expect(itemMatches).toHaveLength(1)
    expect(result).toContain('No matching files found')
  })

  it('mixes file, folder, and pattern items correctly', async () => {
    vi.mocked(glob.sync).mockReturnValue(['src/x.ts', 'src/y.ts'])
    vi.mocked(readFile).mockResolvedValue('file content')
    const { readdir } = await import('fs/promises')
    vi.mocked(readdir).mockResolvedValue([
      { name: 'file1.md', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true },
    ] as any)

    const result = await stageInputsInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: {
        name: 'Test',
        description: 'Test',
        agent: 'TestAgent',
        getHandoverPrompt: () => '',
        inputs: [
          { id: 'single', path: './single.md', type: 'file', description: 'Single file' },
          { id: 'dir', path: './dir/', type: 'folder', description: 'Directory' },
          { id: 'all', path: 'src/*.ts', type: 'pattern', description: 'All TS files' },
        ],
      },
      systemMessages: [],
    })

    // 1 file + 1 folder + 2 pattern matches = 4 items
    const itemMatches = result?.match(/<item>/g)
    expect(itemMatches).toHaveLength(4)

    // Check that each type appears
    expect(result).toContain('<id>single</id>')
    expect(result).toContain('<id>dir</id>')
    expect(result).toContain('<id>all:src/x.ts</id>')
    expect(result).toContain('<id>all:src/y.ts</id>')
  })
})
