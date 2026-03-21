---
name: projectAnalysis
description: Execute the 3-stage project analysis workflow with reusable method guidance and standardized Markdown outputs. Use when working on hyper-designer projectAnalysis stages (systemAnalysis, componentAnalysis, missingCoverageCheck), when the workflow asks to read references/*.md, or when generating architecture/component/coverage analysis artifacts under .hyper-designer/projectAnalysis/.
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

- If current stage is `systemAnalysis`, read `references/systemAnalysis.md`.
- If current stage is `componentAnalysis`, read `references/componentAnalysis.md`.
- If current stage is `missingCoverageCheck`, read `references/missingCoverageCheck.md`.

Do not skip shared/stage reference files.

## Stage-to-Reference Mapping

- shared → `references/workflowShared.md`
- `systemAnalysis` → `references/systemAnalysis.md`
- `componentAnalysis` → `references/componentAnalysis.md`
- `missingCoverageCheck` → `references/missingCoverageCheck.md`

## Shared Output Contract

- Output root: `./.hyper-designer/projectAnalysis/`
- Output format: Markdown only (`.md`)
- Use relative paths in all code/file references.
- Keep stage boundaries strict: only produce outputs required by current stage.

## Execution Discipline

1. Read only the current stage reference.
2. Produce all required outputs listed in that reference.
3. Ensure outputs are deterministic and directly reusable by the next stage.
4. Keep all paths relative (no machine-specific absolute paths).
