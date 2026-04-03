## Current Stage: Development Plan (developmentPlan)

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="developmentPlan"/>
    <pre_stage>requirementDesign</pre_stage>
  </pipeline>
  <executing_agent>HDArchitect</executing_agent>
  <core_objective>
    Convert the single-module design into an executable and verifiable SDD plan,
    including task waves, complexity, acceptance criteria, and TDD scenarios.
  </core_objective>
</workflow_context>
```

### Execution Roles

- **Executing Agent**: `HDArchitect`
- **Process Skill**: `hd-review-pipeline`
- **Core Skill**: `requirements-designer`

### Execution Requirements

Before starting content generation, the following must be executed strictly in order:

1. Use `hd-review-pipeline` to obtain and execute the current stage workflow;
2. Load `requirements-designer` according to the workflow guidance;
3. Read the reference file: `requirements-designer/references/phase3-development-plan.md`.

### Generation Constraints

You may only generate the "Development Plan" based on the **guidelines and templates** in the reference file above:

- Do not skip document reading;
- ALWAYS first check whether the `{project path}\.hyper-designer/codebase-analysis/SKILL.md` directory exists within that project directory when exploring a project. If it does, read it, this will improve your understanding of the project and speed up the design process.
- MUST combine the project analysis from `{project path}\.hyper-designer/codebase-analysis/SKILL.md` with the actual code files, and always treat the actual code as the source of truth.
- Do not use default templates, rewrite the structure on your own, or omit required fields;
- Do not generate development tasks beyond the **single-module scope**.

### Stage Deliverables

- **File Name**: `{module_name}-dev-plan.md`
- **Output Path**: `.hyper-designer/developmentPlan/{module_name}-dev-plan.md`
- **Format Requirement**: Markdown, and it must fully comply with the Skill template structure.

### Quality Review

After writing the document, you must call:

`HD_TOOL_DELEGATE(subagent=HCritic, skill=requirements-designer)`

and send the following delegation prompt:

```markdown
# Stage Review Task: Development Plan Review

## Review Objective
Please act as a senior architecture reviewer and conduct a strict review of the development plan documents in the following directory:
`.hyper-designer/developmentPlan/`

## Review Process

- [S1] Load the Skill to obtain review criteria
   **You must use the `requirements-designer` Skill for the review.**
- [S2] Read the review criteria
   You must read the Skill reference files:
   1. `[requirements-designer]/references/reviewer.md`
   2. `[requirements-designer]/references/development-plan-review-checklist.md`
- [S3] Execute the review
   1. Check the document content item by item against every rule in the checklist
   2. Mark the milestone as completed
   3. Output the review result


## Output Requirements
Please output the following based on the Checklist:
1. **Overall Review Score** (0-100)
2. **Defects and Revision Suggestions** (categorized by Blocker / Critical / Minor)
3. **Final Conclusion** (PASS / FAIL)

## Tool Requirement
After the review is completed, you must call `hd_record_milestone` to record the milestone status.
For both **Pass** and **Conditional Pass**, the milestone must be marked as completed.
```
