## Current Stage: Requirement Analysis (requirementAnalysis)

```xml
<workflow_context>
  <pipeline>
    <curr_stage id="requirementAnalysis"/>
    <pre_stage>null</pre_stage>
  </pipeline>
  <executing_agent>HDArchitect</executing_agent>
  <core_objective>
    Consolidate requirement and scenario analysis within single-module scope,
    producing a streamlined output for downstream stages.
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
3. Read the reference file: `requirements-designer/references/s1-requirements-analysis.md`.

### Generation Constraints

You may only generate the "Requirements Analysis Specification" based on the **guidelines and templates** in the reference file above:

- Do not skip document reading;
- Do not use default templates, rewrite the structure on your own, or omit required fields;
- Do not generate redundant requirements beyond the **single-module scope**.

### Stage Deliverables

- **File Name**: `Requirements Analysis Specification.md`
- **Output Path**: `.hyper-designer/requirementAnalysis/Requirements Analysis Specification.md`
- **Format Requirement**: Markdown, and it must fully comply with the Skill template structure.

### Quality Review

After writing the document, you must call:

`HD_TOOL_DELEGATE(subagent=HCritic, skill=requirements-designer)`

and send the following delegation prompt:

```markdown
# Stage Review Task: Requirements Analysis Specification Review

## Review Objective
Please act as a senior architecture reviewer and conduct a strict review of the following document:
`.hyper-designer/requirementAnalysis/Requirements Analysis Specification.md`

## Review Process

- [S1] Load the Skill to obtain review criteria
   **You must use the `requirements-designer` Skill for the review.**
- [S2] Read the review criteria
   You must read the Skill reference files:
   1. `[requirements-designer]/references/reviewer.md`
   2. `[requirements-designer]/references/requirements-analysis-review-checklist.md`
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
