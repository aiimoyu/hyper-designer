import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fileContentInjectionProvider } from '../../../transform/injections/fileContentInjection'
import { readFile } from 'fs/promises'

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}))

describe('fileContentInjectionProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when config is missing', async () => {
    const result = await fileContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
    })

    expect(result).toBeNull()
  })

  it('returns null when tag is missing', async () => {
    const result = await fileContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: { provider: 'file-content', path: './test.md' },
    })

    expect(result).toBeNull()
  })

  it('returns null when path is missing', async () => {
    const result = await fileContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: { provider: 'file-content', tag: 'test-tag' },
    })

    expect(result).toBeNull()
  })

  it('reads file and wraps content with tag', async () => {
    vi.mocked(readFile).mockResolvedValue('file content here')

    const result = await fileContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: { provider: 'file-content', tag: 'aaa', path: './xxx.md' },
    })

    expect(result).toBe(`<aaa>
<content>
file content here
</content>
</aaa>`)
  })

  it('handles relative paths with ./', async () => {
    vi.mocked(readFile).mockResolvedValue('content')

    await fileContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: { provider: 'file-content', tag: 'doc', path: './docs/readme.md' },
    })

    const calledPath = vi.mocked(readFile).mock.calls[0][0] as string
    expect(calledPath).toContain('docs')
    expect(calledPath).toContain('readme.md')
  })

  it('handles absolute paths', async () => {
    vi.mocked(readFile).mockResolvedValue('content')

    await fileContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: { provider: 'file-content', tag: 'doc', path: '/absolute/path/file.md' },
    })

    expect(readFile).toHaveBeenCalledWith('/absolute/path/file.md', 'utf-8')
  })

  it('returns error tag when file read fails', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'))

    const result = await fileContentInjectionProvider.inject({
      workflow: null,
      state: null,
      currentStage: 'test-stage',
      stageDefinition: null,
      systemMessages: [],
      config: { provider: 'file-content', tag: 'aaa', path: './missing.md' },
    })

    expect(result).toBe(`<aaa>
<content></content>
<error>Failed to read file: ./missing.md</error>
</aaa>`)
  })
})
