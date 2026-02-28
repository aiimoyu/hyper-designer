/**
 * 工作流门禁模块
 *
 * 负责执行阶段质量门（HCritic 审查）：
 * 1. 读取当前工作流阶段
 * 2. 加载阶段门禁提示词
 * 3. 调用平台注入 reviewFn 执行审查
 * 4. 写回 gatePassed 状态到 workflow_state.json
 */

import { HyperDesignerLogger } from "../../utils/logger"
import { getWorkflowState, setWorkflowGatePassed } from "./state"
import type { WorkflowDefinition } from "./types"

export interface QualityGateResult {
  ok: boolean
  reason: "approved" | "review_failed" | "no_active_stage" | "invalid_stage" | "runtime_error" | "disabled"
  stage?: string
  passed?: boolean
  summary?: string
  issues?: string[]
  score?: number
  message: string
}

/**
 * 平台注入的质量门评审函数类型
 * 由 opencode hooks 提供，封装 session.create / session.prompt / session.delete
 */
export type QualityGateReviewFn = (params: {
  stageKey: string
  prompt: string
  schema: Record<string, unknown>
}) => Promise<{
  structuredOutput?: unknown
  text: string
}>

export const DEFAULT_REVIEW_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    passed: { type: "boolean", description: "Whether this stage passes HCritic review." },
    summary: { type: "string", description: "Short review summary in Chinese." },
    issues: {
      type: "array",
      description: "Blocking issues that must be fixed before approval.",
      items: { type: "string" },
    },
    score: { type: "number", description: "Optional quality score from 0 to 100." },
  },
  required: ["passed", "summary", "issues"],
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null
}

const inferPassFromText = (text: string): boolean => {
  const lower = text.toLowerCase()
  if (lower.includes("fail") || text.includes("未通过") || text.includes("不通过")) {
    return false
  }
  return lower.includes("pass") || text.includes("通过") || lower.includes("approved")
}

const parseReviewResult = (structuredOutput: unknown, reviewText: string): {
  passed: boolean
  summary: string
  issues: string[]
  score?: number
} => {
  if (!isRecord(structuredOutput)) {
    return {
      passed: inferPassFromText(reviewText),
      summary: reviewText || "HCritic 未返回结构化结论。",
      issues: [],
    }
  }

  const issues = Array.isArray(structuredOutput.issues)
    ? structuredOutput.issues.filter((item): item is string => typeof item === "string")
    : []
  const passed = typeof structuredOutput.passed === "boolean"
    ? structuredOutput.passed
    : inferPassFromText(reviewText)
  const summary = typeof structuredOutput.summary === "string"
    ? structuredOutput.summary
    : reviewText || (passed ? "评审通过" : "评审未通过")
  const score = typeof structuredOutput.score === "number" ? structuredOutput.score : undefined

  return {
    passed,
    summary,
    issues,
    ...(score !== undefined ? { score } : {}),
  }
}

/**
 * 执行当前阶段质量门
 * @param workflow 工作流定义
 * @param reviewFn 平台注入的评审执行函数
 * @returns 结构化门禁结果
 */
export async function executeWorkflowQualityGate(
  workflow: WorkflowDefinition,
  reviewFn: QualityGateReviewFn,
): Promise<QualityGateResult> {
  const state = getWorkflowState()
  if (!state?.currentStep) {
    setWorkflowGatePassed(false)
    return {
      ok: false,
      reason: "no_active_stage",
      message: "No active workflow stage. Use set_hd_workflow_current before calling hd_submit.",
    }
  }

  const stageKey = state.currentStep
  const stage = workflow.stages[stageKey]
  if (!stage) {
    setWorkflowGatePassed(false)
    return {
      ok: false,
      reason: "invalid_stage",
      stage: stageKey,
      message: `Stage definition not found: ${stageKey}`,
    }
  }

  // 无提示词则跳过门禁（自动通过）
  if (!stage.qualityGate) {
    setWorkflowGatePassed(true)
    return {
      ok: true,
      reason: "disabled",
      stage: stageKey,
      passed: true,
      summary: "Quality gate disabled for this stage.",
      issues: [],
      message: "Quality gate is disabled for this stage.",
    }
  }

  const prompt = stage.qualityGate

  try {
    const reviewResponse = await reviewFn({ stageKey, prompt, schema: DEFAULT_REVIEW_SCHEMA })
    const parsed = parseReviewResult(reviewResponse.structuredOutput, reviewResponse.text)

    setWorkflowGatePassed(parsed.passed)
    if (!parsed.passed) {
      return {
        ok: false,
        reason: "review_failed",
        stage: stageKey,
        passed: false,
        summary: parsed.summary,
        issues: parsed.issues,
        ...(parsed.score !== undefined ? { score: parsed.score } : {}),
        message: "HCritic review failed. Fix issues and resubmit.",
      }
    }

    return {
      ok: true,
      reason: "approved",
      stage: stageKey,
      passed: true,
      summary: parsed.summary,
      issues: parsed.issues,
      ...(parsed.score !== undefined ? { score: parsed.score } : {}),
      message: "HCritic review passed.",
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.error("WorkflowGate", "执行门禁失败", err, {
      stageKey,
      action: "executeWorkflowQualityGate",
    })
    setWorkflowGatePassed(false)
    return {
      ok: false,
      reason: "runtime_error",
      stage: stageKey,
      message: `Quality gate failed: ${err.message}`,
    }
  }
}
