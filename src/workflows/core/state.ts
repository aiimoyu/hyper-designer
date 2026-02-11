import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import type { WorkflowDefinition } from "./types";
import { getWorkflowDefinition } from "./registry";

export interface WorkflowStage {
  isCompleted: boolean;
}

export interface WorkflowState {
  typeId: string;
  workflow: Record<string, WorkflowStage>;
  currentStep: string | null;
  handoverTo: string | null;
}

const WORKFLOW_STATE_PATH = join(process.cwd(), ".hyper-designer", "workflow_state.json");

/**
 * Returns the stage order from a workflow definition
 */
export function getStageOrder(definition: WorkflowDefinition): string[] {
  return definition.stageOrder;
}

/**
 * Initializes a WorkflowState from a WorkflowDefinition
 */
export function initializeWorkflowState(definition: WorkflowDefinition): WorkflowState {
  const workflow: Record<string, WorkflowStage> = {};
  for (const stage of definition.stageOrder) {
    workflow[stage] = { isCompleted: false };
  }
  return {
    typeId: definition.id,
    workflow,
    currentStep: null,
    handoverTo: null,
  };
}

/**
 * Reads the workflow state from the JSON file
 * Returns null if file doesn't exist
 */
function readWorkflowStateFile(): WorkflowState | null {
  try {
    const data = readFileSync(WORKFLOW_STATE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return {
      typeId: parsed.typeId ?? "classic",
      workflow: parsed.workflow,
      currentStep: parsed.currentStep,
      handoverTo: parsed.handoverTo,
    };
  } catch {
    return null;
  }
}

/**
 * Writes the workflow state to the JSON file
 */
function writeWorkflowStateFile(state: WorkflowState): void {
  try {
    const dir = dirname(WORKFLOW_STATE_PATH);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(WORKFLOW_STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    throw error;
  }
}

export function getWorkflowState(): WorkflowState | null {
  return readWorkflowStateFile();
}

function ensureWorkflowStateExists(definition?: WorkflowDefinition): WorkflowState {
  const state = readWorkflowStateFile();
  if (state !== null) {
    return state;
  }
  const workflowDef = definition ?? getWorkflowDefinition("classic");
  if (workflowDef) {
    const newState = initializeWorkflowState(workflowDef);
    writeWorkflowStateFile(newState);
    return newState;
  }
  console.error("[ERROR] Failed to get workflow definition for 'classic'");
  const fallbackState: WorkflowState = {
    typeId: "classic",
    workflow: {},
    currentStep: null,
    handoverTo: null,
  };
  writeWorkflowStateFile(fallbackState);
  return fallbackState;
}

export function setWorkflowStage(stage_name: string, is_completed: boolean, definition?: WorkflowDefinition): WorkflowState {
  const state = ensureWorkflowStateExists(definition);
  if (state.workflow[stage_name]) {
    state.workflow[stage_name].isCompleted = is_completed;
    writeWorkflowStateFile(state);
  } else {
    console.error(`[ERROR] Invalid workflow stage: ${stage_name}`);
    console.error(`[ERROR] Available stages: ${Object.keys(state.workflow).join(', ')}`);
  }
  return state;
}

export function setWorkflowCurrent(step_name: string | null, definition?: WorkflowDefinition): WorkflowState {
  const state = ensureWorkflowStateExists(definition);
  if (step_name === null || state.workflow[step_name]) {
    state.currentStep = step_name;
    writeWorkflowStateFile(state);
  } else {
    console.error(`[ERROR] Invalid workflow step: ${step_name}`);
    console.error(`[ERROR] Available steps: ${Object.keys(state.workflow).join(', ')}`);
  }
  return state;
}

export function setWorkflowHandover(step_name: string | null, definition: WorkflowDefinition): WorkflowState {
  const state = ensureWorkflowStateExists(definition);

  if (step_name === null) {
    state.handoverTo = null;
    writeWorkflowStateFile(state);
    return state;
  }

  if (!state.workflow[step_name]) {
    console.error(`[ERROR] Invalid workflow step: ${step_name}`);
    console.error(`[ERROR] Available steps: ${Object.keys(state.workflow).join(', ')}`);
    return state;
  }

  const stageOrder = definition.stageOrder;
  const currentStep = state.currentStep;
  const currentIndex = currentStep ? stageOrder.indexOf(currentStep) : -1;
  const targetIndex = stageOrder.indexOf(step_name);

  // If no current step is set, only allow setting handover to the first step
  if (currentIndex === -1) {
    if (targetIndex !== 0) {
      console.error(
        `[ERROR] Cannot set handover: no current step is set. ` +
        `You can only set handover to the first step (${stageOrder[0]}). ` +
        `Target step: ${step_name} (index ${targetIndex}).`
      );
      return state;
    }
  } else {
    // Normal logic: only allow next step or backward steps
    const isNextStep = targetIndex === currentIndex + 1;
    const isBackwardStep = targetIndex <= currentIndex;

    if (!isNextStep && !isBackwardStep) {
      console.error(
        `[ERROR] Cannot skip steps when setting handover. ` +
        `Current step: ${currentStep} (index ${currentIndex}), ` +
        `Target step: ${step_name} (index ${targetIndex}). ` +
        `You can only go to the next step or return to a previous step.`
      );
      return state;
    }
  }

  state.handoverTo = step_name;
  writeWorkflowStateFile(state);
  return state;
}

export function executeWorkflowHandover(definition: WorkflowDefinition): WorkflowState {
  let state = readWorkflowStateFile();

  // Auto-initialize state if it doesn't exist
  if (state === null) {
    state = initializeWorkflowState(definition);
  }

  if (state.handoverTo === null) {
    console.error("[ERROR] No handover target set. Call setWorkflowHandover first.");
    return state;
  }

  const stageOrder = definition.stageOrder;
  const fromStep = state.currentStep;
  const toStep = state.handoverTo;
  const fromIndex = fromStep ? stageOrder.indexOf(fromStep) : -1;
  const toIndex = stageOrder.indexOf(toStep);

  // If no current step is set, this is the initial handover to first step
  if (fromIndex === -1) {
    if (toIndex !== 0) {
      console.error(
        `[ERROR] Cannot execute handover: no current step is set. ` +
        `Initial handover can only go to the first step (${stageOrder[0]}).`
      );
      return state;
    }
  } else if (toIndex > fromIndex) {
    state.workflow[fromStep!].isCompleted = true;
  } else if (toIndex < fromIndex) {
    for (let i = toIndex; i <= fromIndex; i++) {
      const step = stageOrder[i];
      state.workflow[step].isCompleted = false;
    }
  }

  state.handoverTo = null;
  state.currentStep = toStep;

  writeWorkflowStateFile(state);
  return state;
}
