import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WorkflowService } from '../../../workflows/core/service/WorkflowService'
import { rmSync, existsSync } from "fs";
import { join } from "path";

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json");

// Helper to initialize service with workflow
// Helper to initialize service with workflow
function initWithWorkflow(service: WorkflowService, workflowId: string = "classic"): void {
  const detail = service.getWorkflowDetail(workflowId);
  if (!detail) throw new Error(`Workflow ${workflowId} not found`);
  
  // Select all stages
  const stages = detail.stageOrder.map(key => ({ key, selected: true }));
  const result = service.selectWorkflow({ typeId: workflowId, stages });
  if (!result.success) throw new Error(result.error ?? "Failed to select workflow");
}

describe("WorkflowService", () => {
  let service: WorkflowService;

  beforeEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true });
    }
    service = new WorkflowService();
  });

  afterEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true });
    }
  });

  describe("constructor", () => {
    it("starts without definition when no state file exists", () => {
      expect(service.getDefinition()).toBeNull();
    });

    it("extends EventEmitter for event handling", () => {
      expect(typeof service.on).toBe("function");
      expect(typeof service.emit).toBe("function");
    });
  });

  describe("listWorkflows", () => {
    it("returns available workflows", () => {
      const workflows = service.listWorkflows();
      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows.find(w => w.id === "classic")).toBeDefined();
    });
  });

  describe("getWorkflowDetail", () => {
    it("returns workflow detail for valid typeId", () => {
      const detail = service.getWorkflowDetail("classic");
      expect(detail).not.toBeNull();
      expect(detail?.id).toBe("classic");
      expect(detail?.stages.length).toBeGreaterThan(0);
    });

    it("returns null for invalid typeId", () => {
      const detail = service.getWorkflowDetail("invalid-workflow");
      expect(detail).toBeNull();
    });
  });

  describe("selectWorkflow", () => {
    it("initializes workflow with all stages selected", () => {
      const detail = service.getWorkflowDetail("classic")!;
      const stages = detail.stageOrder.map(key => ({ key, selected: true }));
      
      const result = service.selectWorkflow({ typeId: "classic", stages });
      
      expect(result.success).toBe(true);
      expect(result.state?.initialized).toBe(true);
      expect(result.state?.typeId).toBe("classic");
      expect(service.getDefinition()).not.toBeNull();
    });

    it("fails when missing required stages", () => {
      const detail = service.getWorkflowDetail("classic")!;
      // Only select non-required stages
      const stages = detail.stages
        .filter(s => !s.required)
        .map(s => ({ key: s.key, selected: true }));
      
      const result = service.selectWorkflow({ typeId: "classic", stages });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing required stages");
    });

    it("fails when already initialized", () => {
      initWithWorkflow(service);
      
      const detail = service.getWorkflowDetail("classic")!;
      const stages = detail.stageOrder.map(key => ({ key, selected: true }));
      const result = service.selectWorkflow({ typeId: "classic", stages });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("already initialized");
    });

    it("fails for invalid workflow ID", () => {
      const result = service.selectWorkflow({ typeId: "invalid", stages: [] });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown workflow");
    });
  });

  describe("getDefinition", () => {
    it("returns null when not initialized", () => {
      expect(service.getDefinition()).toBeNull();
    });

    it("returns definition after selectWorkflow", () => {
      initWithWorkflow(service);
      const def = service.getDefinition();
      expect(def).not.toBeNull();
      expect(def?.id).toBe("classic");
    });
  });

  describe("getState", () => {
    it("returns null when no state file exists", () => {
      const state = service.getState();
      expect(state).toBeNull();
    });

    it("returns current workflow state from file after initialization", () => {
      initWithWorkflow(service);
      service.setStage("IRAnalysis", true);
      const state = service.getState();
      expect(state).not.toBeNull();
      expect(state?.workflow.IRAnalysis?.isCompleted).toBe(true);
    });
  });

  describe("hdGetWorkflowState", () => {
    it("returns uninitialized message when not initialized", () => {
      const result = service.hdGetWorkflowState();
      expect(result).toEqual({
        initialized: false,
        message: expect.stringContaining("hd_workflow_select"),
      });
    });

    it("returns state when initialized", () => {
      initWithWorkflow(service);
      const result = service.hdGetWorkflowState();
      expect(result).toHaveProperty("initialized", true);
      expect(result).toHaveProperty("typeId", "classic");
    });
  });

  describe("hdScheduleHandover", () => {
    it("fails when not initialized", () => {
      const result = service.hdScheduleHandover("IRAnalysis");
      expect(result.success).toBe(false);
      expect(result.error).toContain("not initialized");
    });
  });

  describe("setStage", () => {
    it("updates stage completion status", () => {
      initWithWorkflow(service);
      const state = service.setStage("IRAnalysis", true);
      expect(state.workflow.IRAnalysis?.isCompleted).toBe(true);
    });
  });

  describe("setGateResult", () => {
    it("sets gate result", () => {
      initWithWorkflow(service);
      service.setCurrent("IRAnalysis");
      service.setGateResult({ score: 85, comment: "Good work" });
      const state = service.getState();
      expect(state?.current?.gateResult?.score).toBe(85);
    });
  });

  describe("isInitialized", () => {
    it("returns false when not initialized", () => {
      expect(service.isInitialized()).toBe(false);
    });

    it("returns true after selectWorkflow", () => {
      initWithWorkflow(service);
      expect(service.isInitialized()).toBe(true);
    });
  });
});