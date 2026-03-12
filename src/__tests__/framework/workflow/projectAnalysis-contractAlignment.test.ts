import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()

function readRepoFile(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf-8')
}

describe('projectAnalysis contract alignment', () => {
  it('uses manifest.json as the canonical project manifest name across docs and prompts', () => {
    const sharedConcepts = readRepoFile(
      'src/skills/hyper-designer/project-analysis-concepts/SKILL.md',
    )
    const artifactContract = readRepoFile(
      'src/skills/hyper-designer/project-analysis-concepts/references/artifact-contract.md',
    )
    const workflowPrompt = readRepoFile(
      'src/workflows/plugins/projectAnalysis/prompts/workflow.md',
    )

    expect(sharedConcepts).toContain('manifest.json')
    expect(sharedConcepts).not.toContain('project-manifest.json')

    expect(artifactContract).toContain('manifest.json')
    expect(artifactContract).not.toContain('project-manifest.json')

    expect(workflowPrompt).toContain('.hyper-designer/projectAnalysis/_meta/manifest.json')
  })

  it('uses missedAPIs and brokenReferences as the canonical coverage category keys', () => {
    const artifactContract = readRepoFile(
      'src/skills/hyper-designer/project-analysis-concepts/references/artifact-contract.md',
    )
    const missingCoveragePrompt = readRepoFile(
      'src/workflows/plugins/projectAnalysis/prompts/missingCoverageCheck.md',
    )

    expect(artifactContract).toContain('"missedAPIs"')
    expect(artifactContract).toContain('"brokenReferences"')
    expect(artifactContract).not.toContain('"missingAPIs"')
    expect(artifactContract).not.toContain('"brokenCrossReferences"')

    expect(missingCoveragePrompt).toContain('"missedAPIs"')
    expect(missingCoveragePrompt).toContain('"brokenReferences"')
  })

  it('documents workflow artifacts under the canonical .hyper-designer/projectAnalysis root', () => {
    const workflowPrompt = readRepoFile(
      'src/workflows/plugins/projectAnalysis/prompts/workflow.md',
    )
    const systemAnalysisPrompt = readRepoFile(
      'src/workflows/plugins/projectAnalysis/prompts/systemAnalysis.md',
    )

    expect(workflowPrompt).toContain('.hyper-designer/projectAnalysis/architecture.md')
    expect(workflowPrompt).toContain('.hyper-designer/projectAnalysis/component/{componentSlug}.md')
    expect(workflowPrompt).toContain('.hyper-designer/projectAnalysis/coverage-report.md')

    expect(systemAnalysisPrompt).toContain('.hyper-designer/projectAnalysis/_meta/manifest.json')
    expect(systemAnalysisPrompt).toContain('.hyper-designer/projectAnalysis/_meta/system-analysis.json')
    expect(systemAnalysisPrompt).toContain('.hyper-designer/projectAnalysis/_meta/component-manifest.json')
    expect(systemAnalysisPrompt).toContain('.hyper-designer/projectAnalysis/_meta/api-manifest.json')
    expect(systemAnalysisPrompt).toContain('.hyper-designer/projectAnalysis/_meta/source-inventory.json')
  })

  it('uses manifest.json incremental-update examples with current canonical manifest fields', () => {
    const updateReminders = readRepoFile(
      'src/skills/hyper-designer/project-analysis-concepts/references/update-reminders.md',
    )

    expect(updateReminders).toContain('// In manifest.json')
    expect(updateReminders).toContain('"updatedAt"')
    expect(updateReminders).not.toContain('project-manifest.json')
    expect(updateReminders).not.toContain('"analyzedAt"')
  })

  it('uses componentSlug consistently for shared artifact placeholders and schemas', () => {
    const artifactContract = readRepoFile(
      'src/skills/hyper-designer/project-analysis-concepts/references/artifact-contract.md',
    )
    const mermaidConventions = readRepoFile(
      'src/skills/hyper-designer/project-analysis-concepts/references/mermaid-conventions.md',
    )

    expect(artifactContract).toContain('component/{componentSlug}.md')
    expect(artifactContract).toContain('_meta/components/{componentSlug}.json')
    expect(artifactContract).toContain('"componentSlug": "string"')
    expect(artifactContract).not.toContain('component/{slug}.md')
    expect(artifactContract).not.toContain('components/{slug}.json')
    expect(artifactContract).not.toContain('"slug": "string"')

    expect(mermaidConventions).toContain('component/{componentSlug}.md')
    expect(mermaidConventions).not.toContain('component/{slug}.md')
  })
})
