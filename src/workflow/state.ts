import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import type { WorkflowDefinition } from "../workflows/types";

export interface WorkflowStage {
  isCompleted: boolean;
}

export interface WorkflowState {
  workflow: Record<string, WorkflowStage>;
  currentStep: string | null;
  handoverTo: string | null;
}

const WORKFLOW_STATE_PATH = join(process.cwd(), ".hyper-designer", "workflow_state.json");

/**
 * Legacy hardcoded workflow stages for backward compatibility
 * @deprecated Use WorkflowDefinition.stageOrder instead
 */
const LEGACY_WORKFLOW_STAGES = [
  "dataCollection",
  "IRAnalysis",
  "scenarioAnalysis",
  "useCaseAnalysis",
  "functionalRefinement",
  "requirementDecomposition",
  "systemFunctionalDesign",
  "moduleFunctionalDesign",
];

/**
 * Returns the stage order from a workflow definition
 * @param definition - The workflow definition
 * @returns Array of stage names in order
 */
export function getStageOrder(definition: WorkflowDefinition): string[] {
  return definition.stageOrder;
}

/**
 * Initializes a WorkflowState from a WorkflowDefinition
 * @param definition - The workflow definition to initialize from
 * @returns A new WorkflowState with all stages set to not completed
 */
export function initializeWorkflowState(definition: WorkflowDefinition): WorkflowState {
  const workflow: Record<string, WorkflowStage> = {};
  for (const stage of definition.stageOrder) {
    workflow[stage] = { isCompleted: false };
  }
  return {
    workflow,
    currentStep: null,
    handoverTo: null,
  };
}

/**
 * Reads the workflow state from the JSON file
 */
function readWorkflowStateFile(): WorkflowState {
  try {
    const data = readFileSync(WORKFLOW_STATE_PATH, "utf-8");
    return JSON.parse(data) as WorkflowState;
  } catch (error) {
    const workflow: Record<string, WorkflowStage> = {};
    for (const stage of LEGACY_WORKFLOW_STAGES) {
      workflow[stage] = { isCompleted: false };
    }
    return {
      workflow,
      currentStep: null,
      handoverTo: null,
    };
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

/**
 * Gets the current workflow state
 */
export function getWorkflowState(definition?: WorkflowDefinition): WorkflowState {
  const state = readWorkflowStateFile();

  if (!existsSync(WORKFLOW_STATE_PATH)) {
    if (definition) {
      const newState = initializeWorkflowState(definition);
      writeWorkflowStateFile(newState);
      return newState;
    }
    writeWorkflowStateFile(state);
  }

  return state;
}

/**
 * Updates the completion status of a specific workflow stage
 */
export function setWorkflowStage(stage_name: string, is_completed: boolean): WorkflowState {
  const state = readWorkflowStateFile();
  if (state.workflow[stage_name]) {
    state.workflow[stage_name].isCompleted = is_completed;
    writeWorkflowStateFile(state);
  } else {
    throw new Error(`Invalid workflow stage: ${stage_name}`);
  }
  return state;
}

/**
 * Sets the current workflow step
 */
export function setWorkflowCurrent(step_name: string | null): WorkflowState {
  const state = readWorkflowStateFile();
  if (step_name === null || state.workflow[step_name]) {
    state.currentStep = step_name;
    writeWorkflowStateFile(state);
  } else {
    throw new Error(`Invalid workflow step: ${step_name}`);
  }
  return state;
}

export function setWorkflowHandover(step_name: string | null, definition: WorkflowDefinition): WorkflowState {
  const state = readWorkflowStateFile();

  if (step_name === null) {
    state.handoverTo = null;
    writeWorkflowStateFile(state);
    return state;
  }

  if (!state.workflow[step_name]) {
    throw new Error(`Invalid workflow step: ${step_name}`);
  }

  const stageOrder = definition.stageOrder;
  const currentStep = state.currentStep;
  const currentIndex = currentStep ? stageOrder.indexOf(currentStep) : -1;
  const targetIndex = stageOrder.indexOf(step_name);

  if (currentIndex === -1) {
    throw new Error(`Cannot set handover: current step is not set`);
  }

  const isNextStep = targetIndex === currentIndex + 1;
  const isBackwardStep = targetIndex <= currentIndex;

  if (!isNextStep && !isBackwardStep) {
    throw new Error(
      `Cannot skip steps when setting handover. ` +
      `Current step: ${currentStep} (index ${currentIndex}), ` +
      `Target step: ${step_name} (index ${targetIndex}). ` +
      `You can only go to the next step or return to a previous step.`
    );
  }

  state.handoverTo = step_name;
  writeWorkflowStateFile(state);
  return state;
}

export function executeWorkflowHandover(definition: WorkflowDefinition): WorkflowState {
  const state = readWorkflowStateFile();

  if (state.handoverTo === null) {
    throw new Error("No handover target set. Call setWorkflowHandover first.");
  }

  const stageOrder = definition.stageOrder;
  const fromStep = state.currentStep;
  const toStep = state.handoverTo;
  const fromIndex = fromStep ? stageOrder.indexOf(fromStep) : -1;
  const toIndex = stageOrder.indexOf(toStep);

  if (fromIndex === -1) {
    throw new Error(`Cannot execute handover: current step is not set`);
  }

  if (toIndex > fromIndex) {
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
