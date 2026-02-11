## Learnings
- Split HCritic prompt into identity/constraints/step/standard/interview while preserving reviewer-only scope and review output structure.
- Agent factory now appends generated tools prompt after prompt files; default tool list is ask_user/task.
- Created HCollector split prompt files (identity/constraints/step/standard/interview) and replaced tool placeholders with natural language descriptions.
- Added integration test for prompt composition to verify split prompt ordering, tool prompt generation, placeholder absence, and workflowId persistence.
