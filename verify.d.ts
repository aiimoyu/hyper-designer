export interface VerificationLogger {
  error(message: string): void
  info(message: string): void
  plain(message: string): void
  success(message: string): void
  warning(message: string): void
}

export interface VerificationContext {
  nodeModulesDir: string
  packageJsonPath: string
  rootDir: string
  skillsDir: string
  sourcePluginFile: string
}

export interface UndeclaredDirectImport {
  files: string[]
  packageName: string
}

export interface VerificationDetails {
  missingOptionalDependencies: string[]
  missingRequiredDependencies: string[]
  missingSkillMd: string[]
  skills: string[]
  undeclaredDirectImports: UndeclaredDirectImport[]
}

export interface VerificationChecks {
  declaredDependencies: boolean
  directImports: boolean
  nodeModules: boolean
  skills: boolean
  sourceFiles: boolean
}

export interface VerificationResult {
  allPassed: boolean
  checks: VerificationChecks
  context: VerificationContext
  details: VerificationDetails
}

export interface VerificationOptions {
  logger?: VerificationLogger
  rootDir?: string
}

export function resolveVerificationContext(options?: VerificationOptions): VerificationContext
export function runVerification(options?: VerificationOptions): VerificationResult
export function main(options?: VerificationOptions): Promise<number>
