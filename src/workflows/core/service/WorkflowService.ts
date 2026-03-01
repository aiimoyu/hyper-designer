/**
 * WorkflowService - 工作流服务类
 *
 * 提供工作流状态管理的统一接口，封装状态操作并提供事件通知。
 * 作为工作流引擎的核心服务层，负责状态持久化和业务逻辑协调。
 */

import { EventEmitter } from "events";
import type { WorkflowDefinition, PlatformAdapter } from "../types";
import type { WorkflowState } from "../state/types";
import type { QualityGateResult } from "../gate/types";
import {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowGatePassed,
  setWorkflowHandover,
  executeWorkflowHandover,
} from "../state";
import { getWorkflowDefinition } from "../registry";
import { getHandoverAgent, getHandoverPrompt } from "../runtime/handover";
import { createWorkflowQualityGate } from "../gate";

/**
 * WorkflowService 事件类型映射
 */
export interface WorkflowServiceEvents {
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
    if (state.currentStep === stepName) {
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
    if (stepName !== null && state.handoverTo === stepName) {
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
    const toStep = preState?.handoverTo ?? null;
    const state = await executeWorkflowHandover(this.definition, sessionID, adapter);
    if (toStep !== null && state.currentStep === toStep) {
      this.emit('handoverExecuted', { fromStep: fromStep ?? '', toStep });
    }
    return state;
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
    const state = setWorkflowGatePassed(passed);
    this.emit('gateChanged', { passed });
    return state;
  }

  /**
   * 执行当前阶段的质量门禁评审
   * @param capabilities 平台能力对象（必须包含 session 原语）
   * @returns 结构化门禁结果
   */
  async executeQualityGate(adapter: PlatformAdapter): Promise<QualityGateResult> {
    return createWorkflowQualityGate(this.definition, adapter, this);
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
   * @param currentStep 当前阶段名称
   * @param nextStep 目标阶段名称
   * @returns 交接提示词或 null
   */
  getHandoverPrompt(currentStep: string | null, nextStep: string): string | null {
    return getHandoverPrompt(this.definition, currentStep, nextStep);
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