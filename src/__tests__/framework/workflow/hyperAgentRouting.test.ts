import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'

import type { WorkflowDefinition } from '../../../workflows'
import {
  executeWorkflowHandover,
  forceWorkflowNextStep,
  readWorkflowStateFile,
  writeWorkflowStateFile,
} from '../../../workflows/state'
import { workflowService } from '../../../workflows/service'
import { createAgentTransformer } from '../../../transform/chatMessageTransform'

const STATE_FILE = join(process.cwd(), '.hyper-designer', 'workflow_state.json')

function makeTwoStageWorkflow(overrides?: {
  beforeAgentOverride?: string
  onBefore?: () => Promise<void>
}): WorkflowDefinition {
  return {
    id: 'hyper-agent-routing-test',
    name: 'Hyper Agent Routing Test Workflow',
    description: 'Workflow for compatibility and edge cases',
    entryStageId: 'stage1',
    stages: {
      stage1: {
        stageId: 'stage1',
        name: 'Stage 1',
        description: 'First stage',
        agent: 'HArchitect',
        transitions: [{ id: 'to-stage2', toStageId: 'stage2', mode: 'auto', priority: 0 }],
        getHandoverPrompt: () => 'handover to stage1',
      },
      stage2: {
        stageId: 'stage2',
        name: 'Stage 2',
        description: 'Second stage',
        agent: 'HEngineer',
        transitions: [],
        getHandoverPrompt: () => 'handover to stage2',
        ...(overrides?.onBefore
          ? {
              before: [{ fn: overrides.onBefore, ...(overrides.beforeAgentOverride ? { agent: overrides.beforeAgentOverride } : {}) }],
            }
          : {}),
      },
    },
  }
}

