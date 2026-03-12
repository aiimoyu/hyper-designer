## Current Phase: Missing Coverage Check

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="missingCoverageCheck"/>
    <pre_stage>componentAnalysis</pre_stage>
  </pipeline>
  <executing_agent>HAnalysis</executing_agent>
  <core_objective>
    Perform strict coverage validation across 7 categories, generate coverage report
    with structured verdict, and provide remediation guidance.
  </core_objective>
</workflow_context>
```

### 1. Execution Standards

**Core Skills**:
- `project-analysis-concepts` - Shared concepts, terminology, and artifact contracts
- `missing-coverage-check` - Strict coverage validation methodology across 7 categories

Load both skills to access:
- Shared terminology and artifact locations
- Coverage validation methodology and check algorithms
- Severity levels and remediation guidance patterns
- Output contracts for coverage report and verdict

**Critical Note**: This is NOT a workflow gate check.

The outputs from this stage are used for:
- Coverage reporting and documentation
- Test assertions and validation
- Remediation guidance

The workflow does NOT enforce these checks as gates. This is a diagnostic tool, not a blocking validation.

---

### 2. Strict Coverage Categories

Perform validation across these 7 strict coverage categories:

1. **Missing Components**
   - Verify all components in component-manifest.json have corresponding analysis outputs
   - Check for both markdown (`component/{componentSlug}.md`) and metadata (`_meta/components/{componentSlug}.json`)
   - Flag components in manifest but without analysis outputs

2. **Missing Files**
   - Verify all source files referenced in component analyses exist in the codebase
   - Check file paths are relative to target project root
   - Respect excluded patterns from source-inventory.json

3. **Missing Folders**
   - Verify expected directory structures exist in the target project
   - Check for standard project directories (src/, tests/, docs/)
   - Validate module-specific directories referenced in analyses are present

4. **Missed API Identification**
   - Identify APIs in code that are not documented in the API manifest
   - Cross-reference code usage with api-manifest.json
   - Verify API signatures match between code and manifest

5. **Insufficient Mermaid Coverage**
   - Verify critical diagrams exist and are complete in architecture.md and component analyses
   - Check for system architecture diagram in architecture.md
   - Verify component interaction diagrams for critical flows
   - Validate Mermaid syntax is correct

6. **Broken Cross References**
   - Verify all internal references between project-analysis documents are valid
   - Check internal links between architecture.md and component/*.md resolve
   - Validate component references point to valid componentSlugs
   - Verify API references point to valid apiSlugs in API manifest

7. **System/Component Inconsistency**
   - Verify alignment between architecture.md and component analyses
   - Check component names match between manifest and analyses
   - Validate component dependencies in manifest are reflected in analyses
   - Verify architecture dimensions in system-analysis.json align with architecture.md

---

### 3. Deliverables

| File | Path | Format Requirements |
|------|------|---------------------|
| **Coverage Report** | `.hyper-designer/projectAnalysis/coverage-report.md` | Markdown, human-readable summary of all 7 coverage categories with severity levels |
| **Machine-Readable Report** | `.hyper-designer/projectAnalysis/_meta/coverage-report.json` | JSON, structured data with summary, category results, and embedded verdict |
| **Structured Verdict** | Embedded in coverage-report.json | JSON object with pass/fail status, severity, affected artifacts, and remediation guidance |

**Coverage Report Markdown Structure**:

The `coverage-report.md` should include:

- Summary section with total checks, passed, failed, and warnings counts
- Individual sections for each of the 7 coverage categories
- Each issue marked with severity level: [HIGH], [MEDIUM], or [LOW]
- Clear descriptions of what is missing or broken
- References to affected artifacts (files, components, diagrams)

**Machine-Readable Coverage Report Structure**:

The `coverage-report.json` must contain:

```json
{
  "version": "1.0",
  "timestamp": "ISO-8601-timestamp",
  "summary": {
    "totalChecks": number,
    "passed": number,
    "failed": number,
    "warnings": number
  },
  "categories": {
    "missingComponents": { "status": "passed|failed|warning", "items": [...] },
    "missingFiles": { "status": "passed|failed|warning", "items": [...] },
    "missingFolders": { "status": "passed|failed|warning", "items": [...] },
    "missedAPIs": { "status": "passed|failed|warning", "items": [...] },
    "insufficientMermaid": { "status": "passed|failed|warning", "items": [...] },
    "brokenReferences": { "status": "passed|failed|warning", "items": [...] },
    "systemComponentInconsistency": { "status": "passed|failed|warning", "items": [...] }
  },
  "verdict": {
    "overall": "passed|failed|warning",
    "pass": boolean,
    "severity": "high|medium|low",
    "affectedArtifacts": ["artifact-path-1", "artifact-path-2", ...],
    "summary": "string describing overall result",
    "remediation": {
      "immediate": ["fix-1", "fix-2", ...],
      "shortTerm": ["fix-1", "fix-2", ...],
      "longTerm": ["fix-1", "fix-2", ...]
    }
  }
}
```

**Severity Levels**:

- **HIGH**: Blocks analysis completeness or causes data inconsistency
- **MEDIUM**: Impairs analysis quality or creates technical debt
- **LOW**: Nice to have but not critical for analysis completeness

---

### 4. Quality Checklist

Before completing Stage 3, verify:

| Requirement | Verification |
|-------------|--------------|
| All 7 categories checked | Each coverage category has been validated |
| Coverage report markdown exists | `.hyper-designer/projectAnalysis/coverage-report.md` is human-readable |
| Machine-readable report valid | `.hyper-designer/projectAnalysis/_meta/coverage-report.json` parses correctly |
| Verdict present | `verdict` object embedded in coverage-report.json |
| Verdict has pass/fail | `verdict.pass` is boolean |
| Verdict has severity | `verdict.severity` is one of: high, medium, low |
| Verdict has affected artifacts | `verdict.affectedArtifacts` is array of file paths |
| Verdict has remediation | `verdict.remediation` has immediate, shortTerm, longTerm arrays |
| Non-gate wording clear | Report explicitly states this is NOT a workflow gate |
| All references valid | Links and paths in report resolve correctly |
| Severity appropriate | Issues are categorized with correct severity levels |
| Output paths correct | All files under `.hyper-designer/projectAnalysis/` |
