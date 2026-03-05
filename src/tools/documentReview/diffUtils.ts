/**
 * 差异计算工具函数
 *
 * 使用 diff 包进行行级差异比较，并转换为结构化的 DiffHunk 格式。
 */

import * as diff from 'diff'
import type { DiffHunk } from './types'

/**
 * 将 diffLines 结果转换为结构化的 DiffHunk 数组
 * @param oldContent 原始内容
 * @param newContent 修改后内容
 * @returns 差异块数组
 */
export function convertToHunks(oldContent: string, newContent: string): DiffHunk[] {
  const changes = diff.diffLines(oldContent, newContent)
  const hunks: DiffHunk[] = []

  let oldLine = 1
  let newLine = 1

  for (const change of changes) {
    const lineCount = change.count || 0

    if (change.added) {
      hunks.push({
        type: 'add',
        oldStart: oldLine,
        oldEnd: oldLine - 1,
        oldContent: '',
        newStart: newLine,
        newEnd: newLine + lineCount - 1,
        newContent: change.value
      })
      newLine += lineCount
    } else if (change.removed) {
      hunks.push({
        type: 'delete',
        oldStart: oldLine,
        oldEnd: oldLine + lineCount - 1,
        oldContent: change.value,
        newStart: newLine,
        newEnd: newLine - 1,
        newContent: ''
      })
      oldLine += lineCount
    } else {
      oldLine += lineCount
      newLine += lineCount
    }
  }

  return mergeAdjacentHunks(hunks)
}

/**
 * 合并相邻的 delete + add 为 modify
 * @param hunks 原始差异块数组
 * @returns 合并后的差异块数组
 */
function mergeAdjacentHunks(hunks: DiffHunk[]): DiffHunk[] {
  const merged: DiffHunk[] = []
  let i = 0

  while (i < hunks.length) {
    const current = hunks[i]

    if (current.type === 'delete' && i + 1 < hunks.length && hunks[i + 1].type === 'add') {
      const next = hunks[i + 1]
      merged.push({
        type: 'modify',
        oldStart: current.oldStart,
        oldEnd: current.oldEnd,
        oldContent: current.oldContent,
        newStart: next.newStart,
        newEnd: next.newEnd,
        newContent: next.newContent
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
