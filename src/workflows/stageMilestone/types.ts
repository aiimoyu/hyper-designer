export const GATE_MILESTONE_KEY = 'gate'
export const FORCE_ADVANCE_MILESTONE_KEY = 'force_advance'
export const GATE_PASS_THRESHOLD = 75
export interface StageMilestoneRecord {
  type: string
  timestamp: string
  mark: boolean
  detail: unknown
}
export interface GateMilestoneDetail {
  score: number | null
  comment?: string | null
}

export function isGateMilestoneDetail(value: unknown): value is GateMilestoneDetail {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const score = (value as { score?: unknown }).score
  if (typeof score !== 'number' && score !== null) {
    return false
  }
  const comment = (value as { comment?: unknown }).comment
  return comment === undefined || comment === null || typeof comment === 'string'
}
