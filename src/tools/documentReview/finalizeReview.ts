/**
 * 完成文档审核工具
 *
 * 获取用户修改前后的差异，返回结构化差异数据，并删除临时审核文件。
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import type { DocumentReviewParams, FinalizeReviewResult } from './types'
import { convertToHunks, calculateSummary } from './diffUtils'
import { HyperDesignerLogger } from '../../utils/logger'

/**
 * 获取默认审核文件路径
 * @param sourcePath 源文件路径
 * @param projectRoot 项目根目录
 * @returns 审核文件路径
 */
function getDefaultReviewPath(sourcePath: string, projectRoot: string): string {
  const fileName = path.basename(sourcePath)
  return path.join(projectRoot, fileName)
}

/**
 * 完成文档审核
 * @param params 参数
 * @returns 审核结果
 */
export async function finalizeReview(
  params: DocumentReviewParams & { projectRoot?: string }
): Promise<FinalizeReviewResult> {
  const { sourcePath, reviewPath: customReviewPath, projectRoot = process.cwd() } = params

  HyperDesignerLogger.debug('DocumentReview', '完成文档审核', { sourcePath, projectRoot })

  const reviewPath = customReviewPath || getDefaultReviewPath(sourcePath, projectRoot)

  const reviewFileExists = await fs.access(reviewPath).then(() => true).catch(() => false)
  if (!reviewFileExists) {
    HyperDesignerLogger.warn('DocumentReview', '审核文件已被删除', { reviewPath })
    return {
      success: false,
      hasChanges: false,
      hunks: [],
      summary: { additions: 0, deletions: 0, modifications: 0 },
      message: `审核文件已被删除，请重新准备审核: ${reviewPath}`
    }
  }

  try {
    const [oldContent, newContent] = await Promise.all([
      fs.readFile(sourcePath, 'utf-8'),
      fs.readFile(reviewPath, 'utf-8')
    ])

    const hunks = convertToHunks(oldContent, newContent)
    const summary = calculateSummary(hunks)
    const hasChanges = hunks.length > 0

    await fs.unlink(reviewPath)

    HyperDesignerLogger.info('DocumentReview', '文档审核完成', {
      sourcePath,
      hasChanges,
      summary
    })

    if (!hasChanges) {
      return {
        success: true,
        hasChanges: false,
        hunks: [],
        summary: { additions: 0, deletions: 0, modifications: 0 },
        message: 'Document has no modifications'
      }
    }

    return {
      success: true,
      hasChanges: true,
      hunks,
      summary,
      message: `Detected ${summary.modifications} modifications. Please identify the user's intent (addition, deletion, modification) based on the differences and modify the file according to the user's intent`
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.error('DocumentReview', '获取差异失败', err, { sourcePath, reviewPath })
    return {
      success: false,
      hasChanges: false,
      hunks: [],
      summary: { additions: 0, deletions: 0, modifications: 0 },
      message: `Failed to get diff hunks: ${err.message}`
    }
  }
}
