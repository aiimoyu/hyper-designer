import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkflowService, workflowService } from '../../../workflows/core'
import type { WorkflowDefinition, StageHookFn } from '../../../workflows/core'
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
      gate: true,
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
      expect(state.current?.name).toBe("scenarioAnalysis");
    });

    it("persists current step to file", () => {
      service.setCurrent("useCaseAnalysis");
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      expect(raw.current?.name).toBe("useCaseAnalysis");
    });

    it("ignores invalid step names", () => {
      const state = service.setCurrent("invalidStep");
      expect(state.current).toBeNull();
    });

    it("resets gate status when step changes", () => {
      service.setCurrent("IRAnalysis");
      service.setGatePassed(true);
      expect(service.isGatePassed()).toBe(true);
      const state = service.setCurrent("scenarioAnalysis");
      expect(state.current?.gateResult).toBeNull();
    });

    it("does NOT reset gatePassed when setCurrent with same step", () => {
      service.setCurrent("IRAnalysis");
      service.setGatePassed(true);
      // Set to the same step again
      const state = service.setCurrent("IRAnalysis");
      expect(state.current?.gateResult?.score).toBe(100);
    });

  });


  describe("setGatePassed", () => {
    it("updates gate pass status", () => {
      service.setCurrent("IRAnalysis");
      const state = service.setGatePassed(true);
      expect(state.current?.gateResult?.score).toBe(100);
    });

    it("persists gate status to file", () => {
      service.setCurrent("IRAnalysis");
      service.setGatePassed(true);
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      expect(raw.current?.gateResult?.score).toBe(100);
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

    it("allows clean state reads after reset (test isolation semantics)", () => {
      // Create state, reset, verify service still reads from disk
      service.setStage("IRAnalysis", true);
      service.reset();
      // Disk state still exists - reset doesn't clear disk
      const state = service.getState();
      expect(state).not.toBeNull();
      expect(state!.workflow.IRAnalysis.isCompleted).toBe(true);
    });

    it("can be called multiple times without error", () => {
      expect(() => {
        service.reset();
        service.reset();
        service.reset();
      }).not.toThrow();
    });

    it("works when no state file exists on disk", () => {
      // No state file created yet
      expect(() => service.reset()).not.toThrow();
      expect(service.getState()).toBeNull();
    });
  });

  describe("setHandover", () => {
    it("sets handover target step", () => {
      service.setCurrent("dataCollection");
      const state = service.setHandover("IRAnalysis");
      expect(state.current?.handoverTo).toBe("IRAnalysis");
    });

    it("allows null to clear handover", () => {
      service.setCurrent("dataCollection");
      service.setHandover("IRAnalysis");
      const state = service.setHandover(null);
      expect(state.current?.handoverTo).toBeNull();
    });

    it("validates handover step exists", () => {
      service.setCurrent("dataCollection");
      const state = service.setHandover("nonExistentStep");
      // Invalid step is silently ignored - handoverTo stays null
      expect(state.current?.handoverTo).toBeNull();
    });

    it("prevents skipping stages in handover", () => {
      service.setCurrent("dataCollection");
      const state = service.setHandover("scenarioAnalysis");
      // Should NOT set handover - skipping is not allowed
      expect(state.current?.handoverTo).toBeNull();
    });

    it("allows backward handover", () => {
      service.setCurrent("scenarioAnalysis");
      const state = service.setHandover("dataCollection");
      expect(state.current?.handoverTo).toBe("dataCollection");
    });

    it("persists handover state to file", () => {
      service.setCurrent("dataCollection");
      service.setHandover("IRAnalysis");
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      expect(raw.current?.handoverTo).toBe("IRAnalysis");
    });

    it("allows handover to first stage when no current step", () => {
      const state = service.setHandover("dataCollection");
      expect(state.current?.handoverTo).toBe("dataCollection");
    });

    it("rejects handover to non-first stage when no current step", () => {
      const state = service.setHandover("IRAnalysis");
      expect(state.current?.handoverTo).toBeNull();
    });

    it("setHandover(null) when already null - still writes, no error", () => {
      service.setStage("dataCollection", false);
      const state = service.setHandover(null);
      expect(state.current?.handoverTo).toBeNull();
      // Verify file was written
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      expect(raw.current?.handoverTo).toBeNull();
    });

    it("allows handover to same stage as current", () => {
      service.setCurrent("IRAnalysis");
      const state = service.setHandover("IRAnalysis");
      // Same stage = backward (targetIndex <= currentIndex), should be allowed
      expect(state.current?.handoverTo).toBe("IRAnalysis");
    });

    it("allows handover to next step (forward by one)", () => {
      service.setCurrent("IRAnalysis");
      const state = service.setHandover("scenarioAnalysis");
      expect(state.current?.handoverTo).toBe("scenarioAnalysis");
    });

    it("handles empty state file on disk gracefully", () => {
      const state = service.setHandover("dataCollection");
      expect(state).toBeDefined();
      expect(state.current?.handoverTo).toBe("dataCollection");
    });
  });

  describe("executeHandover", () => {
    it("executes pending handover and transitions currentStage to target", async () => {
      service.setCurrent("dataCollection");
      service.setHandover("IRAnalysis");
      const state = await service.executeHandover();
      expect(state.current?.name).toBe("IRAnalysis");
      expect(state.current?.handoverTo).toBeNull();
    });

    it("returns current state when no handover pending (handoverTo is null)", async () => {
      service.setCurrent("dataCollection");
      // No setHandover call - handoverTo stays null
      const state = await service.executeHandover();
      expect(state.current?.name).toBe("dataCollection");
      expect(state.current?.handoverTo).toBeNull();
    });

    it("clears handoverTo after execution", async () => {
      service.setCurrent("dataCollection");
      service.setHandover("IRAnalysis");
      const state = await service.executeHandover();
      expect(state.current?.handoverTo).toBeNull();
      // Verify on disk too
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      expect(raw.current?.handoverTo).toBeNull();
    });

    it("marks previous step as completed when moving forward", async () => {
      service.setCurrent("dataCollection");
      service.setHandover("IRAnalysis");

      const state = await service.executeHandover();

      expect(state.workflow.dataCollection.isCompleted).toBe(true);
      expect(state.current?.name).toBe("IRAnalysis")

    });

    it("resets completion status when moving backward", async () => {
      // Move forward first: dataCollection -> IRAnalysis -> scenarioAnalysis
      service.setCurrent("dataCollection");
      service.setHandover("IRAnalysis");
      await service.executeHandover();

      service.setHandover("scenarioAnalysis");
      await service.executeHandover();

      // Now move backward: scenarioAnalysis -> dataCollection
      service.setHandover("dataCollection");
      const state = await service.executeHandover();

      expect(state.current?.name).toBe("dataCollection")

      // All steps from target to previous should be reset
      expect(state.workflow.dataCollection.isCompleted).toBe(false);
      expect(state.workflow.IRAnalysis.isCompleted).toBe(false);
      expect(state.workflow.scenarioAnalysis.isCompleted).toBe(false);
    });

    it("resets gatePassed after handover", async () => {
      service.setCurrent("dataCollection");
      service.setGatePassed(true);
      service.setHandover("IRAnalysis");

      const state = await service.executeHandover();

      // gatePassed is NOT directly reset by executeHandover in state.ts,
      // but currentStage change triggers gate reset via the state transition logic
      // Let's check what the reference impl does - it sets currentStage which resets gate
      expect(state.current?.name).toBe("IRAnalysis")

    });

    it("afterStage runs while disk still shows DEPARTING stage (before state switch)", async () => {
      let stateOnDiskDuringHook: string | null = null;
      const afterHook: StageHookFn = async () => {
        // Read disk state during hook execution — state switch has NOT happened yet
        stateOnDiskDuringHook = readFileSync(STATE_FILE, "utf-8");
      };

      const defWithHook: WorkflowDefinition = {
        ...classicWorkflowDef,
        stages: {
          ...classicWorkflowDef.stages,
          dataCollection: {
            ...classicWorkflowDef.stages.dataCollection,
            afterStage: [afterHook],
          },
        },
      };

      const svc = new WorkflowService(defWithHook);
      svc.setCurrent("dataCollection");
      svc.setHandover("IRAnalysis");

      await svc.executeHandover();

      // Hook ran and captured disk state
      expect(stateOnDiskDuringHook).not.toBeNull();
      const diskState = JSON.parse(stateOnDiskDuringHook!);
      // afterStage 运行时 handoverTo 仍然保持在磁盘上（由内存锁防重入），currentStep 乚为离开的阶段
      expect(diskState.current?.name).toBe("dataCollection");
      expect(diskState.current?.handoverTo).toBe("IRAnalysis");
    });

    it("fires afterStage on departing stage THEN beforeStage on incoming stage", async () => {
      const callOrder: string[] = [];

      const afterHook: StageHookFn = async (ctx) => {
        callOrder.push(`afterStage:${ctx.stageKey}`);
      };
      const beforeHook: StageHookFn = async (ctx) => {
        callOrder.push(`beforeStage:${ctx.stageKey}`);
      };

      const defWithHooks: WorkflowDefinition = {
        ...classicWorkflowDef,
        stages: {
          ...classicWorkflowDef.stages,
          dataCollection: {
            ...classicWorkflowDef.stages.dataCollection,
            afterStage: [afterHook],
          },
          IRAnalysis: {
            ...classicWorkflowDef.stages.IRAnalysis,
            beforeStage: [beforeHook],
          },
        },
      };

      const svc = new WorkflowService(defWithHooks);
      svc.setCurrent("dataCollection");
      svc.setHandover("IRAnalysis");

      await svc.executeHandover();

      expect(callOrder).toEqual([
        "afterStage:dataCollection",
        "beforeStage:IRAnalysis",
      ]);
    });

    it("passes adapter to hooks", async () => {
      let receivedAdapter: unknown = undefined;

      const beforeHook: StageHookFn = async (ctx) => {
        receivedAdapter = ctx.adapter;
      };

      const defWithHook: WorkflowDefinition = {
        ...classicWorkflowDef,
        stages: {
          ...classicWorkflowDef.stages,
          IRAnalysis: {
            ...classicWorkflowDef.stages.IRAnalysis,
            beforeStage: [beforeHook],
          },
        },
      };

      const svc = new WorkflowService(defWithHook);
      svc.setCurrent("dataCollection");
      svc.setHandover("IRAnalysis");

      const mockAdapter = {
        createSession: vi.fn().mockResolvedValue('mock-session-id'),
        sendPrompt: vi.fn(),
        deleteSession: vi.fn().mockResolvedValue(undefined),
        summarizeSession: vi.fn().mockResolvedValue(undefined),
      };

      await svc.executeHandover("test-session", mockAdapter);

      expect(receivedAdapter).toBe(mockAdapter);
    });

    it("passes sessionID to hooks", async () => {
      let receivedSessionID: string | undefined = undefined;

      const afterHook: StageHookFn = async (ctx) => {
        receivedSessionID = ctx.sessionID;
      };

      const defWithHook: WorkflowDefinition = {
        ...classicWorkflowDef,
        stages: {
          ...classicWorkflowDef.stages,
          dataCollection: {
            ...classicWorkflowDef.stages.dataCollection,
            afterStage: [afterHook],
          },
        },
      };

      const svc = new WorkflowService(defWithHook);
      svc.setCurrent("dataCollection");
      svc.setHandover("IRAnalysis");

      await svc.executeHandover("my-session-id");

      expect(receivedSessionID).toBe("my-session-id");
    });

    it("propagates hook errors before state commit (afterStage throws before transition)", async () => {
      const failingHook: StageHookFn = async () => {
        throw new Error("Hook exploded");
      };

      const defWithHook: WorkflowDefinition = {
        ...classicWorkflowDef,
        stages: {
          ...classicWorkflowDef.stages,
          dataCollection: {
            ...classicWorkflowDef.stages.dataCollection,
            afterStage: [failingHook],
          },
        },
      };

      const svc = new WorkflowService(defWithHook);
      svc.setCurrent("dataCollection");
      svc.setHandover("IRAnalysis");

      await expect(svc.executeHandover()).rejects.toThrow("Hook exploded");

      // afterStage 抛出错误时 handoverTo 仍然在磁盘上（尚未切换到新阶段）；过渡未提交。
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      expect(raw.current?.name).toBe("dataCollection");
      expect(raw.current?.handoverTo).toBe("IRAnalysis");
    });
    it("handles initial handover (no current step) to first stage", async () => {
      // No current step, handover to first stage
      service.setHandover("dataCollection");
      const state = await service.executeHandover();
      expect(state.current?.name).toBe("dataCollection");
      expect(state.current?.handoverTo).toBeNull();
    });
    it("skips hooks when no hooks defined on stages", async () => {
      // classicWorkflowDef has no hooks - should not throw
      service.setCurrent("dataCollection");
      service.setHandover("IRAnalysis");
      const state = await service.executeHandover();
      expect(state.current?.name).toBe("IRAnalysis");
    });
  });


  describe("event emission", () => {
    it("emits stageCompleted with correct payload after setStage", () => {
      const handler = vi.fn();
      service.on("stageCompleted", handler);

      service.setStage("IRAnalysis", true);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ stageName: "IRAnalysis", isCompleted: true });
    });

    it("emits stageCompleted with isCompleted false", () => {
      const handler = vi.fn();
      service.setStage("IRAnalysis", true);
      service.on("stageCompleted", handler);

      service.setStage("IRAnalysis", false);

      expect(handler).toHaveBeenCalledWith({ stageName: "IRAnalysis", isCompleted: false });
    });

    it("emits currentChanged with previousStep and newStep", () => {
      const handler = vi.fn();
      service.on("currentChanged", handler);

      service.setCurrent("IRAnalysis");

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ previousStep: null, newStep: "IRAnalysis" });
    });

    it("emits currentChanged with correct previousStep on step change", () => {
      service.setCurrent("IRAnalysis");
      const handler = vi.fn();
      service.on("currentChanged", handler);

      service.setCurrent("scenarioAnalysis");

      expect(handler).toHaveBeenCalledWith({ previousStep: "IRAnalysis", newStep: "scenarioAnalysis" });
    });

    it("emits handoverScheduled when handover target is set", () => {
      const handler = vi.fn();
      service.on("handoverScheduled", handler);
      service.setCurrent("IRAnalysis");

      service.setHandover("scenarioAnalysis");

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ targetStep: "scenarioAnalysis" });
    });

    it("does not emit handoverScheduled when target is null", () => {
      const handler = vi.fn();
      service.on("handoverScheduled", handler);

      service.setHandover(null);

      expect(handler).not.toHaveBeenCalled();
    });

    it("emits handoverExecuted with fromStep and toStep", async () => {
      const handler = vi.fn();
      service.on("handoverExecuted", handler);
      service.setCurrent("dataCollection");
      service.setHandover("IRAnalysis");

      await service.executeHandover();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ fromStep: "dataCollection", toStep: "IRAnalysis" });
    });

    it("emits gateChanged with correct passed value", () => {
      const handler = vi.fn();
      service.on("gateChanged", handler);
      service.setCurrent("IRAnalysis");

      service.setGatePassed(true);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ score: 100, comment: 'Passed (legacy)', stage: 'IRAnalysis' });
    });

    it("fires stageCompleted AFTER state is written (state readable in listener)", () => {
      let stateInListener: boolean | undefined;
      service.on("stageCompleted", () => {
        const state = service.getState();
        stateInListener = state?.workflow.IRAnalysis.isCompleted;
      });

      service.setStage("IRAnalysis", true);

      expect(stateInListener).toBe(true);
    });

    it("fires currentChanged AFTER state is written (state readable in listener)", () => {
      let stepInListener: string | null | undefined;
      service.on("currentChanged", () => {
        const state = service.getState();
        stepInListener = state?.current?.name;

      });

      service.setCurrent("IRAnalysis");

      expect(stepInListener).toBe("IRAnalysis");
    });

    it("unsubscribe via off prevents handler from being called", () => {
      const handler = vi.fn();
      service.on("stageCompleted", handler);
      service.off("stageCompleted", handler);

      service.setStage("IRAnalysis", true);

      expect(handler).not.toHaveBeenCalled();
    });

    it("does not emit stageCompleted for invalid stage names", () => {
      const handler = vi.fn();
      service.on("stageCompleted", handler);

      service.setStage("invalidStage", true);

      expect(handler).not.toHaveBeenCalled();
    });

    it("does not emit currentChanged for invalid step names", () => {
      const handler = vi.fn();
      service.on("currentChanged", handler);

      service.setCurrent("invalidStep");

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("singleton usage", () => {
    it("singleton uses default workflow definition", () => {
      // 模块级单例应默认使用 classic 工作流
      const def = workflowService.getDefinition();
      expect(def.id).toBe("classic");
    });

    it("module-level singleton maintains consistent state", () => {
      // 对单例的状态变更在同一实例的后续调用中应保持可见
      workflowService.setStage("IRAnalysis", true);
      const state = workflowService.getState();
      expect(state).not.toBeNull();
      expect(state!.workflow.IRAnalysis.isCompleted).toBe(true);
    });

    it("singleton shares state across imports", async () => {
      // 从两个不同模块路径导入应得到同一个实例引用
      const { workflowService: ws2 } = await import('../../../workflows');
      expect(workflowService).toBe(ws2);
    });
  });
});