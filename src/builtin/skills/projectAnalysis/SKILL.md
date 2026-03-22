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

## Execution Discipline

1. Read only the current stage reference.
2. Produce all required outputs listed in that reference.
3. Ensure outputs are deterministic and directly reusable by the next stage.
4. Keep all paths relative (no machine-specific absolute paths).
5. Generate Mermaid diagrams for all relationships.
6. Use YAML Front Matter for all documents.
7. Support extensibility for future additions.

## AI Development Support

This workflow is designed to support AI-driven development:
- **Function Tree**: Helps AI quickly locate function implementations
- **Module Relationships**: Helps AI understand dependency impact
- **Interface Contracts**: Helps AI understand API usage
- **Data Flow**: Helps AI trace data processing
- **Defect Check**: Ensures analysis completeness for AI consumption
