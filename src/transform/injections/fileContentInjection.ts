import type { PromptInjectionProvider } from '../types'
import { HyperDesignerLogger } from '../../utils/logger'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

interface ReadFileResult {
  content: string | null
  error: string | null
}

async function readFileContent(filePath: string): Promise<ReadFileResult> {
  try {
    const cwd = process.cwd()
    const absolutePath = filePath.startsWith('./')
      ? resolve(cwd, filePath.slice(2))
      : filePath.startsWith('/')
        ? filePath
        : resolve(cwd, filePath)

    const content = await readFile(absolutePath, 'utf-8')
    return { content, error: null }
  } catch (error) {
    HyperDesignerLogger.warn('FileContentInjection', `Failed to read file: ${filePath}`, { error })
    return {
      content: null,
      error: `Failed to read file: ${filePath}`,
    }
  }
}

export const fileContentInjectionProvider: PromptInjectionProvider = {
  id: 'file-content',
  inject: async ({ config, currentStage }) => {
    if (!config?.tag || !config?.path) {
      HyperDesignerLogger.warn('FileContentInjection', 'Missing required config: tag or path')
      return null
    }

    const { tag, path } = config

    HyperDesignerLogger.debug('FileContentInjection', `Injecting file content for stage "${currentStage}"`, {
      tag,
      path,
    })

    const result = await readFileContent(path)

    if (result.error) {
      return `<${tag}>
<content></content>
<error>${result.error}</error>
</${tag}>`
    }

    return `<${tag}>
<content>
${result.content}
</content>
</${tag}>`
  },
}
