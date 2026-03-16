import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WorkflowService } from '../../../workflows/core/service/WorkflowService'
import { initializeWorkflowState, writeWorkflowStateFile } from '../../../workflows/core/state'
import { rmSync, existsSync } from "fs";
import { join } from "path";
import type { WorkflowDefinition } from '../../../workflows/core/types'

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json");

const handoverMilestoneWorkflow: WorkflowDefinition = {
  id: 'handover-milestone-test',
  name: 'Handover Milestone Test Workflow',
  description: 'Validates workflow-defined handover milestone requirements',
  entryStageId: 'stageA',
  stages: {
    stageA: {
      stageId: 'stageA',
      name: 'Stage A',
      description: 'Source stage',
      agent: 'HArchitect',
      requiredMilestones: ['gate', 'doc_review'],
      required: true,
      transitions: [{ id: 'to-stageB', toStageId: 'stageB', mode: 'auto', priority: 0 }],
      getHandoverPrompt: () => 'handover to stage A',
    },
    stageB: {
      stageId: 'stageB',
      name: 'Stage B',
      description: 'Target stage',
      agent: 'HEngineer',
      required: true,
      getHandoverPrompt: () => 'handover to stage B',
    },
  },
}

const transitionOnlyWorkflow: WorkflowDefinition = {
  id: 'transition-only-service',
  name: 'Transition Only Service Workflow',
  description: 'Uses transition graph for execution order',
  entryStageId: 'stageA',
  stages: {
    stageA: {
      stageId: 'stageA',
      name: 'Stage A',
      description: 'Source stage',
      agent: 'HArchitect',
      requiredMilestones: ['gate'],
      transitions: [{ id: 'A-B', toStageId: 'stageB', mode: 'auto', priority: 0 }],
      getHandoverPrompt: () => 'handover to stage A',
    },
    stageB: {
      stageId: 'stageB',
      name: 'Stage B',
      description: 'Target stage',
      agent: 'HEngineer',
      before: [{
        id: 'before-b',
        description: 'before hook',
        fn: async ({ setMilestone }) => {
          setMilestone?.({ key: 'hook_milestone', isCompleted: false, detail: { marker: true } })
        },
      }],
      transitions: [],
      getHandoverPrompt: () => 'handover to stage B',
    },
  },
}

function initWithWorkflow(service: WorkflowService, workflowId: string = "classic"): void {
  const detail = service.getWorkflowDetail(workflowId);
  if (!detail) throw new Error(`Workflow ${workflowId} not found`);

  // Select all stages
  const stages = detail.stages.map(stage => ({ key: stage.key, selected: true }));
  const result = service.selectWorkflow({ typeId: workflowId, stages });
  if (!result.success) throw new Error(result.error ?? "Failed to select workflow");
}

// 模拟已完成首次交接的初始化状态（initialized: true）
function initWithHandover(service: WorkflowService, workflowId: string = "classic"): void {
  initWithWorkflow(service, workflowId);
  // 手动设置 initialized: true 模拟已完成首次交接
  const state = service.getState();
  if (state) {
    state.initialized = true;
    writeWorkflowStateFile(state);
  }
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
    it("selects workflow with all stages selected but not initialized", () => {
      const detail = service.getWorkflowDetail("classic")!;
      const stages = detail.stages.map(stage => ({ key: stage.key, selected: true }));

      const result = service.selectWorkflow({ typeId: "classic", stages });

      expect(result.success).toBe(true);
      expect(result.state?.initialized).toBe(false);
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

    it("fails when workflow already selected", () => {
      initWithWorkflow(service);

      const detail = service.getWorkflowDetail("classic")!;
      const stages = detail.stages.map(stage => ({ key: stage.key, selected: true }));
      const result = service.selectWorkflow({ typeId: "classic", stages });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already selected");
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

    it("returns uninitialized message after selectWorkflow (initialized still false)", () => {
      initWithWorkflow(service);
      const result = service.hdGetWorkflowState();
      expect(result).toHaveProperty("initialized", false);
      // hdGetWorkflowState returns message object when initialized is false
      expect(result).toHaveProperty("message");
    });
  });

  describe("hdScheduleHandover", () => {
    it("fails when not initialized", () => {
      const result = service.hdScheduleHandover("IRAnalysis");
      expect(result.success).toBe(false);
      expect(result.error).toContain("not initialized");
    });

    it('increments failureCount when handover is rejected by gate', () => {
      initWithWorkflow(service);
      service.setCurrent('IRAnalysis');
      service.setGateResult({ score: 60, comment: 'need work' });

      const firstAttempt = service.hdScheduleHandover('scenarioAnalysis');
      expect(firstAttempt.success).toBe(false);
      expect(service.getState()?.current?.failureCount).toBe(1);

      const secondAttempt = service.hdScheduleHandover('scenarioAnalysis');
      expect(secondAttempt.success).toBe(false);
      expect(service.getState()?.current?.failureCount).toBe(2);
    });

    it('does not increment failureCount when handover scheduling succeeds', () => {
      initWithWorkflow(service);
      service.setCurrent('IRAnalysis');
      service.setGateResult({ score: 70, comment: 'first reject' });

      const rejected = service.hdScheduleHandover('scenarioAnalysis');
      expect(rejected.success).toBe(false);
      expect(service.getState()?.current?.failureCount).toBe(1);

      service.setGateResult({ score: 90, comment: 'approved' });
      const accepted = service.hdScheduleHandover('scenarioAnalysis');

      expect(accepted.success).toBe(true);
      expect(accepted.state?.current?.handoverTo).toBe('scenarioAnalysis');
      expect(accepted.state?.current?.failureCount).toBe(1);
      expect(service.getState()?.current?.failureCount).toBe(1);
    });

    it('rejects handover when a required handover milestone is incomplete', () => {
      initWithWorkflow(service);
      service.setCurrent('IRAnalysis');
      service.setStageMilestone({
        stage: 'IRAnalysis',
        milestone: {
          type: 'gate',
          isCompleted: false,
          detail: { score: 60, comment: 'Document needs revision' },
        },
      });

      const result = service.hdScheduleHandover('scenarioAnalysis');

      expect(result.success).toBe(false);
      expect(result.error).toContain('gate');
      expect(service.getState()?.current?.failureCount).toBe(1);
    });

    it('allows handover when required handover milestones are completed', () => {
      initWithWorkflow(service);
      service.setCurrent('IRAnalysis');
      service.setGateResult({ score: 90, comment: 'gate approved' });

      const result = service.hdScheduleHandover('scenarioAnalysis');

      expect(result.success).toBe(true);
      expect(result.state?.current?.handoverTo).toBe('scenarioAnalysis');
    });

    it('allows handover when non-required milestones are incomplete', () => {
      initWithWorkflow(service);
      service.setCurrent('IRAnalysis');
      service.setGateResult({ score: 90, comment: 'gate approved' });
      service.setStageMilestone({
        stage: 'IRAnalysis',
        milestone: {
          type: 'doc_review',
          isCompleted: false,
          detail: { reviewer: 'HCritic' },
        },
      });

      const result = service.hdScheduleHandover('scenarioAnalysis');

      expect(result.success).toBe(true);
      expect(result.state?.current?.handoverTo).toBe('scenarioAnalysis');
    });

    it('checks every milestone listed in workflow stage requiredMilestones', () => {
      writeWorkflowStateFile(initializeWorkflowState(handoverMilestoneWorkflow));
      Reflect.set(service, 'definition', handoverMilestoneWorkflow);
      service.setCurrent('stageA');
      service.setStageMilestone({
        stage: 'stageA',
        milestone: {
          type: 'gate',
          isCompleted: true,
          detail: { score: 90, comment: 'approved' },
        },
      });
      service.setStageMilestone({
        stage: 'stageA',
        milestone: {
          type: 'doc_review',
          isCompleted: false,
          detail: { reviewer: 'HCritic' },
        },
      });
      service.setStageMilestone({
        stage: 'stageA',
        milestone: {
          type: 'traceability',
          isCompleted: false,
          detail: { status: 'pending' },
        },
      });

      const rejected = service.hdScheduleHandover('stageB');

      expect(rejected.success).toBe(false);
      expect(rejected.error).toContain('doc_review');
      expect(rejected.error).not.toContain('traceability');

      service.setStageMilestone({
        stage: 'stageA',
        milestone: {
          type: 'doc_review',
          isCompleted: true,
          detail: { reviewer: 'HCritic' },
        },
      });

      const accepted = service.hdScheduleHandover('stageB');

      expect(accepted.success).toBe(true);
      expect(accepted.state?.current?.handoverTo).toBe('stageB');
    });

    it('auto-selects first stage when stepName is omitted and currentStage is null', () => {
      initWithWorkflow(service);
      // 初始状态：currentStage 为 null

      const result = service.hdScheduleHandover(); // 不传参数

      expect(result.success).toBe(true);
      expect(result.handover_to).toBe('IRAnalysis'); // classic workflow 的第一个阶段
    });

    it('auto-selects next stage when stepName is omitted and currentStage is set', () => {
      initWithWorkflow(service);
      service.setCurrent('IRAnalysis');
      service.setGateResult({ score: 90, comment: 'approved' });

      const result = service.hdScheduleHandover(); // 不传参数

      expect(result.success).toBe(true);
      expect(result.handover_to).toBe('scenarioAnalysis'); // IRAnalysis 的下一个阶段
    });

    it('fails when stepName is omitted and currentStage is the last stage', () => {
      initWithWorkflow(service);
      // 设置到最后一个阶段
      const lastStage = 'sddPlanGeneration';
      service.setCurrent(lastStage);
      service.setGateResult({ score: 90, comment: 'approved' });

      const result = service.hdScheduleHandover(); // 不传参数

      expect(result.success).toBe(false);
      expect(result.error).toContain('最后一个阶段');
    });

    it('checks requiredMilestones and ignores hook-local milestones for handover blocking', () => {
      writeWorkflowStateFile(initializeWorkflowState(transitionOnlyWorkflow));
      Reflect.set(service, 'definition', transitionOnlyWorkflow);
      service.setCurrent('stageA');

      const rejected = service.hdScheduleHandover('stageB');
      expect(rejected.success).toBe(false);
      expect(rejected.error).toContain('gate');

      service.setStageMilestone({
        stage: 'stageA',
        milestone: {
          type: 'gate',
          isCompleted: true,
          detail: { score: 90 },
        },
      });

      const accepted = service.hdScheduleHandover('stageB');
      expect(accepted.success).toBe(true);
      expect(accepted.state?.current?.handoverTo).toBe('stageB');
    });
  });

  describe('hdForceNextStep', () => {
    it('denies force-next-step when failureCount is below threshold', () => {
      initWithHandover(service);
      service.setCurrent('IRAnalysis');
      service.setHandover('invalid-stage');
      service.setHandover('invalid-stage');

      const result = service.hdForceNextStep();

      expect(result.success).toBe(false);
      expect(result.reason).toContain('failureCount');
    });

    it('denies force-next-step when handover target is not the next selected stage', () => {
      initWithHandover(service);
      service.setCurrent('IRAnalysis');
      service.setHandover('invalid-stage');
      service.setHandover('invalid-stage');
      service.setHandover('invalid-stage');
      service.setHandover('IRAnalysis');

      const result = service.hdForceNextStep();

      expect(result.success).toBe(false);
      expect(result.reason).toContain('next selected stage');
    });

    it('forces transition when threshold met and target is the next selected stage', () => {
      initWithHandover(service);
      service.setCurrent('IRAnalysis');
      service.setHandover('invalid-stage');
      service.setHandover('invalid-stage');
      service.setHandover('invalid-stage');

      const result = service.hdForceNextStep();

      expect(result.success).toBe(true);
      expect(result.state?.current?.name).toBe('scenarioAnalysis');
      expect(result.state?.current?.failureCount).toBe(0);
      const events = result.state?.history?.events ?? [];
      const forceAdvanceEvent = events.find(
        event => event.type === 'milestone.set' && event.nodeId === 'workflow.IRAnalysis.main' && event.key === 'force_advance',
      );
      expect(forceAdvanceEvent).toBeDefined();
    });

    it('records auditable force_advance milestone and does not mark gate as passed', () => {
      initWithHandover(service);
      service.setCurrent('IRAnalysis');
      service.setHandover('invalid-stage');
      service.setHandover('invalid-stage');
      service.setHandover('invalid-stage');

      const result = service.hdForceNextStep();

      const events = result.state?.history?.events ?? [];
      const forceAdvanceEvent = events.find(
        event => event.type === 'milestone.set' && event.nodeId === 'workflow.IRAnalysis.main' && event.key === 'force_advance',
      );
      const gateEvent = events.find(
        event => event.type === 'milestone.set' && event.nodeId === 'workflow.IRAnalysis.main' && event.key === 'gate',
      );
      expect(result.success).toBe(true);
      expect(forceAdvanceEvent).toBeDefined();
      expect((forceAdvanceEvent?.value as { isCompleted?: boolean } | undefined)?.isCompleted).toBe(true);
      expect((forceAdvanceEvent?.value as { detail?: unknown } | undefined)?.detail).toMatchObject({
        reason: 'Forced transition after 3+ failed handover attempts',
      });
      expect(gateEvent).toBeUndefined();
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
    it("records gate milestone on the current stage", () => {
      initWithWorkflow(service);
      service.setCurrent("IRAnalysis");
      service.setGateResult({ score: 85, comment: "Good work" });
      const state = service.getState();
      const gateEvent = (state?.history?.events ?? []).find(
        event => event.type === 'milestone.set' && event.nodeId === 'workflow.IRAnalysis.main' && event.key === 'gate',
      )
      expect(gateEvent).toBeDefined();
      expect((gateEvent?.value as { isCompleted?: boolean } | undefined)?.isCompleted).toBe(true);
      expect((gateEvent?.value as { detail?: unknown } | undefined)?.detail).toMatchObject({ score: 85, comment: 'Good work' });
    });
  });

  describe("isInitialized", () => {
    it("returns false when not initialized", () => {
      expect(service.isInitialized()).toBe(false);
    });

    it("returns false after selectWorkflow (before first handover)", () => {
      initWithWorkflow(service);
      expect(service.isInitialized()).toBe(false);
    });

    it("returns true after first handover", () => {
      initWithHandover(service);
      expect(service.isInitialized()).toBe(true);
    });
  });
});
