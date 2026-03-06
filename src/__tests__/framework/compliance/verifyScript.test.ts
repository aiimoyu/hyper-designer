import { describe, expect, it } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { withTempDir } from '../../helpers/tempDir'
import { runVerification } from '../../../../verify.js'
const logger = {
  error() {},
  info() {},
  plain() {},
  success() {},
  warning() {},
}

function writeJsonFile(filePath: string, value: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function writeTextFile(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content)
}

function createDummyPackage(rootDir: string, packageName: string): void {
  writeJsonFile(join(rootDir, 'node_modules', packageName, 'package.json'), {
    name: packageName,
    version: '1.0.0',
    type: 'module',
  })
}

function createMinimalProject(rootDir: string, packageJson?: Record<string, unknown>): void {
  writeJsonFile(join(rootDir, 'package.json'), {
    name: 'verify-fixture',
    version: '1.0.0',
    type: 'module',
    ...packageJson,
  })
  createDummyPackage(rootDir, 'fixture-installed-package')
  writeTextFile(
    join(rootDir, 'opencode', '.plugins', 'hyper-designer.ts'),
    'export const HyperDesignerPlugin = async () => ({})\n',
  )
  writeTextFile(
    join(rootDir, 'src', 'skills', 'hyper-designer', 'demo-skill', 'SKILL.md'),
    '# Demo skill\n',
  )
}

describe('verify.js', () => {
  it('fails when a declared dependency has not been installed', async () => {
    await withTempDir('verify-missing-dependency', async tempDir => {
      const rootDir = join(tempDir, 'hyper-designer')
      createMinimalProject(rootDir, {
        dependencies: {
          'missing-package': '^1.0.0',
        },
      })

      const result = runVerification({
        logger,
        rootDir,
      })

      expect(result.allPassed).toBe(false)
      expect(result.checks.declaredDependencies).toBe(false)
      expect(result.details.missingRequiredDependencies).toContain('missing-package')
    })
  })

  it('fails when source files import an undeclared package', async () => {
    await withTempDir('verify-undeclared-import', async tempDir => {
      const rootDir = join(tempDir, 'hyper-designer')
      createMinimalProject(rootDir)
      writeTextFile(
        join(rootDir, 'src', 'index.ts'),
        "import leftPad from 'left-pad'\n\nexport const value = leftPad('x', 2)\n",
      )

      const result = runVerification({
        logger,
        rootDir,
      })

      expect(result.allPassed).toBe(false)
      expect(result.checks.directImports).toBe(false)
      expect(result.details.undeclaredDirectImports).toEqual([
        {
          files: [join(rootDir, 'src', 'index.ts')],
          packageName: 'left-pad',
        },
      ])
    })
  })

  it('fails when the plugin entry file is missing', async () => {
    await withTempDir('verify-missing-plugin-file', async tempDir => {
      const rootDir = join(tempDir, 'hyper-designer')
      createMinimalProject(rootDir)
      rmSync(join(rootDir, 'opencode', '.plugins', 'hyper-designer.ts'))

      const result = runVerification({
        logger,
        rootDir,
      })

      expect(result.allPassed).toBe(false)
      expect(result.checks.sourceFiles).toBe(false)
    })
  })
})
