#!/usr/bin/env node

/**
 * Lightweight verification script for hyper-designer installation.
 * 快速验证安装是否成功，同时检查依赖声明与 OpenCode 安装落地是否一致。
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { builtinModules } from 'module'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))
const IMPORT_SCAN_DIRS = ['src', 'opencode']
const SOURCE_FILE_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']
const BUILTIN_MODULES = new Set([
  ...builtinModules,
  ...builtinModules.map(moduleName => `node:${moduleName}`),
])

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function createConsoleLogger() {
  return {
    info(message) {
      log(`INFO ${message}`, colors.blue)
    },
    success(message) {
      log(`SUCCESS ${message}`, colors.green)
    },
    warning(message) {
      log(`WARN ${message}`, colors.yellow)
    },
    error(message) {
      log(`ERROR ${message}`, colors.red)
    },
    plain(message) {
      log(message)
    },
  }
}

export function resolveVerificationContext(options = {}) {
  const rootDir = resolve(options.rootDir ?? process.env.HD_VERIFY_ROOT_DIR ?? CURRENT_DIR)

  return {
    rootDir,
    packageJsonPath: join(rootDir, 'package.json'),
    nodeModulesDir: join(rootDir, 'node_modules'),
    sourcePluginFile: join(rootDir, 'opencode', '.plugins', 'hyper-designer.ts'),
    skillsDir: join(rootDir, 'src', 'skills', 'hyper-designer'),
  }
}

function readPackageJson(packageJsonPath) {
  if (!existsSync(packageJsonPath)) {
    throw new Error(`package.json not found: ${packageJsonPath}`)
  }

  return JSON.parse(readFileSync(packageJsonPath, 'utf8'))
}

function getDeclaredPackageSections(packageJson) {
  return {
    dependencies: Object.keys(packageJson.dependencies ?? {}),
    devDependencies: Object.keys(packageJson.devDependencies ?? {}),
    optionalDependencies: Object.keys(packageJson.optionalDependencies ?? {}),
    peerDependencies: Object.keys(packageJson.peerDependencies ?? {}),
  }
}

function getAllDeclaredPackages(packageJson) {
  const sections = getDeclaredPackageSections(packageJson)
  return new Set([
    ...sections.dependencies,
    ...sections.devDependencies,
    ...sections.optionalDependencies,
    ...sections.peerDependencies,
  ])
}

function getInstalledPackageDir(rootDir, packageName) {
  return join(rootDir, 'node_modules', ...packageName.split('/'))
}

function isPackageInstalled(rootDir, packageName) {
  return existsSync(getInstalledPackageDir(rootDir, packageName))
}

function checkNodeModules(context, logger) {
  logger.info('Checking node_modules...')

  if (!existsSync(context.nodeModulesDir)) {
    logger.error(`node_modules directory not found: ${context.nodeModulesDir}`)
    return false
  }

  const items = readdirSync(context.nodeModulesDir)
  if (items.length === 0) {
    logger.error('node_modules is empty')
    return false
  }

  logger.success(`node_modules has ${items.length} entries`)
  return true
}

function checkDeclaredDependencies(context, packageJson, logger, details) {
  logger.info('Checking declared dependencies...')

  const sections = getDeclaredPackageSections(packageJson)
  const requiredPackages = [
    ...sections.dependencies,
    ...sections.devDependencies,
    ...sections.peerDependencies,
  ]
  details.missingRequiredDependencies = requiredPackages.filter(
    packageName => !isPackageInstalled(context.rootDir, packageName),
  )
  details.missingOptionalDependencies = sections.optionalDependencies.filter(
    packageName => !isPackageInstalled(context.rootDir, packageName),
  )

  if (requiredPackages.length === 0) {
    logger.success('No required packages declared in package.json')
  } else if (details.missingRequiredDependencies.length === 0) {
    logger.success(`Resolved ${requiredPackages.length}/${requiredPackages.length} required packages`)
  } else {
    logger.error(`Missing declared dependencies (${details.missingRequiredDependencies.length})`)
    details.missingRequiredDependencies.forEach(packageName => logger.plain(`  - ${packageName}`))
  }

  if (sections.optionalDependencies.length > 0) {
    if (details.missingOptionalDependencies.length === 0) {
      logger.success(`Resolved ${sections.optionalDependencies.length}/${sections.optionalDependencies.length} optional packages`)
    } else {
      logger.warning(`Missing optional dependencies (${details.missingOptionalDependencies.length})`)
      details.missingOptionalDependencies.forEach(packageName => logger.plain(`  - ${packageName}`))
    }
  }

  return details.missingRequiredDependencies.length === 0
}

function checkFiles(context, logger) {
  logger.info('Checking source files...')

  const checks = [
    { name: 'Plugin entry file', path: context.sourcePluginFile },
    { name: 'Skills directory', path: context.skillsDir },
    { name: 'package.json', path: context.packageJsonPath },
  ]
  let allExist = true

  for (const check of checks) {
    if (existsSync(check.path)) {
      logger.success(`${check.name} exists`)
    } else {
      logger.error(`${check.name} not found: ${check.path}`)
      allExist = false
    }
  }

  return allExist
}

function checkSkills(context, logger, details) {
  logger.info('Checking skills...')

  if (!existsSync(context.skillsDir)) {
    logger.error('Skills directory not found')
    return false
  }

  const skills = readdirSync(context.skillsDir).filter(item => {
    const itemPath = join(context.skillsDir, item)
    return statSync(itemPath).isDirectory()
  })

  if (skills.length === 0) {
    logger.error('No skills found')
    return false
  }

  details.skills = skills
  details.missingSkillMd = skills.filter(skill => !existsSync(join(context.skillsDir, skill, 'SKILL.md')))

  if (details.missingSkillMd.length > 0) {
    logger.error(`Skills missing SKILL.md (${details.missingSkillMd.length})`)
    details.missingSkillMd.forEach(skill => logger.plain(`  - ${skill}`))
    return false
  }

  logger.success(`Found ${skills.length} skills with SKILL.md`)
  skills.forEach(skill => logger.plain(`  - ${skill}`))
  return true
}

function shouldScanFile(fileName) {
  return SOURCE_FILE_EXTENSIONS.some(extension => fileName.endsWith(extension))
}

function collectSourceFiles(dirPath) {
  if (!existsSync(dirPath)) {
    return []
  }

  const entries = readdirSync(dirPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') {
        continue
      }
      files.push(...collectSourceFiles(fullPath))
      continue
    }

    if (entry.isFile() && shouldScanFile(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function getPackageNameFromSpecifier(specifier) {
  if (
    !specifier ||
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('node:')
  ) {
    return null
  }

  if (BUILTIN_MODULES.has(specifier)) {
    return null
  }

  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/')
    return scope && name ? `${scope}/${name}` : specifier
  }

  return specifier.split('/')[0] ?? null
}

function collectDirectPackageImports(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const packages = new Set()
  const importPattern =
    /(?:import|export)\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g

  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2] ?? match[3] ?? match[4]
    const packageName = getPackageNameFromSpecifier(specifier)
    if (packageName) {
      packages.add(packageName)
    }
  }

  return [...packages]
}

function checkDirectImports(context, packageJson, logger, details) {
  logger.info('Checking direct package imports...')

  const declaredPackages = getAllDeclaredPackages(packageJson)
  const importedPackages = new Map()

  for (const relativeDir of IMPORT_SCAN_DIRS) {
    const dirPath = join(context.rootDir, relativeDir)
    const files = collectSourceFiles(dirPath)

    for (const filePath of files) {
      for (const packageName of collectDirectPackageImports(filePath)) {
        const fileList = importedPackages.get(packageName) ?? []
        fileList.push(filePath)
        importedPackages.set(packageName, fileList)
      }
    }
  }

  details.undeclaredDirectImports = [...importedPackages.entries()]
    .filter(([packageName]) => !declaredPackages.has(packageName))
    .map(([packageName, files]) => ({ packageName, files }))

  if (details.undeclaredDirectImports.length === 0) {
    logger.success(`All direct package imports are declared (${importedPackages.size} packages scanned)`)
    return true
  }

  logger.error(`Undeclared direct package imports (${details.undeclaredDirectImports.length})`)
  for (const entry of details.undeclaredDirectImports) {
    logger.plain(`  - ${entry.packageName}`)
    entry.files.slice(0, 3).forEach(filePath => logger.plain(`      ${filePath}`))
    if (entry.files.length > 3) {
      logger.plain(`      ...and ${entry.files.length - 3} more file(s)`)
    }
  }

  return false
}

export function runVerification(options = {}) {
  const logger = options.logger ?? createConsoleLogger()
  const context = resolveVerificationContext(options)
  const details = {
    missingOptionalDependencies: [],
    missingRequiredDependencies: [],
    missingSkillMd: [],
    skills: [],
    undeclaredDirectImports: [],
  }
  const packageJson = readPackageJson(context.packageJsonPath)
  const checks = {
    nodeModules: checkNodeModules(context, logger),
    declaredDependencies: checkDeclaredDependencies(context, packageJson, logger, details),
    sourceFiles: checkFiles(context, logger),
    directImports: checkDirectImports(context, packageJson, logger, details),
    skills: checkSkills(context, logger, details),
  }

  return {
    allPassed: Object.values(checks).every(Boolean),
    checks,
    context,
    details,
  }
}

export async function main(options = {}) {
  const logger = options.logger ?? createConsoleLogger()

  log('\nHyper-Designer Installation Verification\n', colors.blue)
  log('=========================================\n')

  const result = runVerification({ ...options, logger })

  log('\n=========================================')

  if (result.allPassed) {
    logger.success('\nAll checks passed. Installation is valid.\n')
    return 0
  }

  logger.error('\nSome checks failed. Please fix the issues above.\n')
  log('Common fixes:', colors.blue)
  if (!result.checks.nodeModules || !result.checks.declaredDependencies) {
    log(`  - Run: cd ${result.context.rootDir} && npm install`)
  }
  if (!result.checks.directImports) {
    log('  - Add missing direct imports to package.json and reinstall dependencies')
  }
  return 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    exitCode => process.exit(exitCode),
    error => {
      const err = error instanceof Error ? error : new Error(String(error))
      createConsoleLogger().error(`Verification failed: ${err.message}`)
      process.exit(1)
    },
  )
}
