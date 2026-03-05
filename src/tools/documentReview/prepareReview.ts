/**
 * 准备文档审核工具
 *
 * 将源文件拷贝到项目根目录供用户修改。
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import type { DocumentReviewParams, PrepareReviewResult } from './types'
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
 * 准备文档审核
 * @param params 参数
 * @returns 准备结果
 */
export async function prepareReview(
  params: DocumentReviewParams & { projectRoot?: string }
): Promise<PrepareReviewResult> {
  const { sourcePath, reviewPath: customReviewPath, projectRoot = process.cwd() } = params

  HyperDesignerLogger.debug('DocumentReview', '准备文档审核', { sourcePath, projectRoot })

  const reviewPath = customReviewPath || getDefaultReviewPath(sourcePath, projectRoot)

  try {
    await fs.access(sourcePath)
  } catch {
    HyperDesignerLogger.warn('DocumentReview', '源文件不存在', { sourcePath })
    return {
      success: false,
      sourcePath,
      reviewPath,
      message: `源文件不存在: ${sourcePath}`
    }
  }

  try {
    await fs.mkdir(path.dirname(reviewPath), { recursive: true })
    await fs.copyFile(sourcePath, reviewPath)

    HyperDesignerLogger.info('DocumentReview', '文档已拷贝到审核目录', {
      sourcePath,
      reviewPath
    })

    return {
      success: true,
      sourcePath,
      reviewPath,
      message: `文档已拷贝到项目根目录，请修改 ${reviewPath}`
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.error('DocumentReview', '拷贝文档失败', err, { sourcePath, reviewPath })
    return {
      success: false,
      sourcePath,
      reviewPath,
      message: `拷贝文档失败: ${err.message}`
    }
  }
}
