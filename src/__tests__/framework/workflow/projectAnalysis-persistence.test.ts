import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

/**
 * RED Tests for Project Analysis Metadata Persistence
 *
 * These tests define the contract for how projectAnalysis metadata should be persisted:
 * 1. Metadata must live in the target project's `.hyper-designer/projectAnalysis/_meta/` directory
 * 2. NOT in the current repo's workflow state (`.hyper-designer/workflow_state.json`)
 * 3. The manifest must be reusable across workflow reruns/resumes
 * 4. Corrupted manifests should trigger re-prompting for project path
 *
 * IMPORTANT: These tests are RED - they will fail because the implementation does not exist yet.
 * The tests use a guarded dynamic import pattern to fail semantically when helpers are missing.
 */

// Helper function to safely load the persistence module
// Returns null if the module doesn't exist yet (RED state)
function loadPersistenceHelpers() {
  try {
    // Try to dynamically import the future persistence module
    // This will fail in RED state when the module doesn't exist
    const module = require("../../../workflows/plugins/projectAnalysis/persistence.ts")
    return module
  } catch (error) {
    // Module doesn't exist yet - return null sentinel
    return null
  }
}

describe("projectAnalysis metadata persistence", () => {
  let tempProjectRoot: string
  let metaDir: string
  let manifestPath: string

  beforeEach(() => {
    // Create a temporary directory to simulate an external target project
    tempProjectRoot = mkdtempSync(join(tmpdir(), "hyper-designer-test-"))
    metaDir = join(tempProjectRoot, ".hyper-designer", "projectAnalysis", "_meta")
    manifestPath = join(metaDir, "manifest.json")
  })

  afterEach(() => {
    // Cleanup temp directory
    if (existsSync(tempProjectRoot)) {
      rmSync(tempProjectRoot, { recursive: true, force: true })
    }
  })

  describe("persistence module availability", () => {
    it("projectAnalysis persistence helpers should be defined", () => {
      const helpers = loadPersistenceHelpers()

      // This assertion will fail when the persistence module doesn't exist
      expect(helpers).not.toBeNull()
      expect(helpers?.saveProjectPath).toBeDefined()
      expect(helpers?.getProjectPath).toBeDefined()
      expect(helpers?.shouldPromptForProjectPath).toBeDefined()
      expect(helpers?.getProjectAnalysisMetadata).toBeDefined()
      expect(helpers?.validateManifestSchema).toBeDefined()
    })
  })

  describe("initial project path storage", () => {
    it("stores project path in target project's _meta manifest", () => {
      const helpers = loadPersistenceHelpers()
      const projectPath = "/path/to/target/project"

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      // Call the helper (will fail if implementation is incomplete)
      helpers.saveProjectPath(projectPath, tempProjectRoot)

      // Assert that the manifest file was created
      expect(existsSync(manifestPath)).toBe(true)
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
      expect(manifest.projectPath).toBe(projectPath)
      expect(manifest.createdAt).toBeDefined()
    })

    it("creates .hyper-designer/projectAnalysis/_meta directory structure", () => {
      const helpers = loadPersistenceHelpers()
      const projectPath = "/path/to/target/project"

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      helpers.saveProjectPath(projectPath, tempProjectRoot)

      expect(existsSync(metaDir)).toBe(true)
      expect(existsSync(manifestPath)).toBe(true)
    })

    it("does NOT store project path in current repo's workflow state", () => {
      const helpers = loadPersistenceHelpers()
      const projectPath = "/path/to/target/project"

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      helpers.saveProjectPath(projectPath, tempProjectRoot)

      // Verify that the current repo's workflow state does NOT contain project path
      const workflowStatePath = join(process.cwd(), ".hyper-designer", "workflow_state.json")
      if (existsSync(workflowStatePath)) {
        const workflowState = JSON.parse(readFileSync(workflowStatePath, "utf-8"))
        expect(workflowState.projectPath).toBeUndefined()
        expect(workflowState.projectAnalysis).toBeUndefined()
      }
    })
  })

  describe("manifest retrieval and reuse", () => {
    it("retrieves existing project path from manifest", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      // Setup: create a valid manifest
      const expectedPath = "/path/to/target/project"
      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        projectPath: expectedPath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      const retrievedPath = helpers.getProjectPath(tempProjectRoot)

      expect(retrievedPath).toBe(expectedPath)
    })

    it("returns null when manifest does not exist", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      const retrievedPath = helpers.getProjectPath(tempProjectRoot)

      expect(retrievedPath).toBeNull()
    })

    it("updates manifest timestamp on retrieval", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      // Setup: create a manifest with an old timestamp
      const oldTimestamp = "2020-01-01T00:00:00.000Z"
      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        projectPath: "/path/to/target/project",
        createdAt: oldTimestamp,
        updatedAt: oldTimestamp
      }
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      helpers.getProjectPath(tempProjectRoot)

      const updatedManifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
      expect(updatedManifest.createdAt).toBe(oldTimestamp)
      expect(updatedManifest.updatedAt).not.toBe(oldTimestamp)
    })
  })

  describe("rerun and resume behavior", () => {
    it("does NOT re-prompt for project path when valid manifest exists", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      // Setup: create a valid manifest
      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        projectPath: "/path/to/target/project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      const shouldPrompt = helpers.shouldPromptForProjectPath(tempProjectRoot)

      expect(shouldPrompt).toBe(false)
    })

    it("prompts for project path when manifest is missing", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      const shouldPrompt = helpers.shouldPromptForProjectPath(tempProjectRoot)

      expect(shouldPrompt).toBe(true)
    })

    it("prompts for project path when manifest is corrupted", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      // Setup: create a corrupted manifest
      mkdirSync(metaDir, { recursive: true })
      writeFileSync(manifestPath, "invalid json {{{", "utf-8")

      const shouldPrompt = helpers.shouldPromptForProjectPath(tempProjectRoot)

      expect(shouldPrompt).toBe(true)
    })

    it("prompts for project path when manifest lacks required fields", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      // Setup: create a manifest missing required fields
      mkdirSync(metaDir, { recursive: true })
      const incompleteManifest = {
        createdAt: new Date().toISOString()
        // Missing projectPath
      }
      writeFileSync(manifestPath, JSON.stringify(incompleteManifest, null, 2), "utf-8")

      const shouldPrompt = helpers.shouldPromptForProjectPath(tempProjectRoot)

      expect(shouldPrompt).toBe(true)
    })

    it("reuses existing manifest data across workflow reruns", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      // Setup: create a manifest with additional metadata
      mkdirSync(metaDir, { recursive: true })
      const originalManifest = {
        projectPath: "/path/to/target/project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        analysisId: "analysis-123",
        lastStage: "IRAnalysis"
      }
      writeFileSync(manifestPath, JSON.stringify(originalManifest, null, 2), "utf-8")

      const metadata = helpers.getProjectAnalysisMetadata(tempProjectRoot)

      expect(metadata.projectPath).toBe(originalManifest.projectPath)
      expect(metadata.analysisId).toBe(originalManifest.analysisId)
      expect(metadata.lastStage).toBe(originalManifest.lastStage)
    })
  })

  describe("error handling and validation", () => {
    it("throws error when project path is empty or whitespace", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      const invalidPaths = ["", "   ", "\t\n"]

      for (const invalidPath of invalidPaths) {
        expect(() => {
          helpers.saveProjectPath(invalidPath, tempProjectRoot)
        }).toThrow()
      }
    })

    it("throws error when target root is not a directory", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      const nonExistentPath = "/this/path/does/not/exist"

      expect(() => {
        helpers.saveProjectPath("/some/path", nonExistentPath)
      }).toThrow()
    })

    it("handles concurrent writes gracefully", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      const projectPath = "/path/to/target/project"

      expect(() => {
        helpers.saveProjectPath(projectPath, tempProjectRoot)
        helpers.saveProjectPath(projectPath, tempProjectRoot)
      }).not.toThrow()
    })
  })

  describe("manifest schema contract", () => {
    it("enforces required fields in manifest", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        projectPath: "/path/to/target/project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      const isValid = helpers.validateManifestSchema(manifestPath)

      expect(isValid).toBe(true)
    })

    it("rejects manifest with invalid ISO date format", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(metaDir, { recursive: true })
      const invalidManifest = {
        projectPath: "/path/to/target/project",
        createdAt: "not-a-date",
        updatedAt: "also-not-a-date"
      }
      writeFileSync(manifestPath, JSON.stringify(invalidManifest, null, 2), "utf-8")

      const isValid = helpers.validateManifestSchema(manifestPath)

      expect(isValid).toBe(false)
    })

    it("allows additional metadata fields in manifest", () => {
      const helpers = loadPersistenceHelpers()

      // Skip test if helpers don't exist (RED state)
      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        projectPath: "/path/to/target/project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Additional fields for future extensibility
        analysisId: "analysis-123",
        lastStage: "IRAnalysis",
        customField: "custom value"
      }
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      const isValid = helpers.validateManifestSchema(manifestPath)

      expect(isValid).toBe(true)
    })
  })
})
