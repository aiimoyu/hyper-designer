---
name: missing-coverage-check
description: >
  Stage 3 missing coverage check for project-analysis workflow.
  Performs strict validation across 7 coverage categories: missing components,
  missing files, missing folders, missed API identification, insufficient
  Mermaid coverage, broken cross references, and system/component inconsistency.
  Outputs coverage report markdown, _meta/coverage-report.json, and structured
  verdict with severity and remediation guidance. This is NOT a workflow
  gate and does NOT block progression.
---

# Missing Coverage Check Skill (Stage 3)

## Purpose

Stage 3 of the project-analysis workflow: strict coverage validation for system completeness.

This skill performs comprehensive coverage analysis to ensure all project-analysis artifacts are properly documented, complete, and cross-referenced. Unlike standard linting, this check focuses on structural completeness and traceability across the entire project analysis.

## Scope

This skill operates on Stage 3 (missing coverage check) only. It validates:

1. **Missing components** - Components in manifest but without analysis outputs
2. **Missing files** - Source files referenced but not present
3. **Missing folders** - Expected directory structures absent
4. **Missed API identification** - APIs in code but not in API manifest
5. **Insufficient Mermaid coverage** - Critical diagrams missing or
6. **Broken cross references** - Invalid links between documents
7. **System/component inconsistency** - Mismatch between architecture.md and component analyses

## Critical Note

**This is NOT a workflow gate check.** The outputs from this skill are used for:
- Coverage reporting and documentation
- Test assertions and validation
- Remediation guidance

The workflow does NOT enforce these checks as gates. This is a diagnostic tool, not a blocking validation.

## Inputs

Required project-analysis artifacts:

- **System architecture**: `.hyper-designer/projectAnalysis/architecture.md`
- **Component analyses**: `.hyper-designer/projectAnalysis/component/*.md`
- **Component metadata**: `.hyper-designer/projectAnalysis/_meta/components/*.json`
- **System analysis manifest**: `.hyper-designer/projectAnalysis/_meta/system-analysis.json`
- **Component manifest**: `.hyper-designer/projectAnalysis/_meta/component-manifest.json`
- **API manifest**: `.hyper-designer/projectAnalysis/_meta/api-manifest.json`
- **Source inventory**: `.hyper-designer/projectAnalysis/_meta/source-inventory.json`
- **Target project codebase**: The actual source code being analyzed

## Workflow

### 1. Missing Components Check

Verify all components in the component manifest have corresponding analysis outputs:

```typescript
// For each component in component-manifest.json
checkComponentAnalysisExists(component) {
  const markdownPath = `component/${component.componentSlug}.md`
  const metadataPath = `_meta/components/${component.componentSlug}.json`

  if (!hasFile(markdownPath)) {
    reportMissingComponent({
      componentSlug: component.componentSlug,
      expectedMarkdown: markdownPath,
      expectedMetadata: metadataPath,
      severity: 'high'
    })
  }

  if (!hasFile(metadataPath)) {
    reportMissingComponentMetadata({
      componentSlug: component.componentSlug,
      expectedPath: metadataPath,
      severity: 'high'
    })
  }
}
```

**Check items**:
- [ ] Every component in component-manifest.json has `component/{componentSlug}.md`
- [ ] Every component in component-manifest.json has `_meta/components/{componentSlug}.json`
- [ ] Component names match between manifest and analysis files
- [ ] Component metadata is valid JSON

### 2. Missing Files Check

Verify all source files referenced in component analyses exist in the codebase:

```typescript
// For each file reference in component analyses
checkFileExists(filePath) {
  if (!codebase.hasFile(filePath)) {
    reportMissingFile({
      filePath,
      referencedIn: documentPath,
      context: referenceContext,
      severity: 'medium'
    })
  }
}
```

**Check items**:
- [ ] Source files referenced in component analyses exist
- [ ] File paths are relative to target project root
- [ ] Excluded patterns from source-inventory.json are respected
- [ ] No references to files in excluded directories (node_modules, dist, etc.)

### 3. Missing Folders Check

Verify expected directory structures exist in the target project:

```typescript
// Check for expected directory structure based on source-inventory.json
checkFolderStructure() {
  expectedFolders.forEach(folder => {
    if (!codebase.hasFolder(folder)) {
      reportMissingFolder({
        folderPath: folder,
        purpose: folderPurpose,
        severity: 'low'
      })
    }
  })
}
```

**Check items**:
- [ ] Standard project directories exist (src/, tests/, docs/)
- [ ] Module-specific directories referenced in analyses are present
- [ ] Resource directories exist
- [ ] Build/output directories are configured

