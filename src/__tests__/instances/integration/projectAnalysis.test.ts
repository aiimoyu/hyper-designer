import { afterEach, describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { createHAnalysisAgent } from '../../../agents/HAnalysis'
import {
  getStageOrder,
  getWorkflowDefinition,
  initializeWorkflowState,
  loadPromptForStage,
} from '../../../workflows'
import {
  getProjectAnalysisMetadata,
  getProjectPath,
  saveProjectPath,
  shouldPromptForProjectPath,
} from '../../../workflows/plugins/projectAnalysis/persistence'
import {
  executeComponentFanOut,
  performCoverageReconciliation,
} from '../../../workflows/plugins/projectAnalysis/orchestration'

const TEMP_ROOTS: string[] = []

function createTempProjectRoot(): string {
  const tempRoot = mkdtempSync(join(tmpdir(), 'project-analysis-integration-'))
  TEMP_ROOTS.push(tempRoot)
  return tempRoot
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T
}

function getProjectAnalysisWorkflow() {
  const workflow = getWorkflowDefinition('projectAnalysis')
  if (!workflow) {
    throw new Error('projectAnalysis workflow should be registered')
  }

  return workflow
}

afterEach(() => {
  while (TEMP_ROOTS.length > 0) {
    const tempRoot = TEMP_ROOTS.pop()
    if (tempRoot && existsSync(tempRoot)) {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  }
})

describe('Integration Tests: projectAnalysis workflow', () => {
  it('registers and retrieves the projectAnalysis workflow with expected stage order', () => {
    const workflow = getProjectAnalysisWorkflow()
    const stageOrder = getStageOrder(workflow)

    expect(workflow.id).toBe('projectAnalysis')
    expect(workflow.name).toBe('Project Analysis')
    expect(stageOrder).toEqual([
      'systemAnalysis',
      'componentAnalysis',
      'missingCoverageCheck',
    ])
    expect(workflow.stages.systemAnalysis.agent).toBe('HAnalysis')
    expect(workflow.stages.componentAnalysis.agent).toBe('HAnalysis')
    expect(workflow.stages.missingCoverageCheck.agent).toBe('HAnalysis')
  })

  it('loads workflow overview and componentAnalysis stage prompts through runtime APIs', () => {
    const workflow = getProjectAnalysisWorkflow()

    const overviewPrompt = loadPromptForStage(null, workflow)
    const componentPrompt = loadPromptForStage('componentAnalysis', workflow)

    expect(overviewPrompt.length).toBeGreaterThan(0)
    expect(overviewPrompt).toContain('## 工作流各阶段概览')
    expect(overviewPrompt).toContain('systemAnalysis')

    expect(componentPrompt.length).toBeGreaterThan(overviewPrompt.length)
    expect(componentPrompt).toContain('## 工作流各阶段概览')
    expect(componentPrompt).toContain('## Current Phase: Component Analysis')
    expect(componentPrompt).toContain('_meta/component-manifest.json')
  })

  it('creates HAnalysis agent with workflow prompt tokens and primary-agent config', () => {
    const agent = createHAnalysisAgent()

    expect(agent.name).toBe('HAnalysis')
    expect(agent.mode).toBe('primary')
    expect(agent.prompt).toBeDefined()
    expect(agent.prompt).toContain('{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}')
    expect(agent.prompt).toContain('{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}')
    expect(agent.permission?.hd_workflow_state).toBe('allow')
    expect(agent.permission?.hd_handover).toBe('allow')
  })

  it('initializes workflow state for projectAnalysis with ordered stage links', () => {
    const workflow = getProjectAnalysisWorkflow()
    const state = initializeWorkflowState(workflow)
    const stageOrder = getStageOrder(workflow)

    expect(state.initialized).toBe(false)
    expect(state.typeId).toBe('projectAnalysis')
    expect(Object.keys(state.workflow)).toEqual(stageOrder)
    expect(state.current).toBeNull()

    expect(state.workflow.systemAnalysis).toMatchObject({
      isCompleted: false,
      selected: true,
      previousStage: null,
      nextStage: 'componentAnalysis',
    })
    expect(state.workflow.componentAnalysis).toMatchObject({
      isCompleted: false,
      selected: true,
      previousStage: 'systemAnalysis',
      nextStage: 'missingCoverageCheck',
    })
    expect(state.workflow.missingCoverageCheck).toMatchObject({
      isCompleted: false,
      selected: true,
      previousStage: 'componentAnalysis',
      nextStage: null,
    })
  })

  it('stores and reuses projectAnalysis manifest data across reruns in a temp project root', () => {
    const tempRoot = createTempProjectRoot()
    const projectPath = join(tempRoot, 'subject-project')
    const manifestPath = join(
      tempRoot,
      '.hyper-designer',
      'projectAnalysis',
      '_meta',
      'manifest.json',
    )

    saveProjectPath(projectPath, tempRoot)

    expect(existsSync(manifestPath)).toBe(true)
    expect(shouldPromptForProjectPath(tempRoot)).toBe(false)

    const initialManifest = readJsonFile<Record<string, unknown>>(manifestPath)
    const originalCreatedAt = initialManifest.createdAt

    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          ...initialManifest,
          updatedAt: '2020-01-01T00:00:00.000Z',
          analysisId: 'analysis-123',
          lastStage: 'componentAnalysis',
        },
        null,
        2,
      ),
      'utf-8',
    )

    const metadata = getProjectAnalysisMetadata(tempRoot)
    const reusedPath = getProjectPath(tempRoot)
    const refreshedManifest = readJsonFile<Record<string, unknown>>(manifestPath)

    expect(metadata).toMatchObject({
      projectPath,
      analysisId: 'analysis-123',
      lastStage: 'componentAnalysis',
    })
    expect(reusedPath).toBe(projectPath)
    expect(refreshedManifest.createdAt).toBe(originalCreatedAt)
    expect(refreshedManifest.updatedAt).not.toBe('2020-01-01T00:00:00.000Z')
  })

  it('executes component fan-out from manifest and writes summary output for reconciliation', () => {
    const tempRoot = createTempProjectRoot()
    const metaDir = join(tempRoot, '.hyper-designer', 'projectAnalysis', '_meta')
    const manifestPath = join(metaDir, 'component-manifest.json')
    const summaryPath = join(metaDir, 'component-analysis-summary.json')

    mkdirSync(metaDir, { recursive: true })
    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          version: '1.0',
          timestamp: new Date().toISOString(),
          components: [
            { componentSlug: 'component-1', name: 'Component 1' },
            { componentSlug: 'component-2', name: 'Component 2' },
            { componentSlug: 'ui-shell', name: 'UI Shell' },
          ],
        },
        null,
        2,
      ),
      'utf-8',
    )

    const result = executeComponentFanOut({
      manifestPath,
      projectRoot: tempRoot,
      maxConcurrency: 3,
    })
    const summary = readJsonFile<Record<string, unknown>>(summaryPath)

    expect(result).toMatchObject({
      totalComponents: 3,
      successfulComponents: 2,
      maxConcurrency: 3,
    })
    expect(result.failedComponents).toEqual([
      {
        componentSlug: 'component-2',
        error: 'component analysis execution failed',
      },
    ])
    expect(existsSync(summaryPath)).toBe(true)
    expect(summary.totalComponents).toBe(3)
    expect(summary.successfulComponents).toBe(2)
    expect(summary.failedComponents).toEqual(['component-2'])
    expect(summary.qualityScore).toBe(67)
  })

  it('reconciles strict coverage data into a verdict across all 7 categories', () => {
    const tempRoot = createTempProjectRoot()
    const metaDir = join(tempRoot, '.hyper-designer', 'projectAnalysis', '_meta')
    const coverageReportPath = join(metaDir, 'coverage-report.json')

    mkdirSync(metaDir, { recursive: true })
    writeFileSync(
      coverageReportPath,
      JSON.stringify(
        {
          categories: {
            missingComponents: {
              status: 'failed',
              items: [{ id: 'comp-001', componentSlug: 'user-service', severity: 'high' }],
            },
            missingFiles: {
              status: 'failed',
              items: [{ id: 'file-001', filePath: 'src/services/auth.ts', severity: 'medium' }],
            },
            missingFolders: {
              status: 'passed',
              items: [],
            },
            missedAPIs: {
              status: 'warning',
              items: [{ id: 'api-001', apiName: 'GET /api/users', severity: 'low' }],
            },
            insufficientMermaid: {
              status: 'failed',
              items: [{ id: 'diag-001', diagramType: 'sequence', severity: 'medium' }],
            },
            brokenReferences: {
              status: 'warning',
              items: [{ id: 'xref-001', severity: 'low' }],
            },
            systemComponentInconsistency: {
              status: 'warning',
              items: [{ id: 'inc-001', componentSlug: 'payments', severity: 'high' }],
            },
          },
        },
        null,
        2,
      ),
      'utf-8',
    )

    const result = performCoverageReconciliation({
      coverageReportPath,
      projectRoot: tempRoot,
    })

    expect(Object.keys(result.categories)).toEqual([
      'missingComponents',
      'missingFiles',
      'missingFolders',
      'missedAPIs',
      'insufficientMermaid',
      'brokenReferences',
      'systemComponentInconsistency',
    ])
    expect(result.verdict.overall).toBe('failed')
    expect(result.verdict.pass).toBe(false)
    expect(result.verdict.severity).toBe('high')
    expect(result.verdict.summary).toContain('7 categories')
    expect(result.verdict.affectedArtifacts).toEqual(
      expect.arrayContaining([
        'user-service',
        'src/services/auth.ts',
        'GET /api/users',
        'sequence',
        'xref-001',
        'payments',
      ]),
    )
    expect(result.verdict.remediation.immediate.length).toBeGreaterThan(0)
    expect(result.verdict.remediation.shortTerm.length).toBeGreaterThan(0)
    expect(result.verdict.remediation.longTerm.length).toBeGreaterThan(0)
  })
})
