import { describe, expect, it } from 'vitest'

import { createHAnalysisAgent } from '../../../agents/HAnalysis'
import {
  getStageOrder,
  getWorkflowDefinition,
  initializeWorkflowState,
  loadPromptForStage,
} from '../../../workflows'

function getProjectAnalysisWorkflow() {
  const workflow = getWorkflowDefinition('projectAnalysis')
  if (!workflow) {
    throw new Error('projectAnalysis workflow should be registered')
  }

  return workflow
}

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

  it('has no tools defined (prompt-driven workflow)', () => {
    const workflow = getProjectAnalysisWorkflow()

    expect(workflow.tools).toBeUndefined()
  })

  it('has pure Markdown output paths (no _meta/ or .json)', () => {
    const workflow = getProjectAnalysisWorkflow()
    const stageOrder = getStageOrder(workflow)

    for (const stageKey of stageOrder) {
      const stage = workflow.stages[stageKey]
      if (stage.outputs) {
        for (const [_name, output] of Object.entries(stage.outputs)) {
          expect(output.path).toMatch(/(\.md\/?|\/)$/)
          expect(output.path).not.toContain('_meta/')
          expect(output.path).not.toContain('.json')
        }
      }
    }
  })

  it('loads workflow overview and componentAnalysis stage prompts through runtime APIs', () => {
    const workflow = getProjectAnalysisWorkflow()

    const overviewPrompt = loadPromptForStage(null, workflow)
    const componentPrompt = loadPromptForStage('componentAnalysis', workflow)

    expect(overviewPrompt.length).toBeGreaterThan(0)
    expect(overviewPrompt).toContain('## Project Analysis')
    expect(overviewPrompt).toContain('systemAnalysis')

    expect(componentPrompt.length).toBeGreaterThan(overviewPrompt.length)
    expect(componentPrompt).toContain('## Project Analysis')
    expect(componentPrompt).toContain('## Current Phase: Component Analysis')
    expect(componentPrompt).toContain('components-manifest.md')
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

  it('workflow description reflects prompt-driven approach', () => {
    const workflow = getProjectAnalysisWorkflow()

    expect(workflow.description).toContain('prompt-driven')
    expect(workflow.description).toContain('Markdown')
  })
})
