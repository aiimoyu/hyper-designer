import * as diff from 'diff'

import type { DiffHunk } from './types'

const CONTEXT_MIN_LINES = 1
const CONTEXT_MAX_LINES = 5
const CONTEXT_CHAR_THRESHOLD = 75

function countEffectiveChars(text: string): number {
  return text.replace(/\s/g, '').length
}

function calculateContextLines(
  lines: string[],
  startIndex: number,
  endIndex: number,
  direction: 'before' | 'after',
): number {
  const availableLines = direction === 'before'
    ? startIndex
    : lines.length - endIndex - 1

  if (availableLines <= 0) {
    return 0
  }

  let totalChars = 0
  let lineCount = 0

  if (direction === 'before') {
    for (let i = startIndex - 1; i >= 0 && lineCount < CONTEXT_MAX_LINES; i--) {
      totalChars += countEffectiveChars(lines[i])
      lineCount++
      if (totalChars >= CONTEXT_CHAR_THRESHOLD) {
        break
      }
    }
  } else {
    for (let i = endIndex + 1; i < lines.length && lineCount < CONTEXT_MAX_LINES; i++) {
      totalChars += countEffectiveChars(lines[i])
      lineCount++
      if (totalChars >= CONTEXT_CHAR_THRESHOLD) {
        break
      }
    }
  }

  return Math.max(CONTEXT_MIN_LINES, Math.min(lineCount, availableLines, CONTEXT_MAX_LINES))
}

function getContext(
  oldLines: string[],
  oldStartLine: number,
  oldEndLine: number,
  newStartLine: number,
): { contextBefore: string; contextAfter: string; contextOldStart: number; contextNewStart: number } {
  const beforeLineCount = calculateContextLines(oldLines, oldStartLine - 1, oldEndLine - 1, 'before')
  const afterLineCount = calculateContextLines(oldLines, oldStartLine - 1, oldEndLine - 1, 'after')

  const contextOldStart = Math.max(1, oldStartLine - beforeLineCount)
  const contextNewStart = Math.max(1, newStartLine - beforeLineCount)

  const contextBefore = oldLines
    .slice(Math.max(0, oldStartLine - 1 - beforeLineCount), oldStartLine - 1)
    .join('')

  const contextAfter = oldLines
    .slice(oldEndLine, oldEndLine + afterLineCount)
    .join('')

  return { contextBefore, contextAfter, contextOldStart, contextNewStart }
}

export function convertToHunks(oldContent: string, newContent: string): DiffHunk[] {
  const changes = diff.diffLines(oldContent, newContent)
  const oldLines = oldContent.split('\n')
  const hunks: DiffHunk[] = []

  let oldLine = 1
  let newLine = 1

  for (const change of changes) {
    const lineCount = change.count || 0

    if (change.added) {
      const context = getContext(oldLines, oldLine, oldLine - 1, newLine)
      hunks.push({
        type: 'add',
        oldStart: oldLine,
        oldEnd: oldLine - 1,
        oldContent: '',
        newStart: newLine,
        newEnd: newLine + lineCount - 1,
        newContent: change.value || '',
        ...context,
      })
      newLine += lineCount
    } else if (change.removed) {
      const context = getContext(oldLines, oldLine, oldLine + lineCount - 1, newLine)
      hunks.push({
        type: 'delete',
        oldStart: oldLine,
        oldEnd: oldLine + lineCount - 1,
        oldContent: change.value || '',
        newStart: newLine,
        newEnd: newLine - 1,
        newContent: '',
        ...context,
      })
      oldLine += lineCount
    } else {
      oldLine += lineCount
      newLine += lineCount
    }
  }

  return mergeAdjacentHunks(hunks, oldLines)
}

function mergeAdjacentHunks(hunks: DiffHunk[], oldLines: string[]): DiffHunk[] {
  const merged: DiffHunk[] = []
  let i = 0

  while (i < hunks.length) {
    const current = hunks[i]

    if (current.type === 'delete' && i + 1 < hunks.length && hunks[i + 1].type === 'add') {
      const next = hunks[i + 1]
      const context = getContext(
        oldLines,
        current.oldStart,
        current.oldEnd,
        next.newStart,
      )
      merged.push({
        type: 'modify',
        oldStart: current.oldStart,
        oldEnd: current.oldEnd,
        oldContent: current.oldContent,
        newStart: next.newStart,
        newEnd: next.newEnd,
        newContent: next.newContent,
        ...context,
      })
      i += 2
    } else {
      merged.push(current)
      i++
    }
  }

  return merged
}

export function calculateSummary(hunks: DiffHunk[]): {
  additions: number
  deletions: number
  modifications: number
} {
  let additions = 0
  let deletions = 0
  let modifications = 0

  for (const hunk of hunks) {
    switch (hunk.type) {
      case 'add':
        additions += hunk.newEnd - hunk.newStart + 1
        break
      case 'delete':
        deletions += hunk.oldEnd - hunk.oldStart + 1
        break
      case 'modify':
        modifications++
        additions += hunk.newEnd - hunk.newStart + 1
        deletions += hunk.oldEnd - hunk.oldStart + 1
        break
    }
  }

  return { additions, deletions, modifications }
}

export function generateUnifiedDiff(hunks: DiffHunk[], oldPath: string, newPath: string): string {
  if (hunks.length === 0) {
    return ''
  }

  const lines: string[] = []
  lines.push(`--- ${oldPath}`)
  lines.push(`+++ ${newPath}`)

  for (const hunk of hunks) {
    const oldCount = hunk.oldEnd >= hunk.oldStart ? hunk.oldEnd - hunk.oldStart + 1 : 0
    const newCount = hunk.newEnd >= hunk.newStart ? hunk.newEnd - hunk.newStart + 1 : 0

    const beforeLines = hunk.contextBefore.split('\n').filter(line => line.length > 0 || hunk.contextBefore.endsWith('\n'))
    const afterLines = hunk.contextAfter.split('\n').filter(line => line.length > 0 || hunk.contextAfter.endsWith('\n'))

    const contextOldStart = hunk.contextOldStart
    const contextOldCount = oldCount + beforeLines.length + afterLines.length
    const contextNewStart = hunk.contextNewStart
    const contextNewCount = newCount + beforeLines.length + afterLines.length

    lines.push(`@@ -${contextOldStart},${contextOldCount} +${contextNewStart},${contextNewCount} @@`)

    for (const line of beforeLines) {
      lines.push(` ${line}`)
    }

    if (hunk.type === 'delete' || hunk.type === 'modify') {
      const oldContentLines = hunk.oldContent.split('\n')
      for (const line of oldContentLines) {
        if (line.length > 0 || hunk.oldContent.endsWith('\n')) {
          lines.push(`-${line}`)
        }
      }
    }

    if (hunk.type === 'add' || hunk.type === 'modify') {
      const newContentLines = hunk.newContent.split('\n')
      for (const line of newContentLines) {
        if (line.length > 0 || hunk.newContent.endsWith('\n')) {
          lines.push(`+${line}`)
        }
      }
    }

    for (const line of afterLines) {
      lines.push(` ${line}`)
    }
  }

  return lines.join('\n')
}
