---
name: component-analysis
description: Stage 2 component analysis orchestration for project-analysis workflow. Consumes `_meta/component-manifest.json` as the sole source of truth and performs manifest-driven per-component analysis with fan-out orchestration. Defines fan-out input/output contracts, max concurrency, retry/recovery semantics, and reconciliation step. Forbids whole-project rediscovery during Stage 2.
---

# Component Analysis Skill (Stage 2)

## Purpose

Orchestrate parallel component analysis based on the component manifest produced by Stage 1. This skill defines how Stage 2 consumes the manifest, dispatches per-component analysis tasks, aggregates results, and handles failures.

## Critical Constraint

**`_meta/component-manifest.json` is the ONLY source of truth for component discovery in Stage 2.**

- Do NOT rescan the project directory to discover components
- Do NOT use directory heuristics or file patterns to identify components
- Do NOT override the manifest with any alternative discovery method
- The manifest from Stage 1 defines the complete and authoritative component set

## Input Contract

### Required Input

- **Component manifest**: `_meta/component-manifest.json` from Stage 1
  - Contains the complete list of components to analyze
  - Each entry defines: `componentSlug`, `name`, `description`, `path`, `type`, `dependencies`
  - This manifest is immutable during Stage 2 execution

### Optional Context

- **System analysis output**: `architecture.md` from Stage 1
- **API manifest**: `_meta/api-manifest.json` from Stage 1
- **Source inventory**: `_meta/source-inventory.json` from Stage 1

## Output Contract

### Per-Component Outputs (Required)

For each component in the manifest, produce:

1. **Component markdown**: `component/{componentSlug}.md`
   - Human-readable component analysis
   - Covers all 4 component dimensions (see below)
   - Includes code references, Mermaid diagrams, and cross-references

2. **Component metadata**: `_meta/components/{componentSlug}.json`
   - Machine-readable component contract
   - Structured data for downstream validation and reconciliation
   - Includes: interfaces, dependencies, coverage metrics, quality indicators

### Aggregation Output

- **Component analysis summary**: `_meta/component-analysis-summary.json`
  - Lists all components analyzed
  - Tracks success/failure status per component
  - Provides reconciliation input for Stage 3

## Component Analysis Dimensions

Each component analysis MUST cover these 4 dimensions:

### 1. Input/Output/Position (IOP)
- Identify all inputs: parameters, events, messages, external API calls
- Identify all outputs: return values, emitted events, side effects
- Determine position in call chain: entry point, intermediate, leaf, cross-cutting
- Map data flow through the component

### 2. Responsibility and Scope
- Define core responsibilities: what business logic or infrastructure concerns it owns
- Identify boundaries: what it does NOT do
- Map to subdomain: which DDD bounded context or business domain it belongs to
- Identify single responsibility violations if any

### 3. Interface Contracts
- Document all public interfaces: methods, APIs, message handlers
- Specify input/output schemas with types and constraints
- Define SLA requirements: latency, throughput, error rates
- Identify external dependencies and integration patterns

### 4. Internal Structure and Patterns
- Map internal modules/classes and their relationships
- Identify design patterns in use: factory, strategy, observer, etc.
- Analyze complexity: cyclomatic complexity, nesting depth, code duplication
- Flag technical debt and refactoring opportunities

## Fan-Out Orchestration

### Concurrency Control

- **Max concurrent components**: 5 (configurable)
- **Dispatch strategy**: Parallel fan-out with controlled concurrency
- **Ordering**: No dependency-based ordering required (manifest defines dependencies)
- **Isolation**: Each component analysis runs in isolated context

### Retry and Recovery

| Failure Type | Retry Strategy | Max Attempts | Recovery Action |
|--------------|----------------|---------------|-----------------|
| Transient error (network, timeout) | Exponential backoff | 3 | Retry component analysis |
| Component not found in manifest | No retry | 0 | Fail fast, log error |
| Missing required manifest field | No retry | 0 | Fail fast, log validation error |
| Analysis timeout (>5 min) | No retry | 0 | Mark as failed, continue with others |
| Output write failure | No retry | 0 | Mark as failed, preserve in-memory result |

### Failure Semantics

- **Partial success allowed**: Continue processing other components if some fail
- **Failure isolation**: One component failure does not abort Stage 2
- **Failure tracking**: Record failure reason and component in summary
- **Reconciliation target**: Failed components are flagged for Stage 3 coverage check

### Reconciliation Step

After all component analyses complete:

1. **Compare manifest vs. outputs**
   - Verify every component in manifest has corresponding markdown and JSON outputs
   - Flag missing outputs as failures

2. **Validate cross-references**
   - Check that component dependencies reference valid componentSlugs
   - Verify Mermaid diagram nodes match manifest entries
   - Validate code references point to existing files

3. **Aggregate quality metrics**
   - Collect coverage percentages from all component JSON outputs
   - Compute overall component analysis health score
   - Identify components with low coverage or quality issues

4. **Produce summary**
   - Write `_meta/component-analysis-summary.json` with:
     - `totalComponents`: count from manifest
     - `successfulComponents`: count with valid outputs
     - `failedComponents`: list of componentSlugs that failed
     - `qualityScore`: aggregated metric
     - `reconciliationIssues`: list of cross-reference problems

## Workflow Integration

### When to Use

- Workflow stage: `componentAnalysis` in `projectAnalysis` workflow
- Agent: `HAnalysis` (base prompt + stage-specific loading)
- Context: After Stage 1 completes, before Stage 3

### Prerequisites

- `_meta/component-manifest.json` exists and is valid JSON
- Stage 1 system analysis completed successfully
- Target project `.hyper-designer/projectAnalysis/` directory exists

### Next Steps

- Successful Stage 2 → Proceed to Stage 3 (`missingCoverageCheck`)
- Stage 3 will use component outputs for strict coverage validation

## Quality Checklist

Before completing Stage 2:

- [ ] Read `_meta/component-manifest.json` as the ONLY component source
- [ ] Do NOT scan project directory for components
- [ ] Every component in manifest has both markdown and JSON outputs
- [ ] Each component analysis covers all 4 dimensions
- [ ] Component JSON outputs are valid and machine-readable
- [ ] Component markdown includes code references and Mermaid diagrams
- [ ] Reconciliation summary written to `_meta/component-analysis-summary.json`
- [ ] All cross-references validated (dependencies, diagram nodes, code paths)
- [ ] Failed components tracked and reported in summary
- [ ] Concurrency limits respected during fan-out

## Anti-Patterns

**Do NOT:**

- Rediscover components from directory structure during Stage 2
- Use file patterns or heuristics to identify components
- Override the manifest with any alternative component list
- Fail the entire stage because one component analysis fails
- Skip the reconciliation step after fan-out completes
- Produce only markdown without the machine-readable JSON contract
- Allow concurrent analyses to exceed the configured maximum

**DO:**

- Treat `_meta/component-manifest.json` as the immutable source of truth
- Process components in the exact order and set defined by the manifest
- Continue with remaining components when individual analyses fail
- Validate all cross-references before declaring Stage 2 complete
- Generate both human-readable and machine-readable outputs per component
- Respect concurrency limits and retry policies
