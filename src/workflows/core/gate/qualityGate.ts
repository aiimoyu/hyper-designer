/**
 * 工作流质量门（qualityGate）模块
 *
 * 负责执行阶段质量门（HCritic 审查）：
 * 1. 读取当前工作流阶段
 * 2. 加载阶段门禁提示词
 * 3. 通过 capabilities.session 创建隔离会话执行评审
 * 4. 写回 gatePassed 状态到 workflow_state.json
 *
 * 所有门禁逻辑集中于此模块，对外提供 createWorkflowQualityGate 门禁 creator。
 */

import { HyperDesignerLogger } from "../../../utils/logger";
import type { WorkflowDefinition, StageHookCapabilities, WorkflowStateAccessor } from "../types";
import { parseReviewResult } from "./reviewParser";

export interface QualityGateResult {
  ok: boolean;
  reason: "approved" | "review_failed" | "no_active_stage" | "invalid_stage" | "runtime_error" | "disabled";
  stage?: string;
  passed?: boolean;
  summary?: string;
  issues?: string[];
  score?: number;
  message: string;
}

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
};

// ─── 内部类型 ──────────────────────────────────────────────────────────────────

/** 评审响应的归一化形式（由 capabilities.session.prompt 返回） */
type ReviewResponse = { structuredOutput?: unknown; text: string };

// ─── 内部门禁评审器 ────────────────────────────────────────────────────────────

/**
 * 通过 capabilities.session 原语创建门禁评审执行函数
 * 封装 session.create / session.prompt / session.delete 的完整流程
 */
function createQualityGateReviewer(
  capabilities: StageHookCapabilities,
): (params: { stageKey: string; prompt: string; schema: Record<string, unknown> }) => Promise<ReviewResponse> {
  return async ({ stageKey, prompt, schema }) => {
    const session = capabilities.session;
    if (!session) {
      throw new Error("capabilities.session is required for quality gate review");
    }

    const sessionId = await session.create(`HCritic Review: ${stageKey}`);
    try {
      return await session.prompt({ sessionId, agent: "HCritic", text: prompt, schema });
    } finally {
      await session.delete(sessionId).catch(() => {
        // ignore cleanup failure
      });
    }
  };
}

// ─── 门禁 Creator ──────────────────────────────────────────────────────────────

/**
 * 门禁 Creator：组合 capabilities，执行当前阶段质量门
 *
 * @param workflow 工作流定义
 * @param capabilities 平台能力对象（必须包含 session 原语）
 * @returns 结构化门禁结果
 */
export async function createWorkflowQualityGate(
  workflow: WorkflowDefinition,
  capabilities: StageHookCapabilities,
  serviceInstance?: WorkflowStateAccessor,
): Promise<QualityGateResult> {
  // 延迟加载默认 service，避免循环依赖导致模块初始化时 workflowService 为 undefined
  const svc: WorkflowStateAccessor = serviceInstance ?? (await import("../service")).workflowService;
  const state = svc.getState();
  if (!state?.currentStep) {
    svc.setGatePassed(false);
    return {
      ok: false,
      reason: "no_active_stage",
      message: "No active workflow stage. Use set_hd_workflow_current before calling hd_submit.",
    };
  }

  const stageKey = state.currentStep;
  const stage = workflow.stages[stageKey];
  if (!stage) {
    svc.setGatePassed(false);
    return {
      ok: false,
      reason: "invalid_stage",
      stage: stageKey,
      message: `Stage definition not found: ${stageKey}`,
    };
  }

  // 无提示词则跳过门禁（自动通过）
  if (!stage.qualityGate) {
    svc.setGatePassed(true);
    return {
      ok: true,
      reason: "disabled",
      stage: stageKey,
      passed: true,
      summary: "Quality gate disabled for this stage.",
      issues: [],
      message: "Quality gate is disabled for this stage.",
    };
  }

  const prompt = stage.qualityGate;
  const reviewFn = createQualityGateReviewer(capabilities);

  try {
    const reviewResponse = await reviewFn({ stageKey, prompt, schema: DEFAULT_REVIEW_SCHEMA });
    const parsed = parseReviewResult(reviewResponse.structuredOutput, reviewResponse.text);

    svc.setGatePassed(parsed.passed);
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
      };
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
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    try {
      HyperDesignerLogger.error("WorkflowGate", "执行门禁失败", err, {
        stageKey,
        action: "createWorkflowQualityGate",
      });
    } catch {
      // 严格模式下 logger 会重新抛出错误，在此吞噬以确保返回结构化结果
    }
    svc.setGatePassed(false);
    return {
      ok: false,
      reason: "runtime_error",
      stage: stageKey,
      message: `Quality gate failed: ${err.message}`,
    };
  }
}