import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

import { describe, expect, it } from 'vitest'

import { getWorkflowDefinition, loadPromptForStage } from '../../../workflows'

function getProjectAnalysisWorkflow() {
  const workflow = getWorkflowDefinition('projectAnalysis')
  if (!workflow) {
    throw new Error('projectAnalysis workflow should be registered')
  }
  return workflow
}

const SKILL_BASE_PATH = resolve(process.cwd(), 'src/builtin/skills/projectAnalysis')

describe('projectAnalysis workflow skill guidance', () => {
  it('each stage prompt references the skill', () => {
    const workflow = getProjectAnalysisWorkflow()

    const projectOverviewPrompt = loadPromptForStage('projectOverview', workflow)
    const functionTreePrompt = loadPromptForStage('functionTreeAndModule', workflow)
    const interfacePrompt = loadPromptForStage('interfaceAndDataFlow', workflow)
    const defectCheckPrompt = loadPromptForStage('defectCheckAndPatch', workflow)

    expect(projectOverviewPrompt).toContain('projectAnalysis')
    expect(functionTreePrompt).toContain('projectAnalysis')
    expect(interfacePrompt).toContain('projectAnalysis')
    expect(defectCheckPrompt).toContain('projectAnalysis')
  })

  it('projectAnalysis skill exists with reference files', () => {
    const skillPath = resolve(SKILL_BASE_PATH, 'SKILL.md')
    expect(existsSync(skillPath)).toBe(true)

    const skillContent = readFileSync(skillPath, 'utf-8')
    expect(skillContent.length).toBeGreaterThan(0)
  })

  it('skill references use relative paths, not absolute paths', () => {
    const skillPath = resolve(SKILL_BASE_PATH, 'SKILL.md')
    const skillContent = readFileSync(skillPath, 'utf-8')
    
    expect(skillContent).not.toMatch(/\/home\//)
    expect(skillContent).not.toMatch(/[A-Za-z]:\\/)
  })

  it('references files exist and contain methodology content', () => {
    const projectOverviewRefPath = resolve(SKILL_BASE_PATH, 'references/projectOverview.md')
    const functionTreeRefPath = resolve(SKILL_BASE_PATH, 'references/functionTreeAndModule.md')
    const interfaceRefPath = resolve(SKILL_BASE_PATH, 'references/interfaceAndDataFlow.md')
    const defectCheckRefPath = resolve(SKILL_BASE_PATH, 'references/defectCheckAndPatch.md')

    expect(existsSync(projectOverviewRefPath)).toBe(true)
    expect(existsSync(functionTreeRefPath)).toBe(true)
    expect(existsSync(interfaceRefPath)).toBe(true)
    expect(existsSync(defectCheckRefPath)).toBe(true)

    const projectOverviewContent = readFileSync(projectOverviewRefPath, 'utf-8')
    const functionTreeContent = readFileSync(functionTreeRefPath, 'utf-8')
    const interfaceContent = readFileSync(interfaceRefPath, 'utf-8')
    const defectCheckContent = readFileSync(defectCheckRefPath, 'utf-8')

    expect(projectOverviewContent.length).toBeGreaterThan(100)
    expect(functionTreeContent.length).toBeGreaterThan(100)
    expect(interfaceContent.length).toBeGreaterThan(100)
    expect(defectCheckContent.length).toBeGreaterThan(100)
  })

  it('skill provides shared workflow methodology reference', () => {
    const sharedRefPath = resolve(SKILL_BASE_PATH, 'references/workflowShared.md')

    expect(existsSync(sharedRefPath)).toBe(true)

    const sharedContent = readFileSync(sharedRefPath, 'utf-8')
    expect(sharedContent.length).toBeGreaterThan(0)
  })
})
