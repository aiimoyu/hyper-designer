import { describe, it, expect } from 'vitest'
import {
  getStageOrder,
  loadPromptForStage,
  getWorkflowDefinition,
  getAvailableWorkflows,
} from '../../../workflows'

const WORKFLOW_OVERVIEW_PROMPT_TOKEN = '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}'
const WORKFLOW_STEP_PROMPT_TOKEN = '{HYPER_DESIGNER_WORKFLOW_STAGE_PROMPT}'

import { classicWorkflow } from '../../../builtin/workflows/classic'
import type { WorkflowDefinition } from '../../../workflows'

function getClassicWorkflow(): WorkflowDefinition {
  const workflow = getWorkflowDefinition('classic')
  if (!workflow) {
    throw new Error('Classic workflow should be defined')
  }
  return workflow
}

describe('Classic Workflow', () => {
  describe('metadata', () => {
    it('should have correct ID', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.id).toBe('classic')
    })

    it('should have correct name', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.name).toBe('Classic Requirements Engineering')
    })

    it('should have description', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.description).toBeTruthy()
      expect(workflow.description).toContain('8-stage')
    })
  })

  describe('stage order', () => {
    it('should have exactly 8 stages', () => {
      const workflow = getClassicWorkflow()
      expect(getStageOrder(workflow)).toHaveLength(8)
    })

    it('should start with IRAnalysis', () => {
      const workflow = getClassicWorkflow()
      expect(getStageOrder(workflow)[0]).toBe('IRAnalysis')
    })

    it('should end with sddPlanGeneration', () => {
      const workflow = getClassicWorkflow()
      expect(getStageOrder(workflow)[7]).toBe('sddPlanGeneration')
    })

    it('should have correct order', () => {
      const workflow = getClassicWorkflow()
      expect(getStageOrder(workflow)).toEqual([
        'IRAnalysis',
        'scenarioAnalysis',
        'useCaseAnalysis',
        'functionalRefinement',
        'requirementDecomposition',
        'systemFunctionalDesign',
        'moduleFunctionalDesign',
        'sddPlanGeneration',
      ])
    })
  })

  describe('stage definitions', () => {
    it('should have stage definitions for all stages in stageOrder', () => {
      const workflow = getClassicWorkflow()
      getStageOrder(workflow).forEach((stageName) => {
        expect(workflow.stages[stageName]).toBeDefined()
      })
    })

    it('should have no extra stages', () => {
      const workflow = getClassicWorkflow()
      const stageOrder = getStageOrder(workflow)
      const stageKeys = Object.keys(workflow.stages)
      expect(stageKeys).toHaveLength(stageOrder.length)
      stageKeys.forEach((key) => {
        expect(stageOrder).toContain(key)
      })
    })
  })

  describe('agent assignments', () => {
    it('should assign HArchitect to IR/scenario/useCase/functional stages', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stages.IRAnalysis.agent).toBe('HArchitect')
      expect(workflow.stages.scenarioAnalysis.agent).toBe('HArchitect')
      expect(workflow.stages.useCaseAnalysis.agent).toBe('HArchitect')
      expect(workflow.stages.functionalRefinement.agent).toBe('HArchitect')
    })

    it('should assign HEngineer to decomposition/design stages', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stages.requirementDecomposition.agent).toBe('HEngineer')
      expect(workflow.stages.systemFunctionalDesign.agent).toBe('HEngineer')
      expect(workflow.stages.moduleFunctionalDesign.agent).toBe('HEngineer')
      expect(workflow.stages.sddPlanGeneration.agent).toBe('HEngineer')
    })
  })

  describe('prompt bindings', () => {
    it('should have workflow overview bindings', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.promptBindings?.[WORKFLOW_OVERVIEW_PROMPT_TOKEN]).toContain('工作流各阶段概览')
    })

    it('should use correct stage prompt binding file names', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stages.IRAnalysis.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]).toContain('Current Phase: Initial Requirements Analysis')
      expect(workflow.stages.scenarioAnalysis.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]).toContain('## 当前阶段：场景分析')
      expect(workflow.stages.useCaseAnalysis.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]).toContain('## 当前阶段：用例分析')
      expect(workflow.stages.functionalRefinement.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]).toContain('## 当前阶段：功能细化')
      expect(workflow.stages.requirementDecomposition.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]).toContain('## 当前阶段：需求分解')
      expect(workflow.stages.systemFunctionalDesign.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]).toContain('## 当前阶段：系统功能设计')
      expect(workflow.stages.moduleFunctionalDesign.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]).toContain('## 当前阶段：模块功能设计')
      expect(workflow.stages.sddPlanGeneration.promptBindings?.[WORKFLOW_STEP_PROMPT_TOKEN]).toContain('## 当前阶段：SDD 开发计划生成')
    })

    it('should load prompt content for each stage', () => {
      const workflow = getClassicWorkflow()
      getStageOrder(workflow).forEach((stageName) => {
        const prompt = loadPromptForStage(stageName, workflow)
        expect(prompt).toBeTruthy()
        expect(prompt.length).toBeGreaterThan(0)
      })
    })
  })

  describe('handover prompts', () => {
    it('should generate handover prompts for all stages', () => {
      const workflow = getClassicWorkflow()
      getStageOrder(workflow).forEach((stageName) => {
        const stage = workflow.stages[stageName]
        const prompt = stage.getHandoverPrompt(null, stage.name)
        expect(prompt).toBeTruthy()
        expect(typeof prompt).toBe('string')
        expect(prompt.length).toBeGreaterThan(0)
      })
    })

    it('should include current step display name in prompt when provided', () => {
      const workflow = getClassicWorkflow()
      // 直接调用时传入显示名称（实际运行时由 handover.ts 将 key 转换为 name）
      const promptWithCurrent = workflow.stages.IRAnalysis.getHandoverPrompt('Previous Stage', workflow.stages.IRAnalysis.name)
      expect(promptWithCurrent).toContain('PREVIOUS STAGE')
    })

    it('should include stage display name in prompt', () => {
      const workflow = getClassicWorkflow()
      const stage = workflow.stages.IRAnalysis
      const prompt = stage.getHandoverPrompt(null, stage.name)
      expect(prompt.length).toBeGreaterThan(0)
      expect(prompt).toContain(stage.name.toUpperCase())
    })

    it('should generate different prompts for different stages', () => {
      const workflow = getClassicWorkflow()
      const prompt1 = workflow.stages.IRAnalysis.getHandoverPrompt(null, workflow.stages.IRAnalysis.name)
      const prompt2 = workflow.stages.scenarioAnalysis.getHandoverPrompt(null, workflow.stages.scenarioAnalysis.name)
      expect(prompt1).not.toBe(prompt2)
    })

    it('should include [ PHASE: header in prompt', () => {
      const workflow = getClassicWorkflow()
      const stage = workflow.stages.IRAnalysis
      const prompt = stage.getHandoverPrompt(null, stage.name)
      expect(prompt).toContain('[ PHASE:')
    })

    it('should show transition arrow when current stage provided', () => {
      const workflow = getClassicWorkflow()
      const stage = workflow.stages.scenarioAnalysis
      const prompt = stage.getHandoverPrompt('Initial Requirement Analysis', stage.name)
      expect(prompt).toMatch(/→/)
      expect(prompt.length).toBeGreaterThan(50)
    })

    it('should use "Workflow switched to" when no current stage', () => {
      const workflow = getClassicWorkflow()
      const stage = workflow.stages.IRAnalysis
      const prompt = stage.getHandoverPrompt(null, stage.name)
      expect(prompt).toContain(stage.name.toUpperCase())
    })

    it('should include Single-Stage Processing Pipeline instruction', () => {
      const workflow = getClassicWorkflow()
      const stage = workflow.stages.IRAnalysis
      const prompt = stage.getHandoverPrompt(null, stage.name)
      expect(prompt).toMatch(/pipeline/i)
    })
  })

  describe('stage properties', () => {
    it('should have name for all stages', () => {
      const workflow = getClassicWorkflow()
      getStageOrder(workflow).forEach((stageName) => {
        expect(workflow.stages[stageName].name).toBeTruthy()
        expect(typeof workflow.stages[stageName].name).toBe('string')
      })
    })

    it('should have description for all stages', () => {
      const workflow = getClassicWorkflow()
      getStageOrder(workflow).forEach((stageName) => {
        expect(workflow.stages[stageName].description).toBeTruthy()
        expect(typeof workflow.stages[stageName].description).toBe('string')
      })
    })
  })

  describe('registry integration', () => {
    it('should be registered in workflow registry', () => {
      const available = getAvailableWorkflows()
      expect(available).toContain('classic')
    })

    it('should be retrievable via getWorkflowDefinition', () => {
      const workflow = getClassicWorkflow()
      expect(workflow).toBeDefined()
      expect(workflow.id).toBe('classic')
    })

    it('should be the same instance as exported constant', () => {
      const workflow = getClassicWorkflow()
      expect(workflow).toBe(classicWorkflow)
    })
  })
})
