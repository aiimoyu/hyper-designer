## Current Phase: System Analysis

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="systemAnalysis"/>
    <pre_stage>null</pre_stage>
  </pipeline>
  <executing_agent>HAnalysis</executing_agent>
  <core_objective>
    Discover the target project's architecture, components, APIs, and source code structure.
    Generate system-level architecture analysis and machine-readable manifests that serve
    as the single source of truth for downstream stages.
  </core_objective>
</workflow_context>
```

### 1. Execution Standards

**Core Skills**: `project-analysis-concepts`, `system-analysis`

Load these skills to access:

- `project-analysis-concepts`: Shared terminology, artifact contracts, architecture dimensions, component dimensions, code citation rules, Mermaid conventions
- `system-analysis`: Stage 1 methodology including 5 architecture dimensions, component discovery rules, granularity principles, and output generation guidelines

**Critical Constraint**: Stage 1 outputs are the ONLY source of truth for Stage 2 and Stage 3. The component manifest generated in this stage defines the complete component set for Stage 2 fan-out.

**Target Project Path**: You MUST ask the user for the target project path at the beginning of this stage. This path will be stored in `.hyper-designer/projectAnalysis/_meta/manifest.json` and reused by downstream stages.

### 2. Deliverables

| File                           | Path                                                            | Format Requirements                                                                                     |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **System Architecture Report** | `.hyper-designer/projectAnalysis/architecture.md`               | Markdown, must cover all 5 architecture dimensions with Mermaid diagrams and code citations             |
| **Project Analysis Manifest**  | `.hyper-designer/projectAnalysis/_meta/manifest.json`           | JSON, canonical project path + rerun metadata reused across all projectAnalysis stages                  |
| **System Analysis Manifest**   | `.hyper-designer/projectAnalysis/_meta/system-analysis.json`    | JSON, structured dimension data, project metadata, framework/language detection                         |
| **Component Manifest**         | `.hyper-designer/projectAnalysis/_meta/component-manifest.json` | JSON, complete component inventory with dependencies, types, and boundaries (authoritative for Stage 2) |
| **API Manifest**               | `.hyper-designer/projectAnalysis/_meta/api-manifest.json`       | JSON, API inventory with component mapping, categorization, and signatures                              |
| **Source Inventory**           | `.hyper-designer/projectAnalysis/_meta/source-inventory.json`   | JSON, file catalog with language distribution, size metrics, and exclusion log                          |

---

### 3. Quality Review

**Review Method**: This workflow stage does NOT use gate blocking. Verification is performed through reporting and test assertions in Stage 3 (missingCoverageCheck).

**Verification Approach**:

```markdown
# Non-Gating Verification

## 📋 Verification Strategy

This workflow uses reporting and test verification rather than quality gate blocking.

### Stage 1 Completion Criteria

- [ ] Target project path confirmed and accessible
- [ ] All 5 architecture dimensions analyzed and documented
- [ ] Component discovery rules applied consistently
- [ ] Component granularity principles applied and documented
- [ ] `architecture.md` generated with all 5 dimensions
- [ ] All 5 JSON manifests generated and valid:
  - `.hyper-designer/projectAnalysis/_meta/manifest.json` with canonical project path + rerun metadata
  - `_meta/system-analysis.json` with structured dimension data
- [ ] `_meta/component-manifest.json` with complete component inventory (authoritative for Stage 2)
- [ ] `_meta/api-manifest.json` with API inventory and component mapping
- [ ] `_meta/source-inventory.json` with file catalog and language distribution
- [ ] All manifests are machine-readable and parseable
- [ ] Mermaid diagrams included where applicable
- [ ] Code citations follow project analysis conventions

### Downstream Validation

Stage 3 (missingCoverageCheck) will perform strict validation across 7 coverage categories:

1. Missing components
2. Missing files
3. Missing folders
4. Missed API identification
5. Insufficient Mermaid coverage
6. Broken cross references
7. System/component inconsistency

The verification results will be used for:

- Generating coverage reports for manual review
- Automated test assertions in test suites
- Guiding subsequent iterations and improvement work
```