### 4. Missed API Identification Check

Identify APIs in code that are not documented in the API manifest:

```typescript
// Cross-reference code usage with API manifest
checkAPIs() {
  usedAPIs.forEach(api => {
    if (!apiManifest.has(api)) {
      reportMissedAPI({
        apiName: api,
        usageLocation: codeLocation,
        expectedIn: 'api-manifest.json',
        severity: 'high'
      })
    }
  })
}
```

**Check items**:
- [ ] All public APIs in code are documented in api-manifest.json
- [ ] API signatures match between code and manifest
- [ ] Component mapping in API manifest is valid
- [ ] API types (REST/GraphQL/RPC/Event/Library) are correctly categorized

### 5. Insufficient Mermaid Coverage Check

Verify critical diagrams exist and are complete in architecture.md and component analyses:

```typescript
// Check for required diagrams
checkMermaidCoverage() {
  requiredDiagrams.forEach(diagram => {
    if (!diagrams.has(diagram.type, diagram.context)) {
      reportInsufficientMermaid({
        diagramType: diagram.type,
        context: diagram.context,
        purpose: diagram.purpose,
        severity: 'medium'
      })
    }
  })
}
```

**Check items**:
- [ ] System architecture diagram exists in architecture.md
- [ ] Component interaction diagrams exist for critical flows
- [ ] Sequence diagrams cover key use cases in component analyses
- [ ] Data flow diagrams show data movement
- [ ] Mermaid syntax is valid

### 6. Broken Cross References Check

Verify all internal references between project-analysis documents are valid:

```typescript
// Validate all document cross-references
checkCrossReferences() {
  references.forEach(ref => {
    if (!isValidReference(ref)) {
      reportBrokenReference({
        reference: ref,
        source: sourceDocument,
        target: ref.target,
        severity: 'medium'
      })
    }
  })
}
```

