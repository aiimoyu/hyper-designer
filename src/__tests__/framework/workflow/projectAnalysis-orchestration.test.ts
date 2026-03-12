import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"

import { join } from "path"
import { tmpdir } from "os"

/**
 * RED Tests for Project Analysis Orchestration Helpers
 *
 * These tests define the contract for Stage 2 component fan-out and Stage 3 strict coverage reconciliation:
 * 1. Stage 2: Manifest-driven fan-out with controlled concurrency and partial failure handling
 * 2. Stage 3: Strict coverage validation across 7 categories with structured verdict
 * 3. Both helpers belong to plugin-local scope (src/workflows/plugins/projectAnalysis/)
 *
 * IMPORTANT: These tests are RED - they will fail because the implementation does not exist yet.
 * The tests use a guarded dynamic import pattern to fail semantically when helpers are missing.
 */

function loadOrchestrationHelpers() {
  try {
    const module = require("../../../workflows/plugins/projectAnalysis/orchestration.ts")
    return module
  } catch (error) {
    return null
  }
}

describe("projectAnalysis orchestration helpers", () => {
  let tempProjectRoot: string
  let metaDir: string
  let componentManifestPath: string
  let coverageReportPath: string

  beforeEach(() => {
    tempProjectRoot = mkdtempSync(join(tmpdir(), "hyper-designer-test-"))
    metaDir = join(tempProjectRoot, ".hyper-designer", "projectAnalysis", "_meta")
    componentManifestPath = join(metaDir, "component-manifest.json")
    coverageReportPath = join(tempProjectRoot, ".hyper-designer", "projectAnalysis", "_meta", "coverage-report.json")
  })

  afterEach(() => {
    if (existsSync(tempProjectRoot)) {
      rmSync(tempProjectRoot, { recursive: true, force: true })
    }
  })

  describe("orchestration module availability", () => {
    it("projectAnalysis orchestration helpers should be defined", () => {
      const helpers = loadOrchestrationHelpers()

      expect(helpers).not.toBeNull()
      expect(helpers?.executeComponentFanOut).toBeDefined()
      expect(helpers?.performCoverageReconciliation).toBeDefined()
    })
  })

  describe("Stage 2: Component Fan-Out Orchestration", () => {
    it("uses component-manifest.json as ONLY source for component dispatch", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        components: [
          {
            componentSlug: "auth-service",
            name: "Authentication Service",
            description: "Handles user authentication and authorization",
            path: "src/services/auth",
            type: "service",
            dependencies: ["user-repository", "token-generator"]
          },
          {
            componentSlug: "user-repository",
            name: "User Repository Repository",
            description: "Data access layer for user entities",
            path: "src/repositories/user",
            type: "repository",
            dependencies: []
          }
        ]
      }
      writeFileSync(componentManifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      const result = helpers.executeComponentFanOut({
        manifestPath: componentManifestPath,
        projectRoot: tempProjectRoot,
        maxConcurrency: 5
      })

      expect(result.totalComponents).toBe(2)
      expect(result.components).toHaveLength(2)
      expect(result.components[0].componentSlug).toBe("auth-service")
      expect(result.components[1].componentSlug).toBe("user-repository")
    })

    it("respects configurable concurrency limit with visible default default", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        components: Array.from({ length: 10 }, (_, i) => ({
          componentSlug: `component-${i}`,
          name: `Component ${i}`,
          description: `Test component ${i}`,
          path: `src/components/${i}`,
          type: "service",
          dependencies: []
        }))
      }
      writeFileSync(componentManifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      const result1 = helpers.executeComponentFanOut({
        manifestPath: componentManifestPath,
        projectRoot: tempProjectRoot,
        maxConcurrency: 3
      })

      expect(result1.maxConcurrency).toBe(3)

      const result2 = helpers.executeComponentFanOut({
        manifestPath: componentManifestPath,
        projectRoot: tempProjectRoot
      })

      expect(result2.maxConcurrency).toBe(5)
    })

    it("preserves successful component results on partial failure", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        components: [
          {
            componentSlug: "component-1",
            name: "Component 1",
            description: "Will succeed",
            path: "src/components/1",
            type: "service",
            dependencies: []
          },
          {
            componentSlug: "component-2",
            name: "Component 2",
            description: "Will fail",
            path: "src/components/2",
            type: "service",
            dependencies: []
          },
          {
            componentSlug: "component-3",
            name: "Component 3",
            description: "Will succeed",
            path: "src/components/3",
            type: "service",
            dependencies: []
          }
        ]
      }
      writeFileSync(componentManifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      const result = helpers.executeComponentFanOut({
        manifestPath: componentManifestPath,
        projectRoot: tempProjectRoot,
        maxConcurrency: 5
      })

      expect(result.totalComponents).toBe(3)
      expect(result.successfulComponents).toBeGreaterThan(0)
      expect(result.failedComponents.length).toBeGreaterThan(0)
      expect(result.successfulComponents + result.failedComponents.length).toBe(3)

      const successfulSlugs = result.components
        .filter((c: { status: string; componentSlug: string }) => c.status === "success")
        .map((c: { componentSlug: string }) => c.componentSlug)
      expect(successfulSlugs).toContain("component-1")
      expect(successfulSlugs).toContain("component-3")

      const failedSlugs = result.failedComponents.map((c: { componentSlug: string }) => c.componentSlug)
      expect(failedSlugs).toContain("component-2")
    })

    it("reconciliation writes summary including failed components", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        components: [
          {
            componentSlug: "success-component",
            name: "Success Component",
            description: "Will succeed",
            path: "src/components/success",
            type: "service",
            dependencies: []
          },
          {
            componentSlug: "failed-component",
            name: "Failed Component",
            description: "Will fail",
            path: "src/components/failed",
            type: "service",
            dependencies: []
          }
        ]
      }
      writeFileSync(componentManifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      helpers.executeComponentFanOut({
        manifestPath: componentManifestPath,
        projectRoot: tempProjectRoot,
        maxConcurrency: 5
      })

      const summaryPath = join(metaDir, "component-analysis-summary.json")
      expect(existsSync(summaryPath)).toBe(true)

      const summary = JSON.parse(readFileSync(summaryPath, "utf-8"))

      expect(summary.totalComponents).toBe(2)
      expect(summary.failedComponents).toBeDefined()
      expect(summary.failedComponents.length).toBeGreaterThan(0)
      expect(summary.failedComponents).toContain("failed-component")

      expect(summary.reconciliationIssues).toBeDefined()
      expect(Array.isArray(summary.reconciliationIssues)).toBe(true)
    })

    it("forbids project directory scanning during Stage 2", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        components: [
          {
            componentSlug: "component-a",
            name: "Component A",
            description: "Only component in manifest",
            path: "src/components/a",
            type: "service",
            dependencies: []
          }
        ]
      }
      writeFileSync(componentManifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      const result = helpers.executeComponentFanOut({
        manifestPath: componentManifestPath,
        projectRoot: tempProjectRoot,
        maxConcurrency: 5
      })

      expect(result.totalComponents).toBe(1)
      expect(result.components).toHaveLength(1)
      expect(result.components[0].componentSlug).toBe("component-a")

      expect(result.components.length).toBeLessThanOrEqual(manifest.components.length)
    })
  })

  describe("Stage 3: Strict Coverage Reconciliation", () => {
    it("classifies findings across 7 coverage categories", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(join(tempProjectRoot, ".hyper-designer", "projectAnalysis", "_meta"), { recursive: true })
      const coverageData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        summary: {
          totalChecks: 42,
          passed: 35,
          failed: 7,
          warnings: 3
        },
        categories: {
          missingComponents: {
            status: "failed",
            items: [{ id: "comp-001", componentSlug: "user-service", severity: "high" }]
          },
          missingFiles: {
            status: "failed",
            items: [{ id: "file-001", filePath: "src/services/auth.ts", severity: "medium" }]
          },
          missingFolders: {
            status: "passed",
            items: []
          },
          missedAPIs: {
            status: "warning",
            items: [{ id: "api-001", apiName: "GET /api/users", severity: "high" }]
          },
          insufficientMermaid: {
            status: "failed",
            items: [{ id: "diag-001", diagramType: "sequence", severity: "medium" }]
          },
          brokenReferences: {
            status: "passed",
            items: []
          },
          systemComponentInconsistency: {
            status: "warning",
            items: [{ id: "inc-001", componentSlug: "payment-service", severity: "high" }]
          }
        }
      }
      writeFileSync(coverageReportPath, JSON.stringify(coverageData, null, 2), "utf-8")

      const result = helpers.performCoverageReconciliation({
        coverageReportPath,
        projectRoot: tempProjectRoot
      })

      expect(result.categories).toBeDefined()
      expect(result.categories.missingComponents).toBeDefined()
      expect(result.categories.missingFiles).toBeDefined()
      expect(result.categories.missingFolders).toBeDefined()
      expect(result.categories.missedAPIs).toBeDefined()
      expect(result.categories.insufficientMermaid).toBeDefined()
      expect(result.categories.brokenReferences).toBeDefined()
      expect(result.categories.systemComponentInconsistency).toBeDefined()
    })

    it("verdict contains pass/fail + severity + affectedArtifacts + remediation", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(join(tempProjectRoot, ".hyper-designer", "projectAnalysis", "_meta"), { recursive: true })
      const coverageData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        summary: {
          totalChecks: 42,
          passed: 35,
          failed: 7,
          warnings: 3
        },
        categories: {
          missingComponents: { status: "failed", items: [] },
          missingFiles: { status: "failed", items: [] },
          missingFolders: { status: "passed", items: [] },
          missedAPIs: { status: "passed", items: [] },
          insufficientMermaid: { status: "failed", items: [] },
          brokenReferences: { status: "passed", items: [] },
          systemComponentInconsistency: { status: "passed", items: [] }
        }
      }
      writeFileSync(coverageReportPath, JSON.stringify(coverageData, null, 2), "utf-8")

      const result = helpers.performCoverageReconciliation({
        coverageReportPath,
        projectRoot: tempProjectRoot
      })

      expect(result.verdict).toBeDefined()
      expect(result.verdict.overall).toBeDefined()
      expect(result.verdict.pass).toBeDefined()
      expect(typeof result.verdict.pass).toBe("boolean")
      expect(result.verdict.severity).toBeDefined()
      expect(["high", "medium", "low"]).toContain(result.verdict.severity)
      expect(result.verdict.affectedArtifacts).toBeDefined()
      expect(Array.isArray(result.verdict.affectedArtifacts)).toBe(true)
      expect(result.verdict.remediation).toBeDefined()
      expect(result.verdict.remediation.immediate).toBeDefined()
      expect(result.verdict.remediation.shortTerm).toBeDefined()
      expect(result.verdict.remediation.longTerm).toBeDefined()
    })

    it("determines verdict pass/fail based on category statuses", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(join(tempProjectRoot, ".hyper-designer", "projectAnalysis", "_meta"), { recursive: true })
      const passedCoverageData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        summary: { totalChecks: 10, passed: 10, failed: 0, warnings: 0 },
        categories: {
          missingComponents: { status: "passed", items: [] },
          missingFiles: { status: "passed", items: [] },
          missingFolders: { status: "passed", items: [] },
          missedAPIs: { status: "passed", items: [] },
          insufficientMermaid: { status: "passed", items: [] },
          brokenReferences: { status: "passed", items: [] },
          systemComponentInconsistency: { status: "passed", items: [] }
        }
      }
      writeFileSync(coverageReportPath, JSON.stringify(passedCoverageData, null, 2), "utf-8")

      const passedResult = helpers.performCoverageReconciliation({
        coverageReportPath,
        projectRoot: tempProjectRoot
      })

      expect(passedResult.verdict.pass).toBe(true)
      expect(passedResult.verdict.overall).toBe("passed")

      const failedCoverageData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        summary: { totalChecks: 10, passed: 7, failed: 3, warnings: 0 },
        categories: {
          missingComponents: { status: "failed", items: [] },
          missingFiles: { status: "passed", items: [] },
          missingFolders: { status: "passed", items: [] },
          missedAPIs: { status: "failed", items: [] },
          insufficientMermaid: { status: "passed", items: [] },
          brokenReferences: { status: "passed", items: [] },
          systemComponentInconsistency: { status: "failed", items: [] }
        }
      }
      writeFileSync(coverageReportPath, JSON.stringify(failedCoverageData, null, 2), "utf-8")

      const failedResult = helpers.performCoverageReconciliation({
        coverageReportPath,
        projectRoot: tempProjectRoot
      })

      expect(failedResult.verdict.pass).toBe(false)
      expect(failedResult.verdict.overall).toBe("failed")
    })

    it("calculates severity based on highest severity in findings", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(join(tempProjectRoot, ".hyper-designer", "projectAnalysis", "_meta"), { recursive: true })
      const coverageData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        summary: { totalChecks: 10, passed: 7, failed: 3, warnings: 0 },
        categories: {
          missingComponents: {
            status: "failed",
            items: [{ id: "comp-001", severity: "high" }]
          },
          missingFiles: {
            status: "passed",
            items: []
          },
          missingFolders: {
            status: "passed",
            items: []
          },
          missedAPIs: {
            status: "warning",
            items: [{ id: "api-001", severity: "low" }]
          },
          insufficientMermaid: {
            status: "passed",
            items: []
          },
          brokenReferences: {
            status: "passed",
            items: []
          },
          systemComponentInconsistency: {
            status: "passed",
            items: []
          }
        }
      }
      writeFileSync(coverageReportPath, JSON.stringify(coverageData, null, 2), "utf-8")

      const result = helpers.performCoverageReconciliation({
        coverageReportPath,
        projectRoot: tempProjectRoot
      })

      expect(result.verdict.severity).toBe("high")
    })

    it("provides remediation guidance with immediate, shortTerm, and longTerm", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(join(tempProjectRoot, ".hyper-designer", "projectAnalysis", "_meta"), { recursive: true })
      const coverageData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        summary: { totalChecks: 10, passed: 7, failed: 3, warnings: 0 },
        categories: {
          missingComponents: {
            status: "failed",
            items: [
              { id: "comp-001", componentSlug: "user-service", severity: "high" }
            ]
          },
          missingFiles: { status: "passed", items: [] },
          missingFolders: { status: "passed", items: [] },
          missedAPIs: { status: "passed", items: [] },
          insufficientMermaid: {
            status: "failed",
            items: [
              { id: "diag-001", diagramType: "sequence", severity: "medium" }
            ]
          },
          brokenReferences: { status: "passed", items: [] },
          systemComponentInconsistency: { status: "passed", items: [] }
        }
      }
      writeFileSync(coverageReportPath, JSON.stringify(coverageData, null, 2), "utf-8")

      const result = helpers.performCoverageReconciliation({
        coverageReportPath,
        projectRoot: tempProjectRoot
      })

      expect(result.verdict.remediation.immediate).toBeDefined()
      expect(Array.isArray(result.verdict.remediation.immediate)).toBe(true)
      expect(result.verdict.remediation.shortTerm).toBeDefined()
      expect(Array.isArray(result.verdict.remediation.shortTerm)).toBe(true)
      expect(result.verdict.remediation.longTerm).toBeDefined()
      expect(Array.isArray(result.verdict.remediation.longTerm)).toBe(true)

      if (result.verdict.remediation.immediate.length > 0) {
        expect(typeof result.verdict.remediation.immediate[0]).toBe("string")
        expect(result.verdict.remediation.immediate[0].length).toBeGreaterThan(0)
      }
    })
  })

  describe("error handling and validation", () => {
    it("throws error when component manifest is missing", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      const nonExistentPath = join(metaDir, "non-existent-manifest.json")

      expect(() => {
        helpers.executeComponentFanOut({
          manifestPath: nonExistentPath,
          projectRoot: tempProjectRoot,
          maxConcurrency: 5
        })
      }).toThrow()
    })

    it("throws error when coverage report is missing", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      const nonExistentPath = join(metaDir, "non-existent-coverage.json")

      expect(() => {
        helpers.performCoverageReconciliation({
          coverageReportPath: nonExistentPath,
          projectRoot: tempProjectRoot
        })
      }).toThrow()
    })

    it("throws error when maxConcurrency is invalid", () => {
      const helpers = loadOrchestrationHelpers()

      if (!helpers) {
        expect(helpers).not.toBeNull()
        return
      }

      mkdirSync(metaDir, { recursive: true })
      const manifest = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        components: []
      }
      writeFileSync(componentManifestPath, JSON.stringify(manifest, null, 2), "utf-8")

      const invalidConcurrencyValues = [0, -1, -5, 1000]

      for (const invalidValue of invalidConcurrencyValues) {
        expect(() => {
          helpers.executeComponentFanOut({
            manifestPath: componentManifestPath,
            projectRoot: tempProjectRoot,
            maxConcurrency: invalidValue
          })
        }).toThrow()
      }
    })
  })
})
