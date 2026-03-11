import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

import type { WorkflowDefinition } from '../../../workflows/core/types'
import type { WorkflowState } from '../../../workflows/core/state/types'
import { resolveStageInputs, validateStageOutputs, ArtifactResolutionError } from '../../../workflows/core/artifacts'

function createDefinition(): WorkflowDefinition {
  return {
    id: 'classic',
    name: 'Classic',
    description: 'test workflow',
    stageOrder: ['IRAnalysis', 'scenarioAnalysis', 'useCaseAnalysis'],
    stages: {
      IRAnalysis: {
        name: 'IR Analysis',
        description: 'IR',
        agent: 'HArchitect',
        outputs: {
          需求信息: { path: 'docs/需求信息.md' },
        },
        getHandoverPrompt: () => 'to IRAnalysis',
      },
      scenarioAnalysis: {
        name: 'Scenario Analysis',
        description: 'Scenario',
        agent: 'HArchitect',
        inputs: {
          需求信息: { required: true },
        },
        outputs: {
          功能场景: { path: 'docs/功能场景.md' },
        },
        getHandoverPrompt: () => 'to scenarioAnalysis',
      },
      useCaseAnalysis: {
        name: 'Use Case Analysis',
        description: 'UseCase',
        agent: 'HArchitect',
        inputs: {
          功能场景: { required: true },
        },
        outputs: {
          用例: { path: 'docs/用例.md' },
        },
        getHandoverPrompt: () => 'to useCaseAnalysis',
      },
    },
  }
}

function createState(overrides?: Partial<WorkflowState>): WorkflowState {
  return {
    initialized: true,
    typeId: 'classic',
    workflow: {
      IRAnalysis: { isCompleted: true, selected: true },
      scenarioAnalysis: { isCompleted: false, selected: true },
      useCaseAnalysis: { isCompleted: false, selected: true },
    },
    current: null,
    ...overrides,
  }
}

describe('ArtifactManager', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'artifact-manager-test-'))
    mkdirSync(join(tempDir, 'docs'), { recursive: true })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('resolveStageInputs resolves inputs from completed prior stages', () => {
    const definition = createDefinition()
    const state = createState()
    writeFileSync(join(tempDir, 'docs/需求信息.md'), 'test content', 'utf-8')

    const inputs = resolveStageInputs('scenarioAnalysis', definition, state, tempDir)

    expect(inputs.需求信息).toBe('test content')
  })

  it('resolveStageInputs throws ArtifactResolutionError for missing required inputs', () => {
    const definition = createDefinition()
    const state = createState()

    expect(() => resolveStageInputs('scenarioAnalysis', definition, state, tempDir)).toThrow(ArtifactResolutionError)
  })

  it('resolveStageInputs returns "无" for missing optional inputs', () => {
    const definition = createDefinition()
    definition.stages.scenarioAnalysis.inputs = {
      需求信息: { required: false },
    }
    const state = createState()

    const inputs = resolveStageInputs('scenarioAnalysis', definition, state, tempDir)

    expect(inputs.需求信息).toBe('无')
  })

  it('resolveStageInputs only resolves from isCompleted === true stages', () => {
    const definition = createDefinition()
    const state = createState({
      workflow: {
        IRAnalysis: { isCompleted: false },
        scenarioAnalysis: { isCompleted: false },
        useCaseAnalysis: { isCompleted: false },
      },
    })
    writeFileSync(join(tempDir, 'docs/需求信息.md'), 'should not be loaded', 'utf-8')

    expect(() => resolveStageInputs('scenarioAnalysis', definition, state, tempDir)).toThrow(ArtifactResolutionError)
  })

  it('validateStageOutputs returns valid=true when all outputs exist', () => {
    const definition = createDefinition()
    writeFileSync(join(tempDir, 'docs/需求信息.md'), 'ok', 'utf-8')

    const result = validateStageOutputs('IRAnalysis', definition, tempDir)

    expect(result).toEqual({ valid: true, missing: [] })
  })

  it('validateStageOutputs returns missing outputs when files do not exist', () => {
    const definition = createDefinition()

    const result = validateStageOutputs('IRAnalysis', definition, tempDir)

    expect(result.valid).toBe(false)
    expect(result.missing).toContain('docs/需求信息.md')
  })
})
