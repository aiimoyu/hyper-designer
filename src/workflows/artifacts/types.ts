export class ArtifactResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArtifactResolutionError'
  }
}

export interface ArtifactValidationResult {
  valid: boolean
  missing: string[]
}

export type ResolvedInputs = Record<string, string>
