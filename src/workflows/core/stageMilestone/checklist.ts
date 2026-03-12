import type { StageMilestoneRecord } from './types'

export interface UpsertStageMilestoneInput {
  type: string
  isCompleted: boolean
  detail: unknown
}

export function upsertStageMilestone(
  current: Record<string, StageMilestoneRecord> | undefined,
  input: UpsertStageMilestoneInput,
): Record<string, StageMilestoneRecord> {
  return {
    ...(current ?? {}),
    [input.type]: {
      type: input.type,
      timestamp: new Date().toISOString(),
      isCompleted: input.isCompleted,
      detail: input.detail,
    },
  }
}

export function listIncompleteMilestones(stageMilestones: Record<string, StageMilestoneRecord> | undefined): string[] {
  if (!stageMilestones) {
    return []
  }
  const incomplete: string[] = []
  for (const [key, milestone] of Object.entries(stageMilestones)) {
    if (!milestone.isCompleted) {
      incomplete.push(key)
    }
  }
  return incomplete
}