describe('hyper agent routing: backward compatibility and edge cases', () => {
  beforeEach(() => {
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (existsSync(STATE_FILE)) {
      rmSync(STATE_FILE, { force: true })
    }
  })

  describe('backward compatibility', () => {
    it('reads old state file (without agent/phase) successfully', () => {
      writeFileSync(
        STATE_FILE,
        JSON.stringify(
          {
            initialized: true,
            typeId: 'classic',
            workflow: {
              stage1: { isCompleted: false, selected: true },
            },
            current: {
              name: 'stage1',
              handoverTo: null,
            },
          },
          null,
          2,
        ),
        'utf-8',
      )

      const state = readWorkflowStateFile()

      expect(state).not.toBeNull()
      expect(state?.current?.name).toBe('stage1')
    })

    it('keeps agent undefined when reading old state', () => {
      writeFileSync(
        STATE_FILE,
        JSON.stringify(
          {
            initialized: true,
            typeId: 'classic',
            workflow: {
              stage1: { isCompleted: false, selected: true },
            },
            current: {
              name: 'stage1',
              handoverTo: null,
            },
          },
          null,
          2,
        ),
        'utf-8',
      )

      const state = readWorkflowStateFile()

      expect(state?.current?.agent).toBeUndefined()
    })

    it('round-trip: write new state then read back keeps current.agent for routing', () => {
      writeWorkflowStateFile({
        initialized: true,
        typeId: 'classic',
        workflow: {
          stage1: {
            isCompleted: false,
            selected: true,
            previousStage: null,
            nextStage: 'stage2',
          },
          stage2: {
            isCompleted: false,
            selected: true,
            previousStage: 'stage1',
            nextStage: null,
          },
        },
        current: {
          name: 'stage1',
          handoverTo: 'stage2',
          agent: 'HArchitect',
          previousStage: null,
          nextStage: 'stage2',
          failureCount: 0,
        },
      })

      const state = readWorkflowStateFile()

      expect(state?.current?.name).toBe('stage1')
      expect(state?.current?.handoverTo).toBe('stage2')
      expect(state?.current?.agent).toBe('HArchitect')
    })
  })

  describe('edge cases', () => {
    it('chat.message keeps Hyper unchanged when workflow state is null', async () => {
      vi.spyOn(workflowService, 'getState').mockReturnValue(null)

      const transformer = createAgentTransformer()
      const input = { agent: 'Hyper' } as Parameters<ReturnType<typeof createAgentTransformer>>[0]
      const output = {
        message: { agent: 'Hyper' },
      } as Parameters<ReturnType<typeof createAgentTransformer>>[1]

      await transformer(input, output)

      expect(input.agent).toBe('Hyper')
      expect(output.message.agent).toBe('Hyper')
    })

    it('chat.message keeps Hyper unchanged when current stage is null', async () => {
      vi.spyOn(workflowService, 'getState').mockReturnValue({
        initialized: true,
        typeId: 'classic',
        workflow: {},
        current: null,
      })

      const transformer = createAgentTransformer()
      const input = { agent: 'Hyper' } as Parameters<ReturnType<typeof createAgentTransformer>>[0]
      const output = {
        message: { agent: 'Hyper' },
      } as Parameters<ReturnType<typeof createAgentTransformer>>[1]

      await transformer(input, output)

      expect(input.agent).toBe('Hyper')
      expect(output.message.agent).toBe('Hyper')
    })

    it('routes Hyper to HArchitect when current.stage has agent defined in workflow definition', async () => {
      // After fix: when setWorkflowCurrent sets agent from stage definition,
      // resolveAgentForMessage should return the stage's agent
      vi.spyOn(workflowService, 'getState').mockReturnValue({
        initialized: true,
        typeId: 'classic',
        workflow: {},
        current: {
          name: 'IRAnalysis',
          handoverTo: null,
          agent: 'HArchitect', // Now set by setWorkflowCurrent from stage definition
          previousStage: null,
          nextStage: null,
          failureCount: 0,
        },
      })

      const transformer = createAgentTransformer()
      const input = { agent: 'Hyper' } as Parameters<ReturnType<typeof createAgentTransformer>>[0]
      const output = {
        message: { agent: 'Hyper' },
      } as Parameters<ReturnType<typeof createAgentTransformer>>[1]

      await transformer(input, output)

      expect(input.agent).toBe('HArchitect')
      expect(output.message.agent).toBe('HArchitect')
    })

    it('keeps Hyper unchanged when current.agent is undefined (backward compat)', async () => {
      // Backward compat: old state files without agent field should not crash
      vi.spyOn(workflowService, 'getState').mockReturnValue({
        initialized: true,
        typeId: 'classic',
        workflow: {},
        current: {
          name: 'IRAnalysis',
          handoverTo: null,
          previousStage: null,
          nextStage: null,
          failureCount: 0,
        },
      })

      const transformer = createAgentTransformer()
      const input = { agent: 'Hyper' } as Parameters<ReturnType<typeof createAgentTransformer>>[0]
      const output = {
        message: { agent: 'Hyper' },
      } as Parameters<ReturnType<typeof createAgentTransformer>>[1]

      await transformer(input, output)

      expect(input.agent).toBe('Hyper')
      expect(output.message.agent).toBe('Hyper')
    })

    it('unknown stage handover gracefully handles missing stage definition by failing predictably', async () => {
      const incompleteDefinition: WorkflowDefinition = {
        id: 'incomplete-definition',
        name: 'Incomplete Definition Workflow',
        description: 'Missing stage2 definition intentionally',
        entryStageId: 'stage1',
        stages: {
          stage1: {
            stageId: 'stage1',
            name: 'Stage 1',
            description: 'First stage',
            agent: 'HArchitect',
            transitions: [{ id: 'to-stage2', toStageId: 'stage2', mode: 'auto', priority: 0 }],
            getHandoverPrompt: () => 'handover to stage1',
          },
        },
      }

      writeWorkflowStateFile({
        initialized: true,
        typeId: incompleteDefinition.id,
        workflow: {
          stage1: { isCompleted: false, selected: true, previousStage: null, nextStage: 'stage2' },
          stage2: { isCompleted: false, selected: true, previousStage: 'stage1', nextStage: null },
        },
        current: {
          name: 'stage1',
          handoverTo: 'stage2',
          previousStage: null,
          nextStage: 'stage2',
          failureCount: 0,
        },
      })

      await expect(executeWorkflowHandover(incompleteDefinition)).rejects.toThrow(TypeError)
    })

    it('forceWorkflowNextStep correctly updates current stage and sets agent from stage definition', () => {
      const definition = makeTwoStageWorkflow()

      writeWorkflowStateFile({
        initialized: true,
        typeId: definition.id,
        workflow: {
          stage1: { isCompleted: false, selected: true, previousStage: null, nextStage: 'stage2' },
          stage2: { isCompleted: false, selected: true, previousStage: 'stage1', nextStage: null },
        },
        current: {
          name: 'stage1',
          handoverTo: null,
          agent: 'HArchitect',
          previousStage: null,
          nextStage: 'stage2',
          failureCount: 3,
        },
      })

      const result = forceWorkflowNextStep(definition)

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.current?.name).toBe('stage2')
        expect(result.current?.agent).toBe('HEngineer')
      }
    })

    it('hook-level agent override sets HCollector in write payload during hook phase', async () => {
      vi.resetModules()

      interface CapturedState {
        current?: {
          agent?: string
        } | null
      }

      const capturedStates: CapturedState[] = []

      vi.doMock('../../../workflows/state/persistence', async () => {
        const actual = await vi.importActual<typeof import('../../../workflows/state/persistence')>(
          '../../../workflows/state/persistence',
        )
        return {
          ...actual,
          writeWorkflowStateFile: (state: Parameters<typeof actual.writeWorkflowStateFile>[0]) => {
            const currentSnapshot = state.current
              ? {
                  ...(state.current.agent !== undefined ? { agent: state.current.agent } : {}),
                }
              : null
            capturedStates.push({
              current: currentSnapshot,
            })
            actual.writeWorkflowStateFile(state)
          },
        }
      })

      const stateModule = await import('../../../workflows/state')
      const definition = makeTwoStageWorkflow({
        beforeAgentOverride: 'HCollector',
        onBefore: async () => {},
      })

      stateModule.writeWorkflowStateFile({
        initialized: true,
        typeId: definition.id,
        workflow: {
          stage1: { isCompleted: false, selected: true, previousStage: null, nextStage: 'stage2' },
          stage2: { isCompleted: false, selected: true, previousStage: 'stage1', nextStage: null },
        },
        current: {
          name: 'stage1',
          handoverTo: 'stage2',
          previousStage: null,
          nextStage: 'stage2',
          failureCount: 0,
        },
      })

      await stateModule.executeWorkflowHandover(definition)

      const beforeHookWrite = capturedStates.find((entry) => entry.current?.agent === 'HCollector')
      expect(beforeHookWrite).toBeDefined()

      vi.doUnmock('../../../workflows/state/persistence')
    })
  })
})
