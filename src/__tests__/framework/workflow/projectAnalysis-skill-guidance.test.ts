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

const SKILL_BASE_PATH = resolve(process.cwd(), 'src/skills/hyper-designer/projectAnalysis')

describe('projectAnalysis workflow skill guidance', () => {
  it('each stage prompt references the skill', () => {
    const workflow = getProjectAnalysisWorkflow()

    const systemPrompt = loadPromptForStage('systemAnalysis', workflow)
    const componentPrompt = loadPromptForStage('componentAnalysis', workflow)
    const missingPrompt = loadPromptForStage('missingCoverageCheck', workflow)

    expect(systemPrompt).toContain('projectAnalysis')
    expect(componentPrompt).toContain('projectAnalysis')
    expect(missingPrompt).toContain('projectAnalysis')
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
    const systemRefPath = resolve(SKILL_BASE_PATH, 'references/systemAnalysis.md')
    const componentRefPath = resolve(SKILL_BASE_PATH, 'references/componentAnalysis.md')
    const missingRefPath = resolve(SKILL_BASE_PATH, 'references/missingCoverageCheck.md')

    expect(existsSync(systemRefPath)).toBe(true)
    expect(existsSync(componentRefPath)).toBe(true)
    expect(existsSync(missingRefPath)).toBe(true)

    const systemContent = readFileSync(systemRefPath, 'utf-8')
    const componentContent = readFileSync(componentRefPath, 'utf-8')
    const missingContent = readFileSync(missingRefPath, 'utf-8')

    expect(systemContent.length).toBeGreaterThan(100)
    expect(componentContent.length).toBeGreaterThan(100)
    expect(missingContent.length).toBeGreaterThan(100)
  })

  it('skill provides shared workflow methodology reference', () => {
    const sharedRefPath = resolve(SKILL_BASE_PATH, 'references/workflowShared.md')

    expect(existsSync(sharedRefPath)).toBe(true)

    const sharedContent = readFileSync(sharedRefPath, 'utf-8')
    expect(sharedContent.length).toBeGreaterThan(0)
  })
})
