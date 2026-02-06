import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export interface WorkflowStage {
  isCompleted: boolean;
}

export interface Workflow {
  dataCollection: WorkflowStage;
  IRAnalysis: WorkflowStage;
  scenarioAnalysis: WorkflowStage;
  useCaseAnalysis: WorkflowStage;
  functionalRefinement: WorkflowStage;
  requirementDecomposition: WorkflowStage;
  systemFunctionalDesign: WorkflowStage;
  moduleFunctionalDesign: WorkflowStage;
}

export interface WorkflowState {
  workflow: Workflow;
  currentStep: keyof Workflow | null;
  handoverTo: keyof Workflow | null;
}

const WORKFLOW_STATE_PATH = join(process.cwd(), ".hyper-designer", "workflow_state.json");

/**
 * Reads the workflow state from the JSON file
 */
function readWorkflowStateFile(): WorkflowState {
  try {
    const data = readFileSync(WORKFLOW_STATE_PATH, "utf-8");
    return JSON.parse(data) as WorkflowState;
  } catch (error) {
    return {
      workflow: {
        dataCollection: { isCompleted: false },
        IRAnalysis: { isCompleted: false },
        scenarioAnalysis: { isCompleted: false },
        useCaseAnalysis: { isCompleted: false },
        functionalRefinement: { isCompleted: false },
        requirementDecomposition: { isCompleted: false },
        systemFunctionalDesign: { isCompleted: false },
        moduleFunctionalDesign: { isCompleted: false },
      },
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
export function getWorkflowState(): WorkflowState {
  const state = readWorkflowStateFile();

  // If file doesn't exist (we got the default state), create it
  if (!existsSync(WORKFLOW_STATE_PATH)) {
    writeWorkflowStateFile(state);
  }

  return state;
}

/**
 * Updates the completion status of a specific workflow stage
 */
export function setWorkflowStage(stage_name: keyof Workflow, is_completed: boolean): WorkflowState {
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
export function setWorkflowCurrent(step_name: keyof Workflow | null): WorkflowState {
  const state = readWorkflowStateFile();
  if (step_name === null || state.workflow[step_name]) {
    state.currentStep = step_name;
    writeWorkflowStateFile(state);
  } else {
    throw new Error(`Invalid workflow step: ${step_name}`);
  }
  return state;
}

export function setWorkflowHandover(step_name: keyof Workflow | null): WorkflowState {
  const state = readWorkflowStateFile();
  if (step_name === null || state.workflow[step_name]) {
    state.handoverTo = step_name;
    writeWorkflowStateFile(state);
  } else {
    throw new Error(`Invalid workflow step: ${step_name}`);
  }
  return state;
}
