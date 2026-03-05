/**
 * 文档审核工具模块
 *
 * 提供文档审核流程的核心功能：
 * - prepareReview: 拷贝文档到项目根目录供用户修改
 * - finalizeReview: 获取差异并删除临时文件
 */

export { prepareReview } from './prepareReview'
export { finalizeReview } from './finalizeReview'
export { convertToHunks, calculateSummary } from './diffUtils'
export type {
  DiffHunk,
  DiffHunkType,
  DocumentReviewParams,
  PrepareReviewResult,
  FinalizeReviewResult,
} from './types'
