import { stat, readdir } from 'fs/promises'
import { resolve } from 'path'
import * as glob from 'glob'
import type { StageFileItem } from './types'
import { HyperDesignerLogger } from '../../utils/logger'

export interface OutputCheckResult {
  success: boolean
  missing: StageFileItem[]
  matchCounts: Map<string, number>
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath)
    return s.isFile()
  } catch {
    return false
  }
}

async function checkFolderExists(folderPath: string): Promise<boolean> {
  try {
    const s = await stat(folderPath)
    return s.isDirectory()
  } catch {
    return false
  }
}

function countPatternMatches(pattern: string): number {
  try {
    const cwd = process.cwd()
    const absolutePattern = pattern.startsWith('./')
      ? pattern.slice(2)
      : pattern
    const matches = glob.sync(absolutePattern, { cwd })
    return matches.length
  } catch (error) {
    HyperDesignerLogger.warn('OutputChecker', `Failed to check pattern: ${pattern}`, { error })
    return 0
  }
}

export async function checkStageOutputs(outputs: StageFileItem[]): Promise<OutputCheckResult> {
  const cwd = process.cwd()
  const missing: StageFileItem[] = []
  const matchCounts = new Map<string, number>()

  for (const output of outputs) {
    const absolutePath = output.path.startsWith('./')
      ? resolve(cwd, output.path.slice(2))
      : resolve(cwd, output.path)

    if (output.type === 'file') {
      const exists = await checkFileExists(absolutePath)
      if (!exists) {
        missing.push(output)
        matchCounts.set(output.id, 0)
      } else {
        matchCounts.set(output.id, 1)
      }
    } else if (output.type === 'folder') {
      const exists = await checkFolderExists(absolutePath)
      if (!exists) {
        missing.push(output)
        matchCounts.set(output.id, 0)
      } else {
        const entries = await readdir(absolutePath)
        matchCounts.set(output.id, entries.length)
      }
    } else if (output.type === 'pattern') {
      const count = await countPatternMatches(output.path)
      matchCounts.set(output.id, count)
      if (count === 0) {
        missing.push(output)
      }
    }
  }

  return {
    success: missing.length === 0,
    missing,
    matchCounts,
  }
}

export function formatMissingOutputsMessage(missing: StageFileItem[], matchCounts: Map<string, number>): string {
  const lines: string[] = ['阶段输出不完整，以下文件未生成：', '']

  for (const item of missing) {
    lines.push(`- [${item.id}] ${item.path}`)
    lines.push(`  说明：${item.description}`)

    if (item.type === 'pattern') {
      const count = matchCounts.get(item.id) ?? 0
      lines.push(`  当前匹配：${count} 个文件`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
