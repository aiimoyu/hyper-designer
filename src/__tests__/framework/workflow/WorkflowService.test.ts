import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WorkflowService } from "../../../workflows/core/WorkflowService";
import type { WorkflowDefinition } from "../../../workflows/core/types";
import { rmSync, existsSync } from "fs";
import { join } from "path";

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json");

const classicWorkflowDef: WorkflowDefinition = {
  id: "classic",
  name: "Classic Workflow",
  description: "Test workflow",
  stageOrder: [
    "dataCollection",
    "IRAnalysis",
    "scenarioAnalysis",
    "useCaseAnalysis",
    "functionalRefinement",
    "requirementDecomposition",
    "systemFunctionalDesign",
    "moduleFunctionalDesign"
  ],
  stages: {
    dataCollection: {
      name: "Data Collection",
      description: "Collect initial data",
      agent: "HArchitect",
      promptFile: "data_collection.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "start"} to dataCollection`
    },
    IRAnalysis: {
      name: "IR Analysis",
      description: "Initial requirements analysis",
      agent: "HArchitect",
      promptFile: "ir_analysis.md",
      qualityGate: "请评审 IRAnalysis 阶段产出物，检查是否符合规范。",
      getHandoverPrompt: (from) => `Handover from ${from ?? "dataCollection"} to IRAnalysis`
    },
    scenarioAnalysis: {
      name: "Scenario Analysis",
      description: "Analyze scenarios",
      agent: "HArchitect",
      promptFile: "scenario_analysis.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "IRAnalysis"} to scenarioAnalysis`
    },
    useCaseAnalysis: {
      name: "Use Case Analysis",
      description: "Analyze use cases",
      agent: "HArchitect",
      promptFile: "use_case_analysis.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "scenarioAnalysis"} to useCaseAnalysis`
    },
    functionalRefinement: {
      name: "Functional Refinement",
      description: "Refine functionality",
      agent: "HEngineer",
      promptFile: "functional_refinement.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "useCaseAnalysis"} to functionalRefinement`
    },
    requirementDecomposition: {
      name: "Requirement Decomposition",
      description: "Decompose requirements",
      agent: "HEngineer",
      promptFile: "requirement_decomposition.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "functionalRefinement"} to requirementDecomposition`
    },
    systemFunctionalDesign: {
      name: "System Functional Design",
      description: "Design system functionality",
      agent: "HArchitect",
      promptFile: "system_functional_design.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "requirementDecomposition"} to systemFunctionalDesign`
    },
    moduleFunctionalDesign: {
      name: "Module Functional Design",
      description: "Design module functionality",
      agent: "HEngineer",
      promptFile: "module_functional_design.md",
      getHandoverPrompt: (from) => `Handover from ${from ?? "systemFunctionalDesign"} to moduleFunctionalDesign`
    }
  }
};

describe("WorkflowService", () => {
  let service: WorkflowService;

  beforeEach(() => {
    service = new WorkflowService(classicWorkflowDef);
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true });
    }
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true });
    }
  });

  describe("constructor", () => {
    it.todo("initializes with provided workflow definition");
    it.todo("defaults to classic workflow when no definition provided");
    it.todo("extends EventEmitter for event handling");
  });

  describe("getCurrentStage", () => {
    it.todo("returns current step from workflow state");
    it.todo("returns null when no current step is set");
    it.todo("reflects changes after setCurrent calls");
  });

  describe("getDefinition", () => {
    it.todo("returns the workflow definition used in constructor");
    it.todo("returns classic workflow definition when none provided");
    it.todo("maintains definition reference across service lifetime");
  });

  describe("getState", () => {
    it.todo("returns current workflow state from file");
    it.todo("returns null when no state file exists");
    it.todo("reflects state changes after operations");
    it.todo("handles legacy state files without typeId");
  });

  describe("setStage", () => {
    it.todo("updates specific stage completion status");
    it.todo("persists state changes to file");
    it.todo("emits stageCompleted event");
    it.todo("ignores invalid stage names");
    it.todo("handles stage completion transitions");
  });

  describe("setCurrent", () => {
    it.todo("sets current active step");
    it.todo("allows null to clear current step");
    it.todo("persists current step to file");
    it.todo("emits currentChanged event");
    it.todo("ignores invalid step names");
    it.todo("resets gate status when step changes");
  });

  describe("setHandover", () => {
    it.todo("sets handover target step");
    it.todo("allows null to clear handover");
    it.todo("validates handover step exists");
    it.todo("prevents skipping stages in handover");
    it.todo("allows backward handover");
    it.todo("emits handoverScheduled event");
    it.todo("persists handover state to file");
  });

  describe("executeHandover", () => {
    it.todo("executes pending handover when set");
    it.todo("returns current state when no handover pending");
    it.todo("updates current step to handover target");
    it.todo("clears handover target after execution");
    it.todo("marks previous step as completed when moving forward");
    it.todo("resets completion status when moving backward");
    it.todo("executes stage hooks (beforeStage/afterStage)");
    it.todo("emits handoverExecuted event");
    it.todo("handles sessionID and capabilities parameters");
  });

  describe("isGatePassed", () => {
    it.todo("returns current gate pass status");
    it.todo("returns false when no state exists");
    it.todo("reflects changes after setGatePassed calls");
    it.todo("handles state file loading correctly");
  });

  describe("setGatePassed", () => {
    it.todo("updates gate pass status");
    it.todo("persists gate status to file");
    it.todo("emits gateChanged event");
    it.todo("handles boolean parameter correctly");
  });

  describe("reset", () => {
    it.todo("clears all workflow state");
    it.todo("removes state file");
    it.todo("resets to initial state");
    it.todo("emits appropriate events for state changes");
    it.todo("maintains workflow definition");
  });

  describe("event emission", () => {
    it.todo("emits stageCompleted when stage status changes");
    it.todo("emits currentChanged when current step changes");
    it.todo("emits handoverScheduled when handover is set");
    it.todo("emits handoverExecuted when handover completes");
    it.todo("emits gateChanged when gate status changes");
    it.todo("provides correct event payload data");
  });

  describe("singleton usage", () => {
    it.todo("module-level singleton maintains consistent state");
    it.todo("singleton shares state across imports");
    it.todo("singleton uses default workflow definition");
  });
});