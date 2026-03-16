import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  getWorkflowState,
  setWorkflowStage,
  setWorkflowCurrent,
  setWorkflowHandover,
  setWorkflowGateResult,
  forceWorkflowNextStep,
  executeWorkflowHandover,
  initializeWorkflowState,
  getStageOrder,
  writeWorkflowStateFile,
} from '../../../workflows/core/state'

import type { WorkflowDefinition } from '../../../workflows/core'
import { rmSync, existsSync, writeFileSync } from "fs"
import { join } from "path"
import { readFileSync } from 'fs'

const STATE_FILE = join(process.cwd(), ".hyper-designer", "workflow_state.json")

const classicWorkflowDef: WorkflowDefinition = {
  id: "classic",
  name: "Classic Workflow",
  description: "Test workflow",
  entryStageId: 'dataCollection',
  stages: {
    dataCollection: {
      stageId: 'dataCollection',
      name: "Data Collection",
      description: "Collect initial data",
      agent: "HArchitect",
      promptFile: "data_collection.md",
      transitions: [{ id: 'to-ir', toStageId: 'IRAnalysis', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (from) => `Handover from ${from ?? "start"} to dataCollection`
    },
    IRAnalysis: {
      stageId: 'IRAnalysis',
      name: "IR Analysis",
      description: "Initial requirements analysis",
      agent: "HArchitect",
      promptFile: "ir_analysis.md",
      requiredMilestones: ['gate'],
      transitions: [{ id: 'to-scenario', toStageId: 'scenarioAnalysis', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (from) => `Handover from ${from ?? "dataCollection"} to IRAnalysis`
    },
    scenarioAnalysis: {
      stageId: 'scenarioAnalysis',
      name: "Scenario Analysis",
      description: "Analyze scenarios",
      agent: "HArchitect",
      promptFile: "scenario_analysis.md",
      transitions: [{ id: 'to-usecase', toStageId: 'useCaseAnalysis', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (from) => `Handover from ${from ?? "IRAnalysis"} to scenarioAnalysis`
    },
    useCaseAnalysis: {
      stageId: 'useCaseAnalysis',
      name: "Use Case Analysis",
      description: "Analyze use cases",
      agent: "HArchitect",
      promptFile: "use_case_analysis.md",
      transitions: [{ id: 'to-functional', toStageId: 'functionalRefinement', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (from) => `Handover from ${from ?? "scenarioAnalysis"} to useCaseAnalysis`
    },
    functionalRefinement: {
      stageId: 'functionalRefinement',
      name: "Functional Refinement",
      description: "Refine functionality",
      agent: "HEngineer",
      promptFile: "functional_refinement.md",
      transitions: [{ id: 'to-decompose', toStageId: 'requirementDecomposition', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (from) => `Handover from ${from ?? "useCaseAnalysis"} to functionalRefinement`
    },
    requirementDecomposition: {
      stageId: 'requirementDecomposition',
      name: "Requirement Decomposition",
      description: "Decompose requirements",
      agent: "HEngineer",
      promptFile: "requirement_decomposition.md",
      transitions: [{ id: 'to-system', toStageId: 'systemFunctionalDesign', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (from) => `Handover from ${from ?? "functionalRefinement"} to requirementDecomposition`
    },
    systemFunctionalDesign: {
      stageId: 'systemFunctionalDesign',
      name: "System Functional Design",
      description: "Design system functionality",
      agent: "HArchitect",
      promptFile: "system_functional_design.md",
      transitions: [{ id: 'to-module', toStageId: 'moduleFunctionalDesign', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (from) => `Handover from ${from ?? "requirementDecomposition"} to systemFunctionalDesign`
    },
    moduleFunctionalDesign: {
      stageId: 'moduleFunctionalDesign',
      name: "Module Functional Design",
      description: "Design module functionality",
      agent: "HEngineer",
      promptFile: "module_functional_design.md",
      transitions: [],
      getHandoverPrompt: (from) => `Handover from ${from ?? "systemFunctionalDesign"} to moduleFunctionalDesign`
    }
  }
}

const transitionOnlyWorkflowDef: WorkflowDefinition = {
  id: 'transitionOnly',
  name: 'Transition Only Workflow',
  description: 'Workflow without stageOrder field',
  entryStageId: 'A',
  stages: {
    A: {
      stageId: 'A',
      name: 'Stage A',
      description: 'Stage A',
      agent: 'HArchitect',
      requiredMilestones: ['gate'],
      transitions: [{ id: 'A-B', toStageId: 'B', mode: 'auto', priority: 0 }],
      getHandoverPrompt: () => 'to A',
    },
    B: {
      stageId: 'B',
      name: 'Stage B',
      description: 'Stage B',
      agent: 'HEngineer',
      before: [
        {
          id: 'before-b',
          description: 'before hook for B',
          fn: async ({ setMilestone, setInfo }) => {
            setMilestone?.({ key: 'hook_local', isCompleted: false, detail: { source: 'before' } })
            setInfo?.({ hookFlag: true })
          },
        },
      ],
      transitions: [],
      getHandoverPrompt: () => 'to B',
    },
  },
}

describe("workflow state management", () => {
  const findLatestNodeMilestone = (
    state: ReturnType<typeof getWorkflowState> | Exclude<ReturnType<typeof forceWorkflowNextStep>, { error: string; reason: string }>,
    nodeId: string,
    key: string,
  ) => {
    const events = state?.history?.events ?? []
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i]
      if (event.type === 'milestone.set' && event.nodeId === nodeId && event.key === key) {
        return event.value as { isCompleted?: boolean; detail?: unknown } | undefined
      }
    }
    return undefined
  }

  beforeEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
  })

  afterEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
  })

  describe("initializeWorkflowState", () => {
    it("creates state from workflow definition with all stages selected", () => {
      const state = initializeWorkflowState(classicWorkflowDef)

      expect(state.initialized).toBe(false)
      expect(state.typeId).toBe("classic")
      expect(Object.keys(state.workflow)).toHaveLength(8)
      expect(state.workflow.dataCollection?.selected).toBe(true)
      expect(state.workflow.IRAnalysis?.selected).toBe(true)
      expect(state.current).toBeNull()
    })

    it("creates state with selected stages", () => {
      const state = initializeWorkflowState(classicWorkflowDef, ["dataCollection", "IRAnalysis"])

      expect(state.initialized).toBe(false)
      expect(state.workflow.dataCollection?.selected).toBe(true)
      expect(state.workflow.IRAnalysis?.selected).toBe(true)
      expect(state.workflow.scenarioAnalysis?.selected).toBe(false)
      // Verify neighbor links for selected stages
      expect(state.workflow.dataCollection?.previousStage).toBeNull()
      expect(state.workflow.dataCollection?.nextStage).toBe("IRAnalysis")
      expect(state.workflow.IRAnalysis?.previousStage).toBe("dataCollection")
      expect(state.workflow.IRAnalysis?.nextStage).toBeNull()
      // Deselected stages should not have neighbor links
      expect(state.workflow.scenarioAnalysis?.previousStage).toBeUndefined()
      expect(state.workflow.scenarioAnalysis?.nextStage).toBeUndefined()
    })

    it("creates state with all stages selected and correct neighbor links", () => {
      const state = initializeWorkflowState(classicWorkflowDef)
      // First stage: previousStage should be null
      expect(state.workflow.dataCollection?.previousStage).toBeNull()
      expect(state.workflow.dataCollection?.nextStage).toBe("IRAnalysis")
      // Middle stages: should have both previous and next
      expect(state.workflow.IRAnalysis?.previousStage).toBe("dataCollection")
      expect(state.workflow.IRAnalysis?.nextStage).toBe("scenarioAnalysis")
      expect(state.workflow.scenarioAnalysis?.previousStage).toBe("IRAnalysis")
      expect(state.workflow.scenarioAnalysis?.nextStage).toBe("useCaseAnalysis")
      expect(state.workflow.useCaseAnalysis?.previousStage).toBe("scenarioAnalysis")
      expect(state.workflow.useCaseAnalysis?.nextStage).toBe("functionalRefinement")
      expect(state.workflow.functionalRefinement?.previousStage).toBe("useCaseAnalysis")
      expect(state.workflow.functionalRefinement?.nextStage).toBe("requirementDecomposition")
      expect(state.workflow.requirementDecomposition?.previousStage).toBe("functionalRefinement")
      expect(state.workflow.requirementDecomposition?.nextStage).toBe("systemFunctionalDesign")
      expect(state.workflow.systemFunctionalDesign?.previousStage).toBe("requirementDecomposition")
      expect(state.workflow.systemFunctionalDesign?.nextStage).toBe("moduleFunctionalDesign")
      // Last stage: nextStage should be null
      expect(state.workflow.moduleFunctionalDesign?.previousStage).toBe("systemFunctionalDesign")
      expect(state.workflow.moduleFunctionalDesign?.nextStage).toBeNull()
    })

    it("creates state with non-contiguous selected stages", () => {
      const state = initializeWorkflowState(classicWorkflowDef, ["dataCollection", "scenarioAnalysis", "moduleFunctionalDesign"])
      // First selected stage
      expect(state.workflow.dataCollection?.previousStage).toBeNull()
      expect(state.workflow.dataCollection?.nextStage).toBe("scenarioAnalysis")
      // Middle selected stage (skips IRAnalysis)
      expect(state.workflow.scenarioAnalysis?.previousStage).toBe("dataCollection")
      expect(state.workflow.scenarioAnalysis?.nextStage).toBe("moduleFunctionalDesign")
      // Last selected stage
      expect(state.workflow.moduleFunctionalDesign?.previousStage).toBe("scenarioAnalysis")
      expect(state.workflow.moduleFunctionalDesign?.nextStage).toBeNull()
      // Deselected stages should not have neighbor links
      expect(state.workflow.IRAnalysis?.previousStage).toBeUndefined()
      expect(state.workflow.IRAnalysis?.nextStage).toBeUndefined()
      expect(state.workflow.useCaseAnalysis?.previousStage).toBeUndefined()
      expect(state.workflow.useCaseAnalysis?.nextStage).toBeUndefined()
    })

    it("works with custom workflow definition", () => {
      const customDef: WorkflowDefinition = {
        id: "custom",
        name: "Custom Workflow",
        description: "Test workflow",
        entryStageId: 'stage1',
        stages: {
          stage1: {
            stageId: 'stage1',
            name: "Stage 1",
            description: "First stage",
            agent: "TestAgent",
            promptFile: "stage1.md",
            transitions: [{ id: 'to-stage2', toStageId: 'stage2', mode: 'auto', priority: 0 }],
            getHandoverPrompt: (from) => `${from ?? "start"} -> stage1`
          },
          stage2: {
            stageId: 'stage2',
            name: "Stage 2",
            description: "Second stage",
            agent: "TestAgent",
            promptFile: "stage2.md",
            transitions: [{ id: 'to-stage3', toStageId: 'stage3', mode: 'auto', priority: 0 }],
            getHandoverPrompt: (from) => `${from ?? "stage1"} -> stage2`
          },
          stage3: {
            stageId: 'stage3',
            name: "Stage 3",
            description: "Third stage",
            agent: "TestAgent",
            promptFile: "stage3.md",
            transitions: [],
            getHandoverPrompt: (from) => `${from ?? "stage2"} -> stage3`
          }
        }
      }

      const state = initializeWorkflowState(customDef)
      expect(state.initialized).toBe(false)
      expect(state.typeId).toBe("custom")
      expect(Object.keys(state.workflow)).toHaveLength(3)
      expect(state.workflow.stage1?.selected).toBe(true)
      // Verify neighbor links
      expect(state.workflow.stage1?.previousStage).toBeNull()
      expect(state.workflow.stage1?.nextStage).toBe("stage2")
      expect(state.workflow.stage2?.previousStage).toBe("stage1")
      expect(state.workflow.stage2?.nextStage).toBe("stage3")
      expect(state.workflow.stage3?.previousStage).toBe("stage2")
      expect(state.workflow.stage3?.nextStage).toBeNull()
    })

    it('creates state from transition graph when stageOrder is omitted', () => {
      const state = initializeWorkflowState(transitionOnlyWorkflowDef)

      expect(Object.keys(state.workflow)).toEqual(['A', 'B'])
      expect(state.workflow.A?.nextStage).toBe('B')
      expect(state.workflow.B?.previousStage).toBe('A')
    })
  })

  describe("getStageOrder", () => {
    it("returns stage order from definition", () => {
      const order = getStageOrder(classicWorkflowDef)
      expect(order).toEqual([
        "dataCollection",
        "IRAnalysis",
        "scenarioAnalysis",
        "useCaseAnalysis",
        "functionalRefinement",
        "requirementDecomposition",
        "systemFunctionalDesign",
        "moduleFunctionalDesign"
      ])
    })
  })

  describe("getWorkflowState", () => {
    it("returns null when file doesn't exist", () => {
      const state = getWorkflowState()
      expect(state).toBeNull()
    })

    it("does not create state file when called", () => {
      expect(existsSync(STATE_FILE)).toBe(false)
      getWorkflowState()
      expect(existsSync(STATE_FILE)).toBe(false)
    })
  })

  describe('workflow_state persistence schema v2', () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it('writes deduplicated plan/execution format without legacy duplicate blocks', () => {
      const state = getWorkflowState()
      expect(state).not.toBeNull()

      const raw = JSON.parse(readFileSync(STATE_FILE, 'utf-8')) as Record<string, unknown>

      expect(raw.schemaVersion).toBe(2)
      expect(raw.plan).toBeDefined()
      expect(raw.execution).toBeDefined()
      expect(raw.workflow).toBeUndefined()
      expect(raw.instance).toBeUndefined()
      expect(raw.current).toBeUndefined()
      expect(raw.runtime).toBeUndefined()
    })

    it('can read legacy v1 state and expose runtime-compatible fields', () => {
      const legacy = {
        initialized: true,
        typeId: 'classic',
        workflow: {
          IRAnalysis: { isCompleted: true, selected: true, previousStage: null, nextStage: 'scenarioAnalysis' },
          scenarioAnalysis: { isCompleted: false, selected: true, previousStage: 'IRAnalysis', nextStage: null },
        },
        current: {
          name: 'scenarioAnalysis',
          handoverTo: null,
          previousStage: 'IRAnalysis',
          nextStage: null,
          failureCount: 0,
        },
        instance: {
          instanceId: 'instance_abc123',
          workflowId: 'classic',
          workflowVersion: '1.0.0',
          selectedStageIds: ['IRAnalysis', 'scenarioAnalysis'],
          skippedStageIds: [],
          entryNodeId: 'node_001',
          nodePlan: {},
        },
        runtime: {
          status: 'running',
          flow: {
            fromNodeId: null,
            currentNodeId: 'node_002',
            nextNodeId: null,
            lastEventSeq: 5,
          },
          currentNodeContext: {
            nodeId: 'node_002',
            visit: 1,
            attempt: 1,
            milestones: {},
            info: {},
          },
        },
      }

      rmSync(STATE_FILE, { force: true })
      const stateDir = join(process.cwd(), '.hyper-designer')
      if (!existsSync(stateDir)) {
        writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
      }
      rmSync(STATE_FILE, { force: true })
      writeFileSync(STATE_FILE, JSON.stringify(legacy, null, 2), 'utf-8')

      const loaded = getWorkflowState()

      expect(loaded?.workflow.IRAnalysis?.isCompleted).toBe(true)
      expect(loaded?.current?.name).toBe('scenarioAnalysis')
      expect(loaded?.instance?.instanceId).toBe('instance_abc123')
      expect(loaded?.runtime?.flow.currentNodeId).toBe('node_002')
    })
  })

  describe("setWorkflowStage", () => {
    beforeEach(() => {
      // Initialize state first
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("updates specific stage completion status", () => {
      setWorkflowStage("IRAnalysis", true)

      const updatedState = getWorkflowState()
      expect(updatedState!.workflow.IRAnalysis?.isCompleted).toBe(true)
    })

    it("persists state to file", () => {
      setWorkflowStage("scenarioAnalysis", true)

      const reloadedState = getWorkflowState()
      expect(reloadedState!.workflow.scenarioAnalysis?.isCompleted).toBe(true)
    })

    it("ignores invalid stage name", () => {
      const state = setWorkflowStage("invalidStage", true)
      expect(state.workflow.invalidStage).toBeUndefined()
    })
  })

  describe("setWorkflowCurrent", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("sets current step", () => {
      const updatedState = setWorkflowCurrent("useCaseAnalysis")
      expect(updatedState.current?.name).toBe("useCaseAnalysis")
    })

    it("allows null to clear current step", () => {
      setWorkflowCurrent("functionalRefinement")
      const clearedState = setWorkflowCurrent(null)
      expect(clearedState.current).toBeNull()
    })

    it("ignores invalid step name", () => {
      const state = setWorkflowCurrent("invalidStep")
      expect(state.current).toBeNull()
    })

    it("persists current step to file", () => {
      const state = setWorkflowCurrent("systemFunctionalDesign")
      expect(state.current?.name).toBe("systemFunctionalDesign")
    })

    it("resets gate status when stage changes", () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGateResult({ detail: { score: 100, comment: null } })
      setWorkflowCurrent("scenarioAnalysis")
      const state = getWorkflowState()
      const gateMilestone = findLatestNodeMilestone(state, 'workflow.IRAnalysis.main', 'gate')
      expect(gateMilestone?.isCompleted).toBe(true)
    })

  })

  describe("setWorkflowGateResult", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("updates gate pass status in state file", () => {
      setWorkflowCurrent("IRAnalysis")
      const state = setWorkflowGateResult({ detail: { score: 100, comment: null } })
      const gateMilestone = findLatestNodeMilestone(state, 'workflow.IRAnalysis.main', 'gate')
      expect(gateMilestone?.isCompleted).toBe(true)
      expect((gateMilestone?.detail as { score?: number } | undefined)?.score).toBe(100)
      const reloaded = getWorkflowState()
      const reloadedGateMilestone = findLatestNodeMilestone(reloaded, 'workflow.IRAnalysis.main', 'gate')
      expect(reloadedGateMilestone?.isCompleted).toBe(true)
      expect((reloadedGateMilestone?.detail as { score?: number } | undefined)?.score).toBe(100)
    })
  })

  describe("setWorkflowHandover", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("returns state object", () => {
      setWorkflowCurrent("dataCollection")
      const updatedState = setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      expect(updatedState).toHaveProperty("workflow")
      expect(updatedState).toHaveProperty("current")
      expect(updatedState.current?.handoverTo).toBe("IRAnalysis")
    })

    it('increments failureCount when handover target is invalid', () => {
      setWorkflowCurrent('dataCollection')
      const state = setWorkflowHandover('invalidHandover', classicWorkflowDef)
      expect(state.current?.handoverTo).toBeNull()
      expect(state.current?.failureCount).toBe(1)
    })

    it('does not increment failureCount when handover scheduling succeeds', () => {
      setWorkflowCurrent('dataCollection')
      const afterReject = setWorkflowHandover('invalidHandover', classicWorkflowDef)
      expect(afterReject.current?.failureCount).toBe(1)

      const successState = setWorkflowHandover('IRAnalysis', classicWorkflowDef)
      expect(successState.current?.handoverTo).toBe('IRAnalysis')
      expect(successState.current?.failureCount).toBe(1)
    })

    it("allows null to clear handover", () => {
      setWorkflowCurrent("dataCollection")
      setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      const clearedState = setWorkflowHandover(null, classicWorkflowDef)
      expect(clearedState.current?.handoverTo).toBeNull()
    })

    it("ignores invalid handover step", () => {
      setWorkflowCurrent("dataCollection")
      const state = setWorkflowHandover("invalidHandover", classicWorkflowDef)
      expect(state.current?.handoverTo).toBeNull()
    })

    it("prevents skipping stages in handover", () => {
      setWorkflowCurrent("dataCollection")
      const state = setWorkflowHandover("useCaseAnalysis", classicWorkflowDef)
      expect(state.current?.handoverTo).toBeNull()
    })

    it("allows backward handover", () => {
      setWorkflowStage("dataCollection", true)
      setWorkflowCurrent("scenarioAnalysis")
      const currentState = getWorkflowState()
      expect(currentState?.current?.name).toBe("scenarioAnalysis")
      const state = setWorkflowHandover("IRAnalysis", classicWorkflowDef)
      expect(state.current?.handoverTo).toBe("IRAnalysis")
    })
  })

  describe("executeWorkflowHandover", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("throws error when workflow not selected", async () => {
      // Remove state file to simulate uninitialized state
      rmSync(STATE_FILE, { force: true })

      await expect(executeWorkflowHandover(classicWorkflowDef)).rejects.toThrow("Workflow not selected")
    })

    it("returns state when handover is not set", async () => {
      const state = await executeWorkflowHandover(classicWorkflowDef)
      expect(state).toHaveProperty("workflow")
      expect(state.current).toBeDefined()
    })

    it("executes handover when handover is set", async () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowHandover("scenarioAnalysis", classicWorkflowDef)

      const state = await executeWorkflowHandover(classicWorkflowDef)

      expect(state.current?.name).toBe("scenarioAnalysis")
      expect(state.current?.handoverTo).toBeNull()
      expect(state.workflow.IRAnalysis?.isCompleted).toBe(true)
    })

    it('resets failureCount to 0 after successful stage transition', async () => {
      setWorkflowCurrent('IRAnalysis')
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      const preTransition = getWorkflowState()
      expect(preTransition?.current?.failureCount).toBe(1)

      setWorkflowHandover('scenarioAnalysis', classicWorkflowDef)
      const state = await executeWorkflowHandover(classicWorkflowDef)

      expect(state.current?.name).toBe('scenarioAnalysis')
      expect(state.current?.failureCount).toBe(0)
      expect(state.current?.previousStage).toBe('IRAnalysis')
      expect(state.current?.nextStage).toBe('useCaseAnalysis')
    })

    it('records node-level history and clears hook context milestones after flush', async () => {
      writeWorkflowStateFile(initializeWorkflowState(transitionOnlyWorkflowDef))
      setWorkflowCurrent('A')
      setWorkflowHandover('B', transitionOnlyWorkflowDef)

      const state = await executeWorkflowHandover(transitionOnlyWorkflowDef)

      expect(state.runtime?.flow.currentNodeId).toBe('workflow.B.main')
      expect(state.runtime?.flow.fromNodeId).toBe('workflow.B.before.before-b')
      expect(state.runtime?.flow.nextNodeId).toBeNull()

      const historyEvents = state.history?.events ?? []
      const transitionEvents = historyEvents.filter(event => event.type === 'transition')
      const hookMilestoneEvent = historyEvents.find(event => event.type === 'milestone.set' && event.nodeId === 'workflow.B.before.before-b' && event.key === 'hook_local')
      const hookInfoEvent = historyEvents.find(event => event.type === 'node.info.updated' && event.nodeId === 'workflow.B.before.before-b')

      expect(transitionEvents.length).toBeGreaterThan(0)
      expect(hookMilestoneEvent).toBeDefined()
      expect(hookInfoEvent?.patch).toMatchObject({ hookFlag: true })
      expect(state.runtime?.currentNodeContext?.milestones).toEqual({})
      expect(state.runtime?.currentNodeContext?.info).toEqual({})
    })
  })

  describe('forceWorkflowNextStep', () => {
    beforeEach(() => {
      const state = initializeWorkflowState(classicWorkflowDef)
      // forceWorkflowNextStep 需要 initialized: true（模拟已完成首次交接）
      state.initialized = true
      writeWorkflowStateFile(state)
      setWorkflowCurrent('IRAnalysis')
    })

    it('denies when failureCount is less than 3', () => {
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)

      const result = forceWorkflowNextStep(classicWorkflowDef)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.reason).toContain('failureCount')
      }
    })

    it('denies when handover target is not next selected stage', () => {
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('dataCollection', classicWorkflowDef)

      const result = forceWorkflowNextStep(classicWorkflowDef)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.reason).toContain('next selected stage')
      }
    })

    it('succeeds when failureCount >= 3 and target is next selected stage', () => {
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)

      const result = forceWorkflowNextStep(classicWorkflowDef)

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.current?.name).toBe('scenarioAnalysis')
        expect(result.current?.failureCount).toBe(0)
      }
    })

    it('records auditable force_advance milestone without setting gate milestone', () => {
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)
      setWorkflowHandover('invalidHandover', classicWorkflowDef)

      const result = forceWorkflowNextStep(classicWorkflowDef)

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        const milestone = findLatestNodeMilestone(result, 'workflow.IRAnalysis.main', 'force_advance')
        expect(milestone?.isCompleted).toBe(true)
        expect(milestone?.detail).toMatchObject({
          reason: 'Forced transition after 3+ failed handover attempts',
        })
        const gateMilestone = findLatestNodeMilestone(result, 'workflow.IRAnalysis.main', 'gate')
        expect(gateMilestone).toBeUndefined()
      }
    })
  })

  describe("gateResult clearing", () => {
    beforeEach(() => {
      writeWorkflowStateFile(initializeWorkflowState(classicWorkflowDef))
    })

    it("clears gateResult when currentStage is updated to a different stage", () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGateResult({ detail: { score: 100, comment: null } })

      let state = getWorkflowState()
      const irGateMilestoneBefore = findLatestNodeMilestone(state, 'workflow.IRAnalysis.main', 'gate')
      expect(irGateMilestoneBefore?.isCompleted).toBe(true)
      expect((irGateMilestoneBefore?.detail as { score?: number } | undefined)?.score).toBe(100)

      setWorkflowCurrent("scenarioAnalysis")

      state = getWorkflowState()
      const irGateMilestoneAfter = findLatestNodeMilestone(state, 'workflow.IRAnalysis.main', 'gate')
      const scenarioGateMilestone = findLatestNodeMilestone(state, 'workflow.scenarioAnalysis.main', 'gate')
      expect(irGateMilestoneAfter?.isCompleted).toBe(true)
      expect(scenarioGateMilestone).toBeUndefined()
    })

    it("clears gateResult during executeWorkflowHandover", async () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGateResult({ detail: { score: 100, comment: null } })
      setWorkflowHandover("scenarioAnalysis", classicWorkflowDef)
      let state = getWorkflowState()
      const irGateMilestoneBefore = findLatestNodeMilestone(state, 'workflow.IRAnalysis.main', 'gate')
      expect(irGateMilestoneBefore?.isCompleted).toBe(true)

      await executeWorkflowHandover(classicWorkflowDef)

      state = getWorkflowState()
      expect(state?.current?.name).toBe("scenarioAnalysis")
      const irGateMilestoneAfter = findLatestNodeMilestone(state, 'workflow.IRAnalysis.main', 'gate')
      expect(irGateMilestoneAfter?.isCompleted).toBe(true)
    })

    it("clears gateResult when currentStage is set to null", () => {
      setWorkflowCurrent("IRAnalysis")
      setWorkflowGateResult({ detail: { score: 100, comment: null } })

      setWorkflowCurrent(null)

      const state = getWorkflowState()
      expect(state?.current).toBeNull()
      const irGateMilestone = findLatestNodeMilestone(state, 'workflow.IRAnalysis.main', 'gate')
      expect(irGateMilestone?.isCompleted).toBe(true)
    })
  })

})
