import type { PromptInjectionProvider } from '../types'
import type { StageFileItem } from '../../workflows/types'
import { HyperDesignerLogger } from '../../utils/logger'
import { readFile } from 'fs/promises'
import { readdir } from 'fs/promises'
import { resolve } from 'path'
import * as glob from 'glob'

interface ReadResult {
  content: string | null
  error: string | null
}

function formatInputFileItem(item: StageFileItem): string {
  const contentSection = item.content
    ? `\n    <content>\n${item.content}\n    </content>`
    : '\n    <content></content>'
  const errorSection = item.error
    ? `\n    <error>${item.error}</error>`
    : ''
  return `  <item>
    <id>${item.id}</id>
    <path>${item.path}</path>
    <type>${item.type}</type>
    <description>${item.description}</description>${contentSection}${errorSection}
  </item>`
}

async function readFileContent(filePath: string): Promise<ReadResult> {
  try {
    const content = await readFile(filePath, 'utf-8')
    return { content, error: null }
  } catch (error) {
    HyperDesignerLogger.warn('StageInputsInjection', `Failed to read file: ${filePath}`, { error })
    return {
      content: null,
      error: `Failed to read file: ${filePath}`,
    }
  }
}

async function readFolderTree(folderPath: string): Promise<ReadResult> {
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
    return { content: lines.join('\n'), error: null }
  } catch (error) {
    HyperDesignerLogger.warn('StageInputsInjection', `Failed to read folder: ${folderPath}`, { error })
    return {
      content: null,
      error: `Failed to read folder: ${folderPath}`,
    }
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

function expandPatternItems(items: StageFileItem[]): StageFileItem[] {
  const result: StageFileItem[] = []

  for (const item of items) {
    if (item.type !== 'pattern') {
      result.push(item)
      continue
    }

    const matches = resolvePatternMatches(item.path)
    if (matches.length === 0) {
      // Keep the original item with an error if no matches
      result.push({ ...item, error: 'No matching files found' })
      continue
    }

    // Expand pattern into multiple file items
    for (const match of matches) {
      result.push({
        id: `${item.id}:${match}`,
        path: match,
        type: 'file',
        description: `${item.description} (${match})`,
      })
    }
  }

  return result
}

async function enrichInputItem(item: StageFileItem): Promise<StageFileItem> {
  const cwd = process.cwd()
  const absolutePath = item.path.startsWith('./')
    ? resolve(cwd, item.path.slice(2))
    : resolve(cwd, item.path)

  if (item.type === 'file') {
    const result = await readFileContent(absolutePath)
    const enriched: StageFileItem = { ...item }
    if (result.content) enriched.content = result.content
    if (result.error) enriched.error = result.error
    return enriched
  }

  if (item.type === 'folder') {
    const result = await readFolderTree(absolutePath)
    const enriched: StageFileItem = { ...item }
    if (result.content) enriched.content = result.content
    if (result.error) enriched.error = result.error
    return enriched
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

    const expandedInputs = expandPatternItems(inputs)
    const enrichedItems = await Promise.all(expandedInputs.map(enrichInputItem))
    const itemsXml = enrichedItems.map(formatInputFileItem).join('\n')

    return `<stage-input-files>
${itemsXml}
</stage-input-files>`
  },
}
