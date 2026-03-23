import * as fs from 'fs/promises'
import * as path from 'path'

import { HyperDesignerLogger } from '../../../utils/logger'

import type { DocumentReviewParams, PrepareReviewResult } from './types'

function getDefaultReviewPath(sourcePath: string, projectRoot: string): string {
  const fileName = path.basename(sourcePath)
  return path.join(projectRoot, fileName)
}

export async function prepareReview(
  params: DocumentReviewParams & { projectRoot?: string },
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
      message: `Source file does not exist: ${sourcePath}`,
    }
  }

  try {
    await fs.mkdir(path.dirname(reviewPath), { recursive: true })
    await fs.copyFile(sourcePath, reviewPath)

    HyperDesignerLogger.info('DocumentReview', '文档已拷贝到审核目录', {
      sourcePath,
      reviewPath,
    })

    return {
      success: true,
      sourcePath,
      reviewPath,
      message: `User annotation document generated: ${reviewPath}. Please guide the user to modify the file at the above path and ask the user to answer "修改完成" (modifications completed) or "无需修改" (no modifications needed). After the user responds, call hd_finalize_review to get the user's modified content`,
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.error('DocumentReview', '拷贝文档失败', err, { sourcePath, reviewPath })
    return {
      success: false,
      sourcePath,
      reviewPath,
      message: `Failed to copy document: ${err.message}`,
    }
  }
}
