import { mkdirSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { HyperDesignerLogger } from "../../utils/logger"

/**
 * Creates a temporary test directory under os.tmpdir() with a random UUID suffix.
 * @param prefix - Prefix for the directory name
 * @returns Absolute path to the created directory
 */
export function createTempTestDir(prefix: string): string {
  const dirName = `${prefix}-${randomUUID()}`
  const dirPath = join(tmpdir(), dirName)
  mkdirSync(dirPath, { recursive: true })
  return dirPath
}

/**
 * Removes a temporary directory safely. Never throws - logs warning on failure.
 * @param dirPath - Path to the directory to remove
 */
export function cleanupTempDir(dirPath: string): void {
  try {
    rmSync(dirPath, { recursive: true, force: true })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    HyperDesignerLogger.warn("tempDir", `Failed to cleanup temp directory: ${dirPath} — ${err.message}`)
  }
}

/**
 * Runs a function with a temporary directory, cleaning up after completion.
 * @param prefix - Prefix for the directory name
 * @param fn - Function to run with the temp directory path
 * @returns Promise that resolves when fn completes or rejects
 */
export async function withTempDir(
  prefix: string,
  fn: (dir: string) => void | Promise<void>
): Promise<void> {
  const dir = createTempTestDir(prefix)
  try {
    await fn(dir)
  } finally {
    cleanupTempDir(dir)
  }
}
