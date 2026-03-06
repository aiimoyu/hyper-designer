/**
 * 文档审核工具类型定义
 *
 * 定义文档审核流程中使用的类型，包括差异块结构和工具返回结果。
 */

/** 差异块类型 */
export type DiffHunkType = 'add' | 'delete' | 'modify'

/** 差异块信息 */
export interface DiffHunk {
  /** 差异类型 */
  type: DiffHunkType
  /** 原文件起始行号 */
  oldStart: number
  /** 原文件结束行号 */
  oldEnd: number
  /** 原文件内容 */
  oldContent: string
  /** 新文件起始行号 */
  newStart: number
  /** 新文件结束行号 */
  newEnd: number
  /** 新文件内容 */
  newContent: string
  /** 修改前的上下文（原文件中修改位置之前的若干行） */
  contextBefore: string
  /** 修改后的上下文（原文件中修改位置之后的若干行） */
  contextAfter: string
  /** 上下文在原文件中的起始行号 */
  contextOldStart: number
  /** 上下文在新文件中的起始行号 */
  contextNewStart: number
}

/** 文档审核参数 */
export interface DocumentReviewParams {
  /** 源文件路径 */
  sourcePath: string
  /** 审核文件路径（可选，默认为项目根目录同名文件） */
  reviewPath?: string
}

/** hd_prepare_review 返回结果 */
export interface PrepareReviewResult {
  /** 操作是否成功 */
  success: boolean
  /** 源文件路径 */
  sourcePath: string
  /** 审核文件路径 */
  reviewPath: string
  /** 提示信息 */
  message: string
}

/** hd_finalize_review 返回结果 */
export interface FinalizeReviewResult {
  /** 操作是否成功 */
  success: boolean
  /** 是否有修改 */
  hasChanges: boolean
  /** 差异块列表 */
  hunks: DiffHunk[]
  /** 差异统计 */
  summary: {
    /** 新增行数 */
    additions: number
    /** 删除行数 */
    deletions: number
    /** 修改块数 */
    modifications: number
  }
  /** 提示信息 */
  message: string
  /** Unified diff 格式的差异输出，便于 Agent 理解和定位 */
  unifiedDiff: string
}
