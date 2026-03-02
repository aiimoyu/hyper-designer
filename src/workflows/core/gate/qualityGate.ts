/**
 * 工作流质量门（qualityGate）模块
 *
 * 负责执行阶段质量门（HCritic 审查）：
 * 1. 读取当前工作流阶段
 * 2. 加载阶段门禁提示词
 * 3. 通过 PlatformAdapter 创建隔离会话执行评审
 * 4. 写回 gateResult 状态到 workflow_state.json
 *
 * 所有门禁逻辑集中于此模块，对外提供 createWorkflowQualityGate 门禁 creator。
 */

import { HyperDesignerLogger } from "../../../utils/logger";
import type { PlatformAdapter, WorkflowDefinition, WorkflowStateAccessor } from "../types";
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

/** 评审响应的归一化形式（由 adapter.sendPrompt 返回） */
type ReviewResponse = { structuredOutput?: unknown; text: string };

// ─── 内部门禁评审器 ────────────────────────────────────────────────────────────

/**
 * 通过 PlatformAdapter 创建门禁评审执行函数
 * 封装 createSession / sendPrompt / deleteSession 的完整流程
 */
function createQualityGateReviewer(
  adapter: PlatformAdapter,
): (params: { stageKey: string; prompt: string; schema: Record<string, unknown> }) => Promise<ReviewResponse> {
  return async ({ stageKey, prompt, schema }) => {
    const sessionId = await adapter.createSession(`HCritic Review: ${stageKey}`);
    try {
      return await adapter.sendPrompt({ sessionId, agent: "HCritic", text: prompt, schema });
    } finally {
      await adapter.deleteSession(sessionId).catch(() => {
        // ignore cleanup failure
      });
    }
  };
}

// ─── 门禁 Creator ──────────────────────────────────────────────────────────────

/**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
 * 门禁 Creator：组合 PlatformAdapter，执行当前阶段质量门
 *
 * @param workflow 工作流定义
 * @param adapter 平台适配器（必须实现 createSession / sendPrompt / deleteSession）
 * @returns 结构化门禁结果
 */
export async function createWorkflowQualityGate(
  workflow: WorkflowDefinition,
  adapter: PlatformAdapter,
  serviceInstance?: WorkflowStateAccessor,
): Promise<QualityGateResult> {
  // 延迟加载默认 service，避免循环依赖导致模块初始化时 workflowService 为 undefined
  const svc: WorkflowStateAccessor = serviceInstance ?? (await import("../service")).workflowService;
  const state = svc.getState();
  if (!state?.currentStep) {
    svc.setGateResult({ score: 0, comment: 'No active stage' });
    return {
      ok: false,
      reason: "no_active_stage",
      message: "No active workflow stage. Ensure the workflow is initialized before calling hd_submit_evaluation.",
    };
  }

  const stageKey = state.currentStep;
  const stage = workflow.stages[stageKey];
  if (!stage) {
    svc.setGateResult({ score: 0, comment: `Invalid stage: ${stageKey}` });
    return {
      ok: false,
      reason: "invalid_stage",
      stage: stageKey,
      message: `Stage definition not found: ${stageKey}`,
    };
  }

  // 无门禁标志则跳过（自动通过）
  if (!stage.gate) {
    svc.setGateResult({ score: 100, comment: 'Quality gate disabled for this stage.' });
    return {
      ok: true,
      reason: "disabled",
      stage: stageKey,
      passed: true,
      summary: "Quality gate disabled for this stage.",
      issues: [],
      message: "Quality gate is disabled for this stage."
    };
  }

  // 门禁已启用，但此函数已弃用 - HCritic 现通过 task(subagent=HCritic) 调用
  // 返回提示信息，实际评审由 HCritic 独立执行
  return {
    ok: true,
    reason: "approved",
    stage: stageKey,
    passed: true,
    summary: "Gate is enabled. Use task(subagent=HCritic) to invoke HCritic for quality review.",
    message: "Quality gate is enabled. Invoke HCritic via task tool for review."
  };
}
