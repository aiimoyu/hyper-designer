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
  it('each stage prompt guides to projectAnalysis skill and stage reference markdown', () => {
    const workflow = getProjectAnalysisWorkflow()

    const systemPrompt = loadPromptForStage('systemAnalysis', workflow)
    const componentPrompt = loadPromptForStage('componentAnalysis', workflow)
    const missingPrompt = loadPromptForStage('missingCoverageCheck', workflow)

    expect(systemPrompt).toContain('projectAnalysis')
    expect(systemPrompt).toContain('references/systemAnalysis.md')

    expect(componentPrompt).toContain('projectAnalysis')
    expect(componentPrompt).toContain('references/componentAnalysis.md')

    expect(missingPrompt).toContain('projectAnalysis')
    expect(missingPrompt).toContain('references/missingCoverageCheck.md')
  })

  it('projectAnalysis skill exists with relative-path references only', () => {
    const skillPath = resolve(SKILL_BASE_PATH, 'SKILL.md')
    const systemRefPath = resolve(SKILL_BASE_PATH, 'references/systemAnalysis.md')
    const componentRefPath = resolve(SKILL_BASE_PATH, 'references/componentAnalysis.md')
    const missingRefPath = resolve(SKILL_BASE_PATH, 'references/missingCoverageCheck.md')

    expect(existsSync(skillPath)).toBe(true)
    expect(existsSync(systemRefPath)).toBe(true)
    expect(existsSync(componentRefPath)).toBe(true)
    expect(existsSync(missingRefPath)).toBe(true)

    const skillContent = readFileSync(skillPath, 'utf-8')
    expect(skillContent).not.toMatch(/\/home\//)
    expect(skillContent).not.toMatch(/[A-Za-z]:\\/)
    expect(skillContent).toContain('references/systemAnalysis.md')
    expect(skillContent).toContain('references/componentAnalysis.md')
    expect(skillContent).toContain('references/missingCoverageCheck.md')
  })

  it('references files contain migrated methodology and output templates', () => {
    const systemRefPath = resolve(SKILL_BASE_PATH, 'references/systemAnalysis.md')
    const componentRefPath = resolve(SKILL_BASE_PATH, 'references/componentAnalysis.md')
    const missingRefPath = resolve(SKILL_BASE_PATH, 'references/missingCoverageCheck.md')

    const systemContent = readFileSync(systemRefPath, 'utf-8')
    const componentContent = readFileSync(componentRefPath, 'utf-8')
    const missingContent = readFileSync(missingRefPath, 'utf-8')

    expect(systemContent).toContain('5 个架构维度')
    expect(systemContent).toContain('architecture.md')
    expect(systemContent).toContain('components-manifest.md')
    expect(systemContent).toContain('api-catalog.md')
    expect(systemContent).toContain('source-overview.md')

    expect(componentContent).toContain('4 个组件维度')
    expect(componentContent).toContain('components/{componentSlug}.md')
    expect(componentContent).toContain('component-analysis-summary.md')
    expect(componentContent).toContain('IOP')

    expect(missingContent).toContain('7 个严格的覆盖率类别')
    expect(missingContent).toContain('coverage-report.md')
    expect(missingContent).toContain('PASSED')
    expect(missingContent).toContain('WARNING')
    expect(missingContent).toContain('FAILED')
  })

  it('skill provides shared workflow methodology reference', () => {
    const skillPath = resolve(SKILL_BASE_PATH, 'SKILL.md')
    const sharedRefPath = resolve(SKILL_BASE_PATH, 'references/workflowShared.md')

    expect(existsSync(sharedRefPath)).toBe(true)

    const skillContent = readFileSync(skillPath, 'utf-8')
    const sharedContent = readFileSync(sharedRefPath, 'utf-8')

    expect(skillContent).toContain('references/workflowShared.md')
    expect(sharedContent).toContain('术语表')
    expect(sharedContent).toContain('Mermaid 图表约定')
    expect(sharedContent).toContain('代码引用规则')
  })
})
