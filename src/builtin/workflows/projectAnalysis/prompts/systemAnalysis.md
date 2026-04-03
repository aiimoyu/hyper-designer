# Stage 1: System Analysis

```xml
<workflow_context>
  <pipeline>
    <pre_stage>null</pre_stage>
    <curr_stage id="systemAnalysis"/>
    <next_stage id="componentAnalysis"/>
  </pipeline>
</workflow_context>
```

## Important Note

This stage (system-analysis) is part of the **project-analysis** skill. project-analysis is a project analysis workflow that contains 2 stages:

1. System Analysis (current stage)
2. Component Analysis (execution prohibited)

When using the prompt for this stage, please make sure you understand the context and objective of the entire skill.

## Task

Analyze the target project and generate 3 core documents.

## Execution Steps

- [Proc1.1] Confirm the target project path
- [Proc1.2] Read `references/phase1-overview.md` in the `project-analysis` skill to obtain the complete methodology`
- [Proc2] Execute according to stages S1-S8 in `references/phase1-system-analysis.md`, and skipping steps is prohibited.
- [Proc3.1] Confirm the user's intent (continue to component analysis or end the workflow)
- [Proc3.2] Use the `hd_handover` tool to explicitly hand over the work to the `component-analysis` stage or end the workflow.
- [Proc3.3] Stop

## Output

1. `overview.md` — Project Overview
2. `architecture.md` — System Architecture
3. `modules.md` — Module Analysis
4. `SKILL.md` — Skill Documentation (including methodology and output instructions)

## Work Handover

**Single Responsibility**: You do not have the capability to execute the `component-analysis` stage. Since you are not a professional component analyst, using the `hd_handover` tool can explicitly hand over the work to a more specialized component-analysis agent, avoiding ineffective attempts and possible erroneous output in the component analysis stage.
**Work Handover**: NEVER directly enter the component analysis stage. Use the `hd_handover` tool for explicit handover, and stop all work.
**End Work**: If the user decides not to proceed to the next stage and end directly, you must use `hd_handover` and pass the parameter `end=true` to end the workflow. Otherwise, when the user enters the workflow next time, the previous work status and context will not be properly cleared, which may cause confusion and errors.
