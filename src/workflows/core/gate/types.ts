/**
 * 工作流质量门类型定义
 *
 * 集中定义质量门相关类型，供其他模块引用。
 */

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