/**
 * WorkflowService - 工作流服务类
 *
 * 提供工作流状态管理的统一接口，封装状态操作并提供事件通知。
 * 作为工作流引擎的核心服务层，负责状态持久化和业务逻辑协调。
 */

import { EventEmitter } from "events";
import type { WorkflowDefinition, StageHookCapabilities } from "./types";
import type { WorkflowState } from "./state";
import {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowGatePassed,
  setWorkflowHandover,
  executeWorkflowHandover,
} from "./state";
import { getWorkflowDefinition } from "./registry";
import type { QualityGateResult } from "./gate";
import { DEFAULT_REVIEW_SCHEMA } from "./gate";
import { parseReviewResult } from "./reviewParser";
import { HyperDesignerLogger } from "../../utils/logger";

/**
 * WorkflowService 事件类型映射
 */
interface WorkflowServiceEvents {
  stageCompleted: { stageName: string; isCompleted: boolean };
  currentChanged: { previousStep: string | null; newStep: string };
  handoverScheduled: { targetStep: string };
  handoverExecuted: { fromStep: string; toStep: string };
  gateChanged: { passed: boolean };
}

/**
 * 工作流服务类
 *
 * 提供工作流状态管理的统一接口，封装底层状态操作并提供事件通知机制。
 * 使用模块级单例模式确保全局状态一致性。
 */
export class WorkflowService extends EventEmitter {
  private definition: WorkflowDefinition;

  /**
   * 创建工作流服务实例
   * @param definition 可选的工作流定义，不提供时使用默认经典工作流
   */
  constructor(definition?: WorkflowDefinition) {
    super();
    this.definition = definition ?? getWorkflowDefinition("classic");
  }

  /**
   * 获取当前活动阶段
   * @returns 当前阶段名称或 null（无活动阶段）
   */
  getCurrentStage(): string | null {
    const state = getWorkflowState();
    return state?.currentStep ?? null;
  }

  /**
   * 获取工作流定义
   * @returns 当前工作流定义
   */
  getDefinition(): WorkflowDefinition {
    return this.definition;
  }

  /**
   * 获取当前工作流状态
   * @returns 工作流状态或 null（无状态）
   */
  getState(): WorkflowState | null {
    return getWorkflowState();
  }

  /**
   * 设置阶段完成状态
   * @param stageName 阶段名称
   * @param isCompleted 是否完成
   * @returns 更新后的工作流状态
   */
  setStage(stageName: string, isCompleted: boolean): WorkflowState {
    return setWorkflowStage(stageName, isCompleted, this.definition);
  }

  /**
   * 设置当前活动步骤
   * @param stepName 步骤名称或 null（清除当前步骤）
   * @returns 更新后的工作流状态
   */
  setCurrent(stepName: string): WorkflowState {
    return setWorkflowCurrent(stepName, this.definition);
  }

  /**
   * 设置工作流交接目标
   * @param stepName 目标步骤名称或 null（清除交接）
   * @returns 更新后的工作流状态
   */
  setHandover(stepName: string | null): WorkflowState {
    return setWorkflowHandover(stepName, this.definition);
  }

  /**
   * 执行工作流交接
   * @param sessionID 可选的会话ID
   * @param capabilities 可选的阶段钩子能力
   * @returns 更新后的工作流状态
   */
  async executeHandover(sessionID?: string, capabilities?: StageHookCapabilities): Promise<WorkflowState> {
    return executeWorkflowHandover(this.definition, sessionID, capabilities);
  }

  /**
   * 检查质量门禁是否通过
   * @returns 门禁是否通过
   */
  isGatePassed(): boolean {
    const state = getWorkflowState();
    return state?.gatePassed ?? false;
  }

  /**
   * 设置质量门禁通过状态
   * @param passed 是否通过
   * @returns 更新后的工作流状态
   */
  setGatePassed(passed: boolean): WorkflowState {
    return setWorkflowGatePassed(passed);
  }

  /**
   * 执行当前阶段的质量门禁评审
   * @param capabilities 平台能力对象（必须包含 session 原语）
   * @returns 结构化门禁结果
   */
  async executeQualityGate(capabilities: StageHookCapabilities): Promise<QualityGateResult> {
    const state = getWorkflowState();
    if (!state?.currentStep) {
      setWorkflowGatePassed(false);
      return {
        ok: false,
        reason: "no_active_stage",
        message: "No active workflow stage. Use set_hd_workflow_current before calling hd_submit.",
      };
    }

    const stageKey = state.currentStep;
    const stage = this.definition.stages[stageKey];
    if (!stage) {
      setWorkflowGatePassed(false);
      return {
        ok: false,
        reason: "invalid_stage",
        stage: stageKey,
        message: `Stage definition not found: ${stageKey}`,
      };
    }

    // 无提示词则跳过门禁（自动通过）
    if (!stage.qualityGate) {
      setWorkflowGatePassed(true);
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
    const session = capabilities.session;
    if (!session) {
      setWorkflowGatePassed(false);
      return {
        ok: false,
        reason: "runtime_error",
        stage: stageKey,
        message: "capabilities.session is required for quality gate review",
      };
    }

    try {
      const sessionId = await session.create(`HCritic Review: ${stageKey}`);
      let reviewResponse: { structuredOutput?: unknown; text: string };
      try {
        reviewResponse = await session.prompt({ sessionId, agent: "HCritic", text: prompt, schema: DEFAULT_REVIEW_SCHEMA });
      } finally {
        await session.delete(sessionId).catch(() => {
          // ignore cleanup failure
        });
      }

      const parsed = parseReviewResult(reviewResponse.structuredOutput, reviewResponse.text);

      setWorkflowGatePassed(parsed.passed);
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
        HyperDesignerLogger.error("WorkflowService", "执行门禁失败", err, {
          stageKey,
          action: "executeQualityGate",
        });
      } catch {
        // Strict mode re-throws; swallow to return structured result
      }
      setWorkflowGatePassed(false);
      return {
        ok: false,
        reason: "runtime_error",
        stage: stageKey,
        message: `Quality gate failed: ${err.message}`,
      };
    }
  }

  /**
   * 重置工作流状态
   * 当前为空操作 - 磁盘是唯一数据源，无内存缓存需要清除
   */
  reset(): void {
    // No-op: disk is source of truth, no in-memory cache to clear
    // Method signature preserved for future use
  }
}

/**
 * 全局工作流服务单例实例
 */
export const workflowService = new WorkflowService();