**Check items**:
- [ ] Internal links between architecture.md and component/*.md resolve
- [ ] Section references exist within documents
- [ ] Component references point to valid componentSlugs
- [ ] API references point to valid apiSlugs in API manifest

### 7. System/Component Inconsistency Check

Verify alignment between architecture.md and component analyses:

```typescript
// Check consistency across system and component levels
checkSystemComponentConsistency() {
  componentManifest.components.forEach(component => {
    const componentAnalysis = loadComponentAnalysis(component.componentSlug)
    if (!isConsistent(component, componentAnalysis)) {
      reportInconsistency({
        component: component,
        componentAnalysis: componentAnalysis,
        discrepancies: identifyDiscrepancies(component, componentAnalysis),
        severity: 'high'
      })
    }
  })
}
```

**Check items**:
- [ ] Component names match between manifest and analyses
- [ ] Component dependencies in manifest are reflected in analyses
- [ ] Architecture dimensions in system-analysis.json align with architecture.md
- [ ] API manifest references are consistent with component analyses

## Outputs

### 1. Coverage Report Markdown

Generate human-readable coverage report:

**File**: `.hyper-designer/projectAnalysis/coverage-report.md`

```markdown
# Coverage Report

## Summary
- Total checks: 42
- Passed: 35
- Failed: 7
- Warnings: 3

## Missing Components
- [HIGH] user-service component in manifest but no analysis output
  - Expected: component/user-service.md
  - Expected: _meta/components/user-service.json
  - Referenced in: component-manifest.json

## Missing Files
- [MEDIUM] src/services/auth.ts referenced but not found
  - Referenced in: component/auth-controller.md §2.1
  - Expected to implement: AuthenticationService interface

## Insufficient Mermaid Coverage
- [MEDIUM] Missing sequence diagram for payment processing
  - Context: PaymentService component
  - Purpose: Document payment flow with external gateway
...
```

### 2. Machine-Readable Coverage Report

**File**: `.hyper-designer/projectAnalysis/_meta/coverage-report.json`

```json
{
  "version": "1.0",
  "timestamp": "2026-03-12T10:30:00Z",
  "summary": {
    "totalChecks": 42,
    "passed": 35,
    "failed": 7,
    "warnings": 3
  },
  "categories": {
    "missingComponents": {
      "status": "failed",
      "items": [
        {
          "id": "comp-001",
          "componentSlug": "user-service",
          "severity": "high",
          "missingMarkdown": "component/user-service.md",
          "missingMetadata": "_meta/components/user-service.json"
        }
      ]
    },
    "missingFiles": {
      "status": "failed",
      "items": [...]
    },
    "missingFolders": {
      "status": "passed",
      "items": []
    },
    "missedAPIs": {
      "status": "warning",
      "items": [...]
    },
    "insufficientMermaid": {
      "status": "failed",
      "items": [...]
    },
    "brokenReferences": {
      "status": "passed",
      "items": []
    },
    "systemComponentInconsistency": {
      "status": "warning",
      "items": [...]
    }
  }
}
```

### 3. Structured Verdict

Generate verdict summary with severity and remediation (embedded in coverage-report.json):

```json
{
  "verdict": {
    "overall": "failed",
    "pass": false,
    "severity": "high",
    "affectedArtifacts": [
      "architecture.md",
      "component/user-service.md",
      "component/payment-service.md"
    ],
    "summary": "7 critical coverage issues found across 3 categories",
    "remediation": {
      "immediate": [
        "Create component/user-service.md analysis",
        "Create _meta/components/user-service.json metadata",
        "Add payment processing sequence diagram"
      ],
      "shortTerm": [
        "Document all APIs in api-manifest.json",
        "Validate all cross-references between documents"
      ],
      "longTerm": [
        "Establish automated coverage monitoring in CI",
        "Implement cross-reference validation in Stage 2 reconciliation"
      ]
    }
  }
}
```

## Severity Levels

- **HIGH**: Blocks analysis completeness or causes data inconsistency
- **MEDIUM**: Impairs analysis quality or creates technical debt
- **LOW**: Nice to have but not critical for analysis completeness

## Quality Checklist

Before finalizing coverage report, verify:

- [ ] All 7 coverage categories have been checked
- [ ] Coverage report markdown is human-readable
- [ ] `_meta/coverage-report.json` is valid JSON
- [ ] Verdict includes pass/fail status
- [ ] Verdict includes severity level
- [ ] Verdict includes affected artifacts list
- [ ] Verdict includes remediation guidance (immediate/shortTerm/longTerm)
- [ ] Report clearly states this is NOT a workflow gate
- [ ] All references in report are valid
- [ ] Severity levels are appropriate
- [ ] All file paths are relative to `.hyper-designer/projectAnalysis/`

## Workflow Integration

### When to Use

- Workflow stage: `missingCoverageCheck` in `projectAnalysis` workflow
- Agent: `HAnalysis` (base prompt + stage-specific loading)
- Context: After Stage 2 completes, final validation stage

### Prerequisites

- Stage 1 system analysis completed successfully
- Stage 2 component analysis completed successfully
- All required manifests exist and are valid JSON
- Target project codebase is accessible

### Output Locations

- Coverage report: `.hyper-designer/projectAnalysis/coverage-report.md`
- Machine-readable report: `.hyper-designer/projectAnalysis/_meta/coverage-report.json`
- Verdict: Embedded in coverage-report.json

### NOT a Workflow Gate

- This skill does NOT block workflow progression
- Outputs are for reporting and test assertions only
- Use verdict for automated checks in test suites
- Remediation guidance is informational, not enforced

## Example Usage

```typescript
// After loading the skill
const coverageReport = await performCoverageCheck({
  architecture: loadArchitecture(),
  componentAnalyses: loadComponentAnalyses(),
  manifests: loadManifests(),
  codebase: loadCodebase()
})

// Report is saved to .hyper-designer/projectAnalysis/coverage-report.md
// Machine-readable report saved to .hyper-designer/projectAnalysis/_meta/coverage-report.json

// Verdict can be used in tests
expect(coverageReport.verdict.pass).toBe(false)
expect(coverageReport.verdict.severity).toBe('high')
```

## Common Pitfalls

| Pitfall | Recognition Signal | Strategy |
|---------|-------------------|----------|
| Treating this as a lint check | Focusing on code style or formatting | Remember: this is structural coverage of analysis artifacts, not code quality |
| Blocking workflow on failures | Workflow gate enforcement fails | This is diagnostic only, not a gate |
| Missing coverage categories | Report has fewer than 7 categories | Ensure all 7 categories are checked |
| Incomplete remediation | Verdict lacks fix suggestions | Provide actionable remediation at all time horizons |
| Invalid JSON output | coverage-report.json fails parsing | Validate JSON structure before writing |
| Unclear severity | All issues marked as same severity | Apply appropriate severity based on impact on analysis completeness |
| Wrong output paths | Files written to bare `.hyper-designer/` | Use `.hyper-designer/projectAnalysis/` as root |
| Reference to wrong artifacts | Mentions classic design-workflow artifacts | Only reference project-analysis artifacts |
