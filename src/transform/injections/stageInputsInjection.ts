import type { PromptInjectionProvider } from '../types'
import type { StageFileItem } from '../../workflows/core/types'
import { HyperDesignerLogger } from '../../utils/logger'
import { readFile } from 'fs/promises'
import { readdir } from 'fs/promises'
import { resolve } from 'path'
import * as glob from 'glob'

function formatInputFileItem(item: StageFileItem): string {
  const contentSection = item.content
    ? `\n    <content>\n${item.content}\n    </content>`
    : ''
  return `  <item>
    <id>${item.id}</id>
    <path>${item.path}</path>
    <type>${item.type}</type>
    <description>${item.description}</description>${contentSection}
  </item>`
}

async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    HyperDesignerLogger.warn('StageInputsInjection', `Failed to read file: ${filePath}`, { error })
    return `[Error reading file: ${error instanceof Error ? error.message : String(error)}]`
  }
}

async function readFolderTree(folderPath: string): Promise<string> {
  try {
    const entries = await readdir(folderPath, { withFileTypes: true })
    const lines: string[] = []
    for (const entry of entries) {
      if (entry.isDirectory()) {
        lines.push(`📁 ${entry.name}/`)
      } else {
        lines.push(`📄 ${entry.name}`)
      }
    }
    return lines.join('\n')
  } catch (error) {
    HyperDesignerLogger.warn('StageInputsInjection', `Failed to read folder: ${folderPath}`, { error })
    return `[Error reading folder: ${error instanceof Error ? error.message : String(error)}]`
  }
}

function resolvePatternMatches(pattern: string): string[] {
  try {
    const cwd = process.cwd()
    const absolutePattern = pattern.startsWith('./')
      ? pattern.slice(2)
      : pattern
    const matches = glob.sync(absolutePattern, { cwd })
    return matches
  } catch (error) {
    HyperDesignerLogger.warn('StageInputsInjection', `Failed to resolve pattern: ${pattern}`, { error })
    return []
  }
}

async function enrichInputItem(item: StageFileItem): Promise<StageFileItem> {
  const cwd = process.cwd()
  const absolutePath = item.path.startsWith('./')
    ? resolve(cwd, item.path.slice(2))
    : resolve(cwd, item.path)

  if (item.type === 'file') {
    const content = await readFileContent(absolutePath)
    return { ...item, content }
  }

  if (item.type === 'folder') {
    const tree = await readFolderTree(absolutePath)
    return { ...item, content: tree }
  }

  if (item.type === 'pattern') {
    const matches = resolvePatternMatches(item.path)
    if (matches.length === 0) {
      return { ...item, content: '[No matching files found]' }
    }

    const contents: string[] = []
    for (const match of matches) {
      const matchPath = resolve(cwd, match)
      const fileContent = await readFileContent(matchPath)
      contents.push(`--- ${match} ---\n${fileContent}`)
    }
    return { ...item, content: contents.join('\n\n') }
  }

  return item
}

export const stageInputsInjectionProvider: PromptInjectionProvider = {
  id: 'stage-inputs',
  inject: async ({ stageDefinition, currentStage }) => {
    const inputs = stageDefinition?.inputs
    if (!inputs || inputs.length === 0 || !currentStage) {
      return null
    }

    HyperDesignerLogger.debug('StageInputsInjection', `Injecting input files for stage "${currentStage}"`, {
      inputCount: inputs.length,
    })

    const enrichedItems = await Promise.all(inputs.map(enrichInputItem))
    const itemsXml = enrichedItems.map(formatInputFileItem).join('\n')

    return `<stage-input-files>
${itemsXml}
</stage-input-files>`
  },
}
