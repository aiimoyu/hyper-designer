---
name: project-analysis-concepts
description: Shared concepts and contracts for project-analysis workflow. Defines common terminology, artifact contracts, architecture dimensions (5), component dimensions (4), code citation rules, Mermaid conventions, and update-reminder patterns used across all stages (systemAnalysis, componentAnalysis, missingCoverageCheck). Stage-agnostic reference layer - no execution steps included.
---

# Project Analysis - Shared Concepts

This skill provides the foundational terminology, contracts, and conventions shared across all stages of the project-analysis workflow.

## Scope

This skill defines:
- Common terminology and vocabulary
- Artifact output contracts
- Architecture analysis dimensions (5)
- Component analysis dimensions (4)
- Code citation and reference rules
- Mermaid diagram conventions
- Update-reminder patterns

This skill does NOT contain stage-specific execution steps. See stage-specific skills for implementation guidance.

## Quick Reference

- **Artifact Contract**: See [references/artifact-contract.md](references/artifact-contract.md)
- **Architecture Dimensions**: See [references/architecture-dimensions.md](references/architecture-dimensions.md)
- **Component Dimensions**: See [references/component-dimensions.md](references/component-dimensions.md)
- **Code Citation Rules**: See [references/code-citation.md](references/code-citation.md)
- **Mermaid Conventions**: See [references/mermaid-conventions.md](references/mermaid-conventions.md)
- **Update Reminders**: See [references/update-reminders.md](references/update-reminders.md)

## Core Concepts

### Terminology

| Term | Definition |
|------|------------|
| **Target Project** | The external project being analyzed (path provided in Stage 1) |
| **Analysis Root** | `.hyper-designer/projectAnalysis/` directory in target project |
| **Manifest** | Machine-readable JSON files in `_meta/` for cross-stage data exchange |
| **Component** | A logical unit of code with clear responsibility boundaries (auto-discovered in Stage 1) |
| **Coverage** | Extent to which source code is documented and analyzed across all dimensions |

### Artifact Locations

```
<target-project>/
├── .hyper-designer/
│   └── projectAnalysis/
│       ├── architecture.md          # System-level analysis output
│       ├── component/               # Component-level analysis outputs
│       │   ├── {componentSlug}.md
│       │   └── ...
│       └── _meta/                  # Hidden manifests (machine-readable)
│           ├── manifest.json
│           ├── system-analysis.json
│           ├── component-manifest.json
│           ├── api-manifest.json
│           ├── source-inventory.json
│           ├── components/
│           │   └── {componentSlug}.json
│           └── coverage-report.json
```

### Workflow Stages

| Stage | Name | Purpose | Skill |
|-------|------|---------|-------|
| 1 | systemAnalysis | Discover architecture, components, APIs, and generate system-level analysis | `system-analysis` |
| 2 | componentAnalysis | Analyze each component in parallel using manifest from Stage 1 | `component-analysis` |
| 3 | missingCoverageCheck | Strict coverage verification across all dimensions | `missing-coverage-check` |

## Key Principles

### 1. Manifest-Driven Orchestration

All stages exchange data through manifests in `_meta/`. Never rescan source code in later stages - use manifests as the single source of truth.

### 2. Stage-Agnostic Shared Contracts

This skill defines contracts that all stages must follow. Stage-specific skills define how to fulfill those contracts.

### 3. Strict Coverage Verification

Stage 3 performs 7 categories of strict checks:
1. Missing components
2. Missing files
3. Missing folders
4. Missing API identification
5. Insufficient Mermaid coverage
6. Broken cross-references
7. System-component inconsistency

### 4. Incremental Analysis Support

All artifacts must support resume/rerun by checking existing manifests before regeneration.

## Usage

When working on any project-analysis stage:

1. **Load this skill first** to understand shared contracts
2. **Load stage-specific skill** for implementation guidance
3. **Follow artifact contracts** when generating outputs
4. **Use shared terminology** in all documentation
5. **Apply code citation rules** when referencing source code
6. **Follow Mermaid conventions** for all diagrams
7. **Include update reminders** in all generated markdown files

## References

Detailed specifications for each concept:

- [Artifact Contract](references/artifact-contract.md) - Output file contracts and manifest schemas
- [Architecture Dimensions](references/architecture-dimensions.md) - 5 dimensions of system-level analysis
- [Component Dimensions](references/component-dimensions.md) - 4 dimensions of component-level analysis
- [Code Citation Rules](references/code-citation.md) - How to reference source code in analysis
- [Mermaid Conventions](references/mermaid-conventions.md) - Diagram standards and patterns
- [Update Reminders](references/update-reminders.md) - Self-reference patterns for maintenance
