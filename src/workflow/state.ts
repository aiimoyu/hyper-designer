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
 * Workflow steps in order
 */
export const WORKFLOW_STEPS: (keyof Workflow)[] = [
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

  if (step_name === null) {
    state.handoverTo = null;
    writeWorkflowStateFile(state);
    return state;
  }

  if (!state.workflow[step_name]) {
    throw new Error(`Invalid workflow step: ${step_name}`);
  }

  const currentStep = state.currentStep;
  const currentIndex = currentStep ? WORKFLOW_STEPS.indexOf(currentStep) : -1;
  const targetIndex = WORKFLOW_STEPS.indexOf(step_name);

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

export function executeWorkflowHandover(): WorkflowState {
  const state = readWorkflowStateFile();

  if (state.handoverTo === null) {
    throw new Error("No handover target set. Call setWorkflowHandover first.");
  }

  const fromStep = state.currentStep;
  const toStep = state.handoverTo;
  const fromIndex = fromStep ? WORKFLOW_STEPS.indexOf(fromStep) : -1;
  const toIndex = WORKFLOW_STEPS.indexOf(toStep);

  if (fromIndex === -1) {
    throw new Error(`Cannot execute handover: current step is not set`);
  }

  if (toIndex > fromIndex) {
    state.workflow[fromStep!].isCompleted = true;
  } else if (toIndex < fromIndex) {
    for (let i = toIndex; i <= fromIndex; i++) {
      const step = WORKFLOW_STEPS[i];
      state.workflow[step].isCompleted = false;
    }
  }

  state.handoverTo = null;
  state.currentStep = toStep;

  writeWorkflowStateFile(state);
  return state;
}
