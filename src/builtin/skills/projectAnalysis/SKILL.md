---
name: projectAnalysis
description: Execute the 4-stage project analysis workflow with reusable method guidance and standardized Markdown outputs. Use when working on hyper-designer projectAnalysis stages (projectOverview, functionTreeAndModule, interfaceAndDataFlow, defectCheckAndPatch), when the workflow asks to read references/*.md, or when generating architecture/function/module/interface/flow analysis artifacts under .hyper-designer/projectAnalysis/.
---

# Project Analysis Skill

Use this skill as the single methodology source for the `projectAnalysis` workflow.

## Progressive Disclosure

- Keep workflow prompts minimal (only stage routing and execution intent).
- Put all detailed methodology, checklists, and output templates in `references/*.md`.
- Load only the current-stage reference to control context size.

## Stage Routing

Before reading stage-specific reference, always read shared reference:

- `references/workflowShared.md`

- If current stage is `projectOverview`, read `references/projectOverview.md`.
- If current stage is `functionTreeAndModule`, read `references/functionTreeAndModule.md`.
- If current stage is `interfaceAndDataFlow`, read `references/interfaceAndDataFlow.md`.
- If current stage is `defectCheckAndPatch`, read `references/defectCheckAndPatch.md`.

Do not skip shared/stage reference files.

## Stage-to-Reference Mapping

- shared → `references/workflowShared.md`
- `projectOverview` → `references/projectOverview.md`
- `functionTreeAndModule` → `references/functionTreeAndModule.md`
- `interfaceAndDataFlow` → `references/interfaceAndDataFlow.md`
- `defectCheckAndPatch` → `references/defectCheckAndPatch.md`

## Shared Output Contract

- Output root: `./.hyper-designer/projectAnalysis/`
- Output format: Markdown with YAML Front Matter (`.md`)
- Use relative paths in all code/file references.
- Keep stage boundaries strict: only produce outputs required by current stage.

## Multi-Agent Collaboration

**You are the orchestrator, not the sole executor.** Delegate independent research tasks to subagents for better results and manageable context.

### When to Delegate

| Task Type | Reason |
|-----------|--------|
| Deep code exploration of a specific module | Focused investigation, parallel execution |
| Understanding unfamiliar library/framework | External reference lookup |
| Analyzing complex data flow patterns | Requires thorough code traversal |
| Verifying interface contracts against code | Cross-reference validation |

### Delegation Strategy

1. **Identify independent tasks** — Tasks that don't depend on each other can run in parallel
2. **Delegate in background** — Use background execution for parallel exploration
3. **Continue with non-overlapping work** — Don't wait idle; work on synthesis while subagents explore
4. **Collect and synthesize** — Gather subagent results and integrate into your analysis

### Your Role as Orchestrator

- **Plan** the analysis approach before diving in
- **Delegate** independent exploration tasks to specialized subagents
- **Synthesize** subagent findings into coherent analysis
- **Validate** the final output meets quality standards

### Anti-Patterns

- ❌ Doing all exploration yourself (context overload)
- ❌ Delegating synthesis tasks (you must synthesize)
- ❌ Waiting for subagents when you have non-overlapping work
- ❌ Delegating without clear goals (vague prompts)

## Execution Discipline

1. Read only the current stage reference.
2. Plan your approach and identify delegable tasks.
3. Fire subagents for independent exploration in parallel.
4. Produce all required outputs listed in that reference.
5. Ensure outputs are deterministic and directly reusable by the next stage.
6. Keep all paths relative (no machine-specific absolute paths).
7. Generate Mermaid diagrams for all relationships.
8. Use YAML Front Matter for all documents.
9. Support extensibility for future additions.

## AI Development Support

This workflow is designed to support AI-driven development:
- **Function Tree**: Helps AI quickly locate function implementations
- **Module Relationships**: Helps AI understand dependency impact
- **Interface Contracts**: Helps AI understand API usage
- **Data Flow**: Helps AI trace data processing
- **Defect Check**: Ensures analysis completeness for AI consumption
