import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

import type { WorkflowDefinition, StageFileItem } from '../../../workflows/types'
import type { WorkflowState } from '../../../workflows/state/types'
import { resolveStageInputs, validateStageOutputs } from '../../../workflows/artifacts'

const IR_ANALYSIS_OUTPUTS: StageFileItem[] = [
  { id: '需求信息', path: './docs/需求信息.md', type: 'file', description: 'IR document' },
]

const SCENARIO_ANALYSIS_INPUTS: StageFileItem[] = [
  { id: '需求信息', path: './docs/需求信息.md', type: 'file', description: 'IR document' },
]

const SCENARIO_ANALYSIS_OUTPUTS: StageFileItem[] = [
  { id: '功能场景', path: './docs/功能场景.md', type: 'file', description: 'Scenario document' },
]

const USE_CASE_INPUTS: StageFileItem[] = [
  { id: '功能场景', path: './docs/功能场景.md', type: 'file', description: 'Scenario document' },
]

const USE_CASE_OUTPUTS: StageFileItem[] = [
  { id: '用例', path: './docs/用例.md', type: 'file', description: 'Use case document' },
]

function createDefinition(): WorkflowDefinition {
  return {
    id: 'classic',
    name: 'Classic',
    description: 'test workflow',
    entryStageId: 'IRAnalysis',
    stages: {
      IRAnalysis: {
        stageId: 'IRAnalysis',
        name: 'IR Analysis',
        description: 'IR',
        agent: 'HArchitect',
        transitions: [{ id: 'to-scenario', toStageId: 'scenarioAnalysis', mode: 'auto', priority: 0 }],
        outputs: IR_ANALYSIS_OUTPUTS,
        getHandoverPrompt: () => 'to IRAnalysis',
      },
      scenarioAnalysis: {
        stageId: 'scenarioAnalysis',
        name: 'Scenario Analysis',
        description: 'Scenario',
        agent: 'HArchitect',
        inputs: SCENARIO_ANALYSIS_INPUTS,
        outputs: SCENARIO_ANALYSIS_OUTPUTS,
        transitions: [{ id: 'to-usecase', toStageId: 'useCaseAnalysis', mode: 'auto', priority: 0 }],
        getHandoverPrompt: () => 'to scenarioAnalysis',
      },
      useCaseAnalysis: {
        stageId: 'useCaseAnalysis',
        name: 'Use Case Analysis',
        description: 'UseCase',
        agent: 'HArchitect',
        inputs: USE_CASE_INPUTS,
        outputs: USE_CASE_OUTPUTS,
        getHandoverPrompt: () => 'to useCaseAnalysis',
      },
    },
  }
}

function createState(overrides?: Partial<WorkflowState>): WorkflowState {
  return {
    initialized: true,
    typeId: 'classic',
    projectRoot: null,
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

    expect(inputs['需求信息']).toBe('test content')
  })

  it('resolveStageInputs returns "无" for missing inputs', () => {
    const definition = createDefinition()
    const state = createState()

    const inputs = resolveStageInputs('scenarioAnalysis', definition, state, tempDir)

    expect(inputs['需求信息']).toBe('无')
  })

  it('resolveStageInputs handles pattern type inputs', () => {
    const definition = createDefinition()
    definition.stages.scenarioAnalysis.inputs = [
      { id: '需求信息', path: './docs/*.md', type: 'pattern', description: 'All docs' },
    ]
    const state = createState()
    writeFileSync(join(tempDir, 'docs/需求信息.md'), 'test content', 'utf-8')

    const inputs = resolveStageInputs('scenarioAnalysis', definition, state, tempDir)

    expect(inputs['需求信息']).toContain('test content')
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
    expect(result.missing).toContain('./docs/需求信息.md')
  })
})
