import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WorkflowService } from "../../../workflows/core/WorkflowService";
import type { WorkflowDefinition } from "../../../workflows/core/types";
import { rmSync, existsSync, readFileSync } from "fs";
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
    it("initializes with provided workflow definition", () => {
      const svc = new WorkflowService(classicWorkflowDef);
      expect(svc.getDefinition()).toBe(classicWorkflowDef);
    });

    it("defaults to classic workflow when no definition provided", () => {
      const svc = new WorkflowService();
      const def = svc.getDefinition();
      expect(def.id).toBe("classic");
    });

    it("extends EventEmitter for event handling", () => {
      expect(typeof service.on).toBe("function");
      expect(typeof service.emit).toBe("function");
    });
  });

  describe("getDefinition", () => {
    it("returns the workflow definition used in constructor", () => {
      expect(service.getDefinition()).toBe(classicWorkflowDef);
    });

    it("returns classic workflow definition when none provided", () => {
      const svc = new WorkflowService();
      expect(svc.getDefinition().id).toBe("classic");
    });

    it("maintains definition reference across service lifetime", () => {
      const def1 = service.getDefinition();
      const def2 = service.getDefinition();
      expect(def1).toBe(def2);
    });
  });

  describe("getState", () => {
    it("returns null when no state file exists", () => {
      const state = service.getState();
      expect(state).toBeNull();
    });

    it("returns current workflow state from file", () => {
      // Create state by calling setStage
      service.setStage("IRAnalysis", true);
      const state = service.getState();
      expect(state).not.toBeNull();
      expect(state!.workflow.IRAnalysis.isCompleted).toBe(true);
    });

    it("reflects state changes after operations", () => {
      service.setStage("dataCollection", true);
      const state1 = service.getState();
      expect(state1!.workflow.dataCollection.isCompleted).toBe(true);

      service.setStage("dataCollection", false);
      const state2 = service.getState();
      expect(state2!.workflow.dataCollection.isCompleted).toBe(false);
    });
  });

  describe("getCurrentStage", () => {
    it("returns null when no current step is set", () => {
      expect(service.getCurrentStage()).toBeNull();
    });

    it("returns current step from workflow state", () => {
      service.setCurrent("scenarioAnalysis");
      expect(service.getCurrentStage()).toBe("scenarioAnalysis");
    });

    it("reflects changes after setCurrent calls", () => {
      service.setCurrent("IRAnalysis");
      expect(service.getCurrentStage()).toBe("IRAnalysis");

      service.setCurrent("scenarioAnalysis");
      expect(service.getCurrentStage()).toBe("scenarioAnalysis");
    });
  });

  describe("setStage", () => {
    it("updates specific stage completion status", () => {
      const state = service.setStage("IRAnalysis", true);
      expect(state.workflow.IRAnalysis.isCompleted).toBe(true);
    });

    it("persists state changes to file", () => {
      service.setStage("scenarioAnalysis", true);
      // Re-read from disk
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      expect(raw.workflow.scenarioAnalysis.isCompleted).toBe(true);
    });

    it("ignores invalid stage names", () => {
      const state = service.setStage("invalidStage", true);
      expect(state.workflow.invalidStage).toBeUndefined();
    });

    it("creates state with classic workflow when no state file exists", () => {
      const state = service.setStage("IRAnalysis", true);
      expect(state.typeId).toBe("classic");
      expect(Object.keys(state.workflow)).toHaveLength(8);
    });
  });

  describe("setCurrent", () => {
    it("sets current active step", () => {
      const state = service.setCurrent("scenarioAnalysis");
      expect(state.currentStep).toBe("scenarioAnalysis");
    });

    it("persists current step to file", () => {
      service.setCurrent("useCaseAnalysis");
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      expect(raw.currentStep).toBe("useCaseAnalysis");
    });

    it("ignores invalid step names", () => {
      const state = service.setCurrent("invalidStep");
      expect(state.currentStep).toBeNull();
    });

    it("resets gate status when step changes", () => {
      service.setCurrent("IRAnalysis");
      service.setGatePassed(true);
      expect(service.isGatePassed()).toBe(true);

      const state = service.setCurrent("scenarioAnalysis");
      expect(state.gatePassed).toBe(false);
    });

    it("does NOT reset gatePassed when setCurrent with same step", () => {
      service.setCurrent("IRAnalysis");
      service.setGatePassed(true);

      // Set to the same step again
      const state = service.setCurrent("IRAnalysis");
      expect(state.gatePassed).toBe(true);
    });
  });

  describe("setGatePassed", () => {
    it("updates gate pass status", () => {
      service.setCurrent("IRAnalysis");
      const state = service.setGatePassed(true);
      expect(state.gatePassed).toBe(true);
    });

    it("persists gate status to file", () => {
      service.setCurrent("IRAnalysis");
      service.setGatePassed(true);
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      expect(raw.gatePassed).toBe(true);
    });

    it("handles boolean parameter correctly", () => {
      service.setCurrent("IRAnalysis");
      service.setGatePassed(true);
      expect(service.isGatePassed()).toBe(true);

      service.setGatePassed(false);
      expect(service.isGatePassed()).toBe(false);
    });
  });

  describe("isGatePassed", () => {
    it("returns false when no state exists", () => {
      expect(service.isGatePassed()).toBe(false);
    });

    it("returns current gate pass status", () => {
      service.setCurrent("IRAnalysis");
      service.setGatePassed(true);
      expect(service.isGatePassed()).toBe(true);
    });

    it("reflects changes after setGatePassed calls", () => {
      service.setCurrent("IRAnalysis");
      expect(service.isGatePassed()).toBe(false);

      service.setGatePassed(true);
      expect(service.isGatePassed()).toBe(true);

      service.setGatePassed(false);
      expect(service.isGatePassed()).toBe(false);
    });
  });

  describe("reset", () => {
    it("provides reset method for future use", () => {
      // reset() is a no-op for now since disk is source of truth
      // but method signature must exist
      service.setCurrent("IRAnalysis");
      expect(() => service.reset()).not.toThrow();
    });

    it("maintains workflow definition after reset", () => {
      service.reset();
      expect(service.getDefinition()).toBe(classicWorkflowDef);
    });
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
