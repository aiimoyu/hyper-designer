# Stage 2: Component Analysis

```xml
<workflow_context>
  <pipeline>
    <pre_stage id="systemAnalysis"/>
    <curr_stage id="componentAnalysis"/>
    <next_stage>null</next_stage>
  </pipeline>
</workflow_context>
```

## Important Note

This stage is part of the **project-analysis** skill. project-analysis is a project analysis workflow that contains 2 stages:

1. System Analysis
2. Component Analysis (current stage)

When using the prompt for this stage, please make sure you understand the context and objective of the entire skill.

## Task

Perform in-depth analysis of each module/component identified in Stage 1, and generate separate component detail files.

## Execution Steps

- [Proc1.1] Confirm the target project path
- [Proc1.2] Read `references/phase2-component-analysis.md` in the `project-analysis` skill to obtain the complete methodology`
- [Proc1.3] Load `overview.md`, `architecture.md`, and `modules.md` to obtain the component list and related information
- [Proc2] Execute according to stages S1-S8 in `references/phase2-component-analysis.md`, and skipping steps is prohibited.
- [Proc3.1] Use the `hd_handover` tool to end the workflow.
- [Proc3.2] Stop

## Output

Component analysis files in the `components/` directory (such as `C001-Core.md`)

## Work Handover

You are the final stage of this workflow. After completion, please notify the user that the analysis is complete and enter the closing process.

**Work Handover**: NEVER stop any work without using `hd_handover` to end the workflow.

If you complete the work without using `hd_handover` to explicitly end the workflow, the previous work status and context will not be properly cleared when the user enters the workflow next time, which may cause confusion and errors.
