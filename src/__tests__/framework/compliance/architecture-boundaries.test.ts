import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC_DIR = join(__dirname, '..', '..', '..')

describe('architecture boundaries', () => {
  it('platformBridge barrel does not export opencode-only orchestration APIs', () => {
    const content = readFileSync(join(SRC_DIR, 'platformBridge', 'index.ts'), 'utf-8')

    expect(content).not.toContain('createOpenCodePlatformOrchestrator')
    expect(content).not.toContain('mapLocalAgentsToOpenCode')
    expect(content).not.toContain('buildOpenCodeMappedAgents')
    expect(content).not.toContain('buildOpenCodeTools')
    expect(content).not.toContain('convertWorkflowToolsToOpenCode')
    expect(content).not.toContain('createOpenCodeAgentTransformer')
    expect(content).not.toContain('createOpenCodeUsingHyperDesignerTransformer')
  })

  it('workflows core no longer keeps dedicated tool registry module', () => {
    const toolRegistryPath = join(SRC_DIR, 'workflows', 'core', 'toolRegistry.ts')
    expect(existsSync(toolRegistryPath)).toBe(false)

    const workflowsIndexContent = readFileSync(join(SRC_DIR, 'workflows', 'index.ts'), 'utf-8')
    expect(workflowsIndexContent).not.toContain('toolRegistry')
    expect(workflowsIndexContent).not.toContain('ToolRegistry')
  })

  it('tool contracts live under src/tools, not workflows', () => {
    const workflowToolTypesPath = join(SRC_DIR, 'workflows', 'core', 'toolTypes.ts')
    const toolsTypesPath = join(SRC_DIR, 'tools', 'types.ts')

    expect(existsSync(workflowToolTypesPath)).toBe(false)
    expect(existsSync(toolsTypesPath)).toBe(true)

    const workflowsIndexContent = readFileSync(join(SRC_DIR, 'workflows', 'index.ts'), 'utf-8')
    expect(workflowsIndexContent).not.toContain("'./core/toolTypes'")
    expect(workflowsIndexContent).toContain("'../tools/types'")
  })

  it('builtin tools only consume shared runtime via sdk', () => {
    const hdCoreToolsContent = readFileSync(join(SRC_DIR, 'builtin', 'tools', 'hdCoreTools.ts'), 'utf-8')
    const docReviewDefsContent = readFileSync(join(SRC_DIR, 'builtin', 'tools', 'documentReview', 'toolDefinitions.ts'), 'utf-8')
    const prepareReviewContent = readFileSync(join(SRC_DIR, 'builtin', 'tools', 'documentReview', 'prepareReview.ts'), 'utf-8')
    const finalizeReviewContent = readFileSync(join(SRC_DIR, 'builtin', 'tools', 'documentReview', 'finalizeReview.ts'), 'utf-8')

    expect(hdCoreToolsContent).toContain("from '../../types'")
    expect(hdCoreToolsContent).not.toContain("from '../../tools/types'")
    expect(hdCoreToolsContent).not.toContain("from '../../workflows/service/WorkflowService'")

    expect(docReviewDefsContent).toContain("from '../../../types'")
    expect(docReviewDefsContent).not.toContain("from '../../../tools/types'")
    expect(docReviewDefsContent).not.toContain("from '../../../utils/logger'")
    expect(docReviewDefsContent).not.toContain("from '../../../workflows/service/WorkflowService'")

    expect(prepareReviewContent).toContain("from '../../../sdk'")
    expect(prepareReviewContent).not.toContain("from '../../../utils/logger'")

    expect(finalizeReviewContent).toContain("from '../../../sdk'")
    expect(finalizeReviewContent).not.toContain("from '../../../utils/logger'")
  })
})
