/**
 * WorkflowService - 工作流服务类
 *
 * 提供工作流状态管理的统一接口，封装状态操作并提供事件通知。
 * 作为工作流引擎的核心服务层，负责状态持久化和业务逻辑协调。
 */

import { EventEmitter } from "events";
import type { WorkflowDefinition, PlatformAdapter } from "../types";
import type { WorkflowState, GateResult } from "../state/types";
import {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowGateResult,
  setWorkflowHandover,
  executeWorkflowHandover,
} from "../state";
import { getWorkflowDefinition } from "../registry";
import { getHandoverAgent, getHandoverPrompt } from "../runtime/handover";

/** 质量门通过分数阈值 */
const GATE_PASS_THRESHOLD = 75;

/**
 * WorkflowService 事件类型映射
 */
export interface WorkflowServiceEvents {
stageCompleted: { stageName: string; isCompleted: boolean };
currentChanged: { previousStep: string | null; newStep: string };
handoverScheduled: { targetStep: string };
handoverExecuted: { fromStep: string; toStep: string };
gateChanged: { score: number | null; comment?: string | null; stage?: string | null };
}

/**
 * hdScheduleHandover 返回值类型
 */
export interface HandoverResult {
  success: boolean;
  handover_to?: string;
  instruction?: string;
  error?: string;
  state?: WorkflowState;
}

/**
 * 工作流服务类
 *
 * 提供工作流状态管理的统一接口，封装底层状态操作并提供事件通知机制。
 * 使用模块级单例模式确保全局状态一致性。
 */
export class WorkflowService extends EventEmitter {
  private definition: WorkflowDefinition;
  /** 内存锁：防止 session.idle 在 afterStage 钩子执行期间触发重入交接 */
  private _handoverInProgress = false;

  /**
   * 创建工作流服务实例
   * @param definition 可选的工作流定义，不提供时使用默认经典工作流
   */
  constructor(definition?: WorkflowDefinition) {
    super();
    const defaultDefinition = getWorkflowDefinition("classic");
    this.definition = definition ?? defaultDefinition ?? this.getDefaultFallback();
  }

  /**
   * 获取默认回退工作流定义
   * 延迟导入避免循环依赖
   */
  private getDefaultFallback(): WorkflowDefinition {
    const { classicWorkflow } = require("../../plugins/classic");
    return classicWorkflow;
  }

  /**
   * 获取当前活动阶段
   * @returns 当前阶段名称或 null（无活动阶段）
   */
  getCurrentStage(): string | null {
    const state = getWorkflowState();
    return state?.current?.name ?? null;
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
    const state = setWorkflowStage(stageName, isCompleted, this.definition);
    if (state.workflow[stageName]) {
      this.emit('stageCompleted', { stageName, isCompleted });
    }
    return state;
  }

  /**
   * 设置当前活动步骤
   * @param stepName 步骤名称或 null（清除当前步骤）
   * @returns 更新后的工作流状态
   */
  setCurrent(stepName: string): WorkflowState {
    const previousStep = this.getCurrentStage();
    const state = setWorkflowCurrent(stepName, this.definition);
    if (state.current?.name === stepName) {
      this.emit('currentChanged', { previousStep, newStep: stepName });
    }
    return state;
  }


  /**
   * 设置工作流交接目标
   * @param stepName 目标步骤名称或 null（清除交接）
   * @returns 更新后的工作流状态
   */
  setHandover(stepName: string | null): WorkflowState {
    const state = setWorkflowHandover(stepName, this.definition);
    if (stepName !== null && state.current?.handoverTo === stepName) {
      this.emit('handoverScheduled', { targetStep: stepName });
    }
    return state;
  }


  /**
   * 执行工作流交接
   * @param sessionID 可选的会话ID
   * @param capabilities 可选的阶段钩子能力
   * @returns 更新后的工作流状态
   */
  async executeHandover(sessionID?: string, adapter?: PlatformAdapter): Promise<WorkflowState> {
    const fromStep = this.getCurrentStage();
    const preState = this.getState();
    const toStep = preState?.current?.handoverTo ?? null;
    this._handoverInProgress = true;
    try {
      const state = await executeWorkflowHandover(this.definition, sessionID, adapter);
      if (toStep !== null && state.current?.name === toStep) {
        this.emit('handoverExecuted', { fromStep: fromStep ?? '', toStep });
      }
      return state;
    } finally {
      this._handoverInProgress = false;
    }
  }

  /**
   * 检查是否有交接正在执行中（内存锁）
   * 供 event-handler 在 session.idle 时查询，防止重入
   * @returns 是否有交接正在执行
   */
  isHandoverInProgress(): boolean {
    return this._handoverInProgress;
  }


