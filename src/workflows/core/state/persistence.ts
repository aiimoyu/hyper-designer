/**
 * 工作流状态持久化模块
 *
 * 负责工作流状态的文件读写操作，包括：
 * 1. 从 workflow_state.json 读取状态
 * 2. 将状态写入 workflow_state.json
 * 3. 确保状态文件目录存在
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import type { WorkflowState } from "./types";
import { HyperDesignerLogger } from "../../../utils/logger";

/** Path to the workflow state file */
const WORKFLOW_STATE_PATH = join(process.cwd(), ".hyper-designer", "workflow_state.json");

/**
 * 获取工作流状态文件路径（供测试使用）
 * @returns 状态文件的绝对路径
 */
export function getWorkflowStatePath(): string {
  return WORKFLOW_STATE_PATH;
}

/**
 * Reads the workflow state from the JSON file
 * @returns Workflow state if file exists and is valid, null otherwise
 */
export function readWorkflowStateFile(): WorkflowState | null {
  try {
    if (!existsSync(WORKFLOW_STATE_PATH)) {
      HyperDesignerLogger.debug("Workflow", `工作流状态文件不存在`, { path: WORKFLOW_STATE_PATH });
      return null;
    }
    
    HyperDesignerLogger.debug("Workflow", `读取工作流状态文件`, { path: WORKFLOW_STATE_PATH });
    const data = readFileSync(WORKFLOW_STATE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    
    const state: WorkflowState = {
      typeId: parsed.typeId ?? "classic",
      workflow: parsed.workflow,
      currentStep: parsed.currentStep,
      handoverTo: parsed.handoverTo,
      gatePassed: parsed.gatePassed ?? false,
    };
    
    HyperDesignerLogger.debug("Workflow", `工作流状态读取完成`, { 
      currentStep: state.currentStep,
      workflowId: state.typeId
    });
    return state;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    HyperDesignerLogger.warn("Workflow", `读取工作流状态文件失败`, {
      path: WORKFLOW_STATE_PATH,
      action: "readStateFile",
      error: err.message
    });
    return null;
  }
}

/**
 * Writes the workflow state to the JSON file
 * @param state Workflow state to write
 */
export function writeWorkflowStateFile(state: WorkflowState): void {
  try {
    HyperDesignerLogger.debug("Workflow", `写入工作流状态文件`, { path: WORKFLOW_STATE_PATH });
    
    const dir = dirname(WORKFLOW_STATE_PATH);
    if (!existsSync(dir)) {
      HyperDesignerLogger.debug("Workflow", `创建目录`, { directory: dir });
      mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(WORKFLOW_STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
    HyperDesignerLogger.debug("Workflow", `工作流状态写入完成`, { 
      currentStep: state.currentStep,
      workflowId: state.typeId
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    HyperDesignerLogger.error("Workflow", `写入工作流状态文件失败`, err, { 
      path: WORKFLOW_STATE_PATH,
      action: "writeStateFile"
    });
    throw error;
  }
}