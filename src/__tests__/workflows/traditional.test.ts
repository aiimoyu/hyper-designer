import { describe, it, expect } from 'vitest'
import { getWorkflowDefinition, getAvailableWorkflows } from '../../workflows/core/registry'
import { classicWorkflow } from '../../workflows/plugins/classic'
import type { WorkflowDefinition } from '../../workflows/core/types'

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
      expect(workflow.stageOrder).toHaveLength(8)
    })

    it('should start with dataCollection', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stageOrder[0]).toBe('dataCollection')
    })

    it('should end with moduleFunctionalDesign', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stageOrder[7]).toBe('moduleFunctionalDesign')
    })

    it('should have correct order', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stageOrder).toEqual([
        'dataCollection',
        'IRAnalysis',
        'scenarioAnalysis',
        'useCaseAnalysis',
        'functionalRefinement',
        'requirementDecomposition',
        'systemFunctionalDesign',
        'moduleFunctionalDesign',
      ])
    })
  })

  describe('stage definitions', () => {
    it('should have stage definitions for all stages in stageOrder', () => {
      const workflow = getClassicWorkflow()
      workflow.stageOrder.forEach((stageName) => {
        expect(workflow.stages[stageName]).toBeDefined()
      })
    })

    it('should have no extra stages', () => {
      const workflow = getClassicWorkflow()
      const stageKeys = Object.keys(workflow.stages)
      expect(stageKeys).toHaveLength(workflow.stageOrder.length)
      stageKeys.forEach((key) => {
        expect(workflow.stageOrder).toContain(key)
      })
    })
  })

  describe('agent assignments', () => {
    it('should assign HCollector to dataCollection', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stages.dataCollection.agent).toBe('HCollector')
    })

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
    })
  })

  describe('skill assignments', () => {
    it('should not assign skill to dataCollection', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stages.dataCollection.skill).toBeUndefined()
    })

    it('should assign correct skills to analysis stages', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stages.IRAnalysis.skill).toBe('ir-analysis')
      expect(workflow.stages.scenarioAnalysis.skill).toBe('scenario-analysis')
      expect(workflow.stages.useCaseAnalysis.skill).toBe('use-case-analysis')
      expect(workflow.stages.functionalRefinement.skill).toBe('functional-refinement')
    })

    it('should assign correct skills to decomposition/design stages', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stages.requirementDecomposition.skill).toBe('sr-ar-decomposition')
      expect(workflow.stages.systemFunctionalDesign.skill).toBe('functional-design')
      expect(workflow.stages.moduleFunctionalDesign.skill).toBe('functional-design')
    })
  })

  describe('prompt files', () => {
    it('should have promptFile for all stages', () => {
      const workflow = getClassicWorkflow()
      workflow.stageOrder.forEach((stageName) => {
        expect(workflow.stages[stageName].promptFile).toBeTruthy()
        expect(workflow.stages[stageName].promptFile).toMatch(/^prompts\/.*\.md$/)
      })
    })

    it('should use correct prompt file names', () => {
      const workflow = getClassicWorkflow()
      expect(workflow.stages.dataCollection.promptFile).toBe('prompts/dataCollection.md')
      expect(workflow.stages.IRAnalysis.promptFile).toBe('prompts/IRAnalysis.md')
      expect(workflow.stages.scenarioAnalysis.promptFile).toBe('prompts/scenarioAnalysis.md')
      expect(workflow.stages.useCaseAnalysis.promptFile).toBe('prompts/useCaseAnalysis.md')
      expect(workflow.stages.functionalRefinement.promptFile).toBe('prompts/functionalRefinement.md')
      expect(workflow.stages.requirementDecomposition.promptFile).toBe('prompts/requirementDecomposition.md')
      expect(workflow.stages.systemFunctionalDesign.promptFile).toBe('prompts/systemFunctionalDesign.md')
      expect(workflow.stages.moduleFunctionalDesign.promptFile).toBe('prompts/moduleFunctionalDesign.md')
    })
  })

  describe('handover prompts', () => {
    it('should generate handover prompts for all stages', () => {
      const workflow = getClassicWorkflow()
      workflow.stageOrder.forEach((stageName) => {
        const prompt = workflow.stages[stageName].getHandoverPrompt(null)
        expect(prompt).toBeTruthy()
        expect(typeof prompt).toBe('string')
        expect(prompt.length).toBeGreaterThan(0)
      })
    })

    it('should include current step in prompt when provided', () => {
      const workflow = getClassicWorkflow()
      const promptWithCurrent = workflow.stages.dataCollection.getHandoverPrompt('previousStep')
      expect(promptWithCurrent).toContain('previousStep')
    })

    it('should include next step name in prompt', () => {
      const workflow = getClassicWorkflow()
      const prompt = workflow.stages.IRAnalysis.getHandoverPrompt(null)
      expect(prompt.length).toBeGreaterThan(0)
      expect(prompt).toContain('Initial Requirement Analysis')
    })

    it('should generate different prompts for different stages', () => {
      const workflow = getClassicWorkflow()
      const prompt1 = workflow.stages.dataCollection.getHandoverPrompt(null)
      const prompt2 = workflow.stages.IRAnalysis.getHandoverPrompt(null)
      expect(prompt1).not.toBe(prompt2)
    })
  })

  describe('stage properties', () => {
    it('should have name for all stages', () => {
      const workflow = getClassicWorkflow()
      workflow.stageOrder.forEach((stageName) => {
        expect(workflow.stages[stageName].name).toBeTruthy()
        expect(typeof workflow.stages[stageName].name).toBe('string')
      })
    })

    it('should have description for all stages', () => {
      const workflow = getClassicWorkflow()
      workflow.stageOrder.forEach((stageName) => {
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
