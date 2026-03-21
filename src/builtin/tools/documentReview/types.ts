export type DiffHunkType = 'add' | 'delete' | 'modify'

export interface DiffHunk {
  type: DiffHunkType
  oldStart: number
  oldEnd: number
  oldContent: string
  newStart: number
  newEnd: number
  newContent: string
  contextBefore: string
  contextAfter: string
  contextOldStart: number
  contextNewStart: number
}

export interface DocumentReviewParams {
  sourcePath: string
  reviewPath?: string
}

export interface PrepareReviewResult {
  success: boolean
  sourcePath: string
  reviewPath: string
  message: string
}

export interface FinalizeReviewResult {
  success: boolean
  hasChanges: boolean
  canProceedToNextStep: boolean
  hunks: DiffHunk[]
  summary: {
    additions: number
    deletions: number
    modifications: number
  }
  message: string
  unifiedDiff: string
}