  // ─── 质量门 API ──────────────────────────────────────────────────────────────

  /**
   * 检查质量门是否通过（score > 75）
   * @returns 门禁是否通过
   */
  isGateApproved(): boolean {
    const state = getWorkflowState();
    const score = state?.current?.gateResult?.score;
    return typeof score === 'number' && score > GATE_PASS_THRESHOLD;
  }


  /**
   * @deprecated 使用 isGateApproved() 替代。保留以兼容旧代码。
   */
  isGatePassed(): boolean {
    return this.isGateApproved();
  }

  /**
   * 设置质量门结果（score + comment）
   * 仅供 HCritic 调用。
   * @param params 质量门结果参数
   * @returns 更新后的工作流状态
   */
  setGateResult(params: { score: number | null; comment?: string | null; stage?: string | null }): WorkflowState {
    const currentStage = this.getCurrentStage();
    const gateResult: GateResult = {
      score: params.score,
      comment: params.comment ?? null,
      stage: params.stage ?? currentStage,
    };
    const state = setWorkflowGateResult(gateResult);
    this.emit('gateChanged', { score: gateResult.score, comment: gateResult.comment, stage: gateResult.stage });
    return state;
  }

  /**
   * @deprecated 使用 setGateResult 替代。保留以兼容旧代码。
   * 将 boolean 转换为 score（true=100，false=0）后调用 setGateResult。
   */
  setGatePassed(passed: boolean): WorkflowState {
    return this.setGateResult({
      score: passed ? 100 : 0,
      comment: passed ? 'Passed (legacy)' : 'Failed (legacy)',
    });
  }

  // ─── 平台无关工具方法（供 plugin 工具直接调用）─────────────────────────────────

  /**
   * 获取完整工作流状态（供 hd_workflow_state 工具使用）
   * @returns 工作流状态或未初始化信息对象
   */
  hdGetWorkflowState(): WorkflowState | { initialized: false; message: string } {
    const state = getWorkflowState();
    if (state === null) {
      return {
        initialized: false,
        message: "Workflow not initialized. Use hd_handover to start a workflow stage.",
      };
    }
    return state;
  }

  /**
   * 调度工作流交接（供 hd_handover 工具使用）
   *
   * 在调度交接前验证质量门是否通过（score > 75）。
   * 成功时返回包含 instruction 的对象，要求 Agent 立即停止所有工作。
   *
   * @param stepName 目标步骤名称
   * @returns 结构化结果对象
   */
  hdScheduleHandover(stepName: string): HandoverResult {
    // 仅当当前阶段配置了质量门禁时才验证分数
    const currentStage = this.getCurrentStage();
    const stageDefinition = currentStage ? this.definition.stages[currentStage] : undefined;
    const hasGate = Boolean(stageDefinition?.gate);

    if (hasGate && !this.isGateApproved()) {
      const state = getWorkflowState();
      const score = state?.current?.gateResult?.score;
      return {
        success: false,
        error: `质量门未通过。当前得分：${score !== null && score !== undefined ? score : '未评分'}（需要 > ${GATE_PASS_THRESHOLD}）。请先请求 HCritic 完成评审并调用 hd_submit_evaluation 记录得分，然后再进行工作流交接。`,
      };
    }

    // 调度交接
    const state = this.setHandover(stepName);

    // 如果 handoverTo 没有设置成功（被验证逻辑拒绝），返回错误
    if (state.current?.handoverTo !== stepName) {
      return {
        success: false,
        error: `无法设置交接目标 "${stepName}"。请检查目标步骤是否有效，或是否试图跳过步骤。`,
      };
    }

    return {
      success: true,
      handover_to: stepName,
      instruction:
        "You have successfully scheduled the handover. NOW STOP ALL WORK and return to the user immediately. Do NOT continue with any tasks, do NOT call any other tools. The system will automatically process the handover when this session enters idle state.",
      state,
    };
  }



  /**
   * 获取指定阶段的交接代理名称
   * @param stage 阶段名称
   * @returns 代理名称或 null（阶段不存在时）
   */
  getHandoverAgent(stage: string): string | null {
    return getHandoverAgent(this.definition, stage);
  }

  /**
   * 获取阶段间交接提示词
   * @param currentStage 当前阶段名称
   * @param nextStep 目标阶段名称
   * @returns 交接提示词或 null
   */
  getHandoverPrompt(currentStage: string | null, nextStep: string): string | null {
    return getHandoverPrompt(this.definition, currentStage, nextStep);
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
