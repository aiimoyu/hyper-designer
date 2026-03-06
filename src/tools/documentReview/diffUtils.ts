/**
 * 差异计算工具函数
 *
 * 使用 diff 包进行行级差异比较，并转换为结构化的 DiffHunk 格式。
 */

import * as diff from 'diff'
import type { DiffHunk } from './types'

const CONTEXT_MIN_LINES = 1
const CONTEXT_MAX_LINES = 5
const CONTEXT_CHAR_THRESHOLD = 75

/**
 * 计算字符串的有效字符数（排除空白字符）
 * @param text 文本
 * @returns 有效字符数
 */
function countEffectiveChars(text: string): number {
  return text.replace(/\s/g, '').length
}

/**
 * 根据有效字符数动态计算上下文行数
 * @param lines 所有行
 * @param startIndex 起始索引
 * @param endIndex 结束索引
 * @param direction 方向：'before' 或 'after'
 * @returns 应该取的行数
 */
function calculateContextLines(
  lines: string[],
  startIndex: number,
  endIndex: number,
  direction: 'before' | 'after'
): number {
  const availableLines = direction === 'before' 
    ? startIndex 
    : lines.length - endIndex - 1

  if (availableLines <= 0) return 0

  let totalChars = 0
  let lineCount = 0

  if (direction === 'before') {
    for (let i = startIndex - 1; i >= 0 && lineCount < CONTEXT_MAX_LINES; i--) {
      totalChars += countEffectiveChars(lines[i])
      lineCount++
      if (totalChars >= CONTEXT_CHAR_THRESHOLD) break
    }
  } else {
    for (let i = endIndex + 1; i < lines.length && lineCount < CONTEXT_MAX_LINES; i++) {
      totalChars += countEffectiveChars(lines[i])
      lineCount++
      if (totalChars >= CONTEXT_CHAR_THRESHOLD) break
    }
  }

  return Math.max(CONTEXT_MIN_LINES, Math.min(lineCount, availableLines, CONTEXT_MAX_LINES))
}

/**
 * 获取上下文内容
 * @param oldLines 原文件行数组
 * @param oldStartLine 修改起始行（1-based）
 * @param oldEndLine 修改结束行（1-based）
 * @param newStartLine 新文件起始行（1-based）
 * @returns 上下文信息
 */
function getContext(
  oldLines: string[],
  oldStartLine: number,
  oldEndLine: number,
  newStartLine: number
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

/**
 * 将 diffLines 结果转换为结构化的 DiffHunk 数组
 * @param oldContent 原始内容
 * @param newContent 修改后内容
 * @returns 差异块数组
 */
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
        ...context
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
        ...context
      })
      oldLine += lineCount
    } else {
      oldLine += lineCount
      newLine += lineCount
    }
  }

  return mergeAdjacentHunks(hunks, oldLines)
}

/**
 * 合并相邻的 delete + add 为 modify
 * @param hunks 原始差异块数组
 * @param oldLines 原文件行数组
 * @returns 合并后的差异块数组
 */
function mergeAdjacentHunks(hunks: DiffHunk[], oldLines: string[]): DiffHunk[] {
  const merged: DiffHunk[] = []
  let i = 0

  while (i < hunks.length) {
    const current = hunks[i]

    if (current.type === 'delete' && i + 1 < hunks.length && hunks[i + 1].type === 'add') {
      const next = hunks[i + 1]
      const context = getContext(
        oldLines,
        current.oldStart, current.oldEnd,
        next.newStart
      )
      merged.push({
        type: 'modify',
        oldStart: current.oldStart,
        oldEnd: current.oldEnd,
        oldContent: current.oldContent,
        newStart: next.newStart,
        newEnd: next.newEnd,
        newContent: next.newContent,
        ...context
      })
      i += 2
    } else {
      merged.push(current)
      i++
    }
  }

  return merged
}

/**
 * 计算差异统计信息
 * @param hunks 差异块数组
 * @returns 统计信息
 */
export function calculateSummary(hunks: DiffHunk[]): { additions: number; deletions: number; modifications: number } {
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

/**
 * 生成 Unified Diff 格式字符串
 * @param hunks 差异块数组
 * @param oldPath 原文件路径
 * @param newPath 新文件路径
 * @returns unified diff 字符串
 */
export function generateUnifiedDiff(hunks: DiffHunk[], oldPath: string, newPath: string): string {
  if (hunks.length === 0) return ''

  const lines: string[] = []
  lines.push(`--- ${oldPath}`)
  lines.push(`+++ ${newPath}`)

  for (const hunk of hunks) {
    const oldCount = hunk.oldEnd >= hunk.oldStart ? hunk.oldEnd - hunk.oldStart + 1 : 0
    const newCount = hunk.newEnd >= hunk.newStart ? hunk.newEnd - hunk.newStart + 1 : 0

    const beforeLines = hunk.contextBefore.split('\n').filter(l => l.length > 0 || hunk.contextBefore.endsWith('\n'))
    const afterLines = hunk.contextAfter.split('\n').filter(l => l.length > 0 || hunk.contextAfter.endsWith('\n'))

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
