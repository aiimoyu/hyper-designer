## [2026-02-10] Task 3: Convert Workflow Prompt .md Files

Successfully converted all 8 workflow prompt files from hardcoded `delegate_task(subagent_type="HCritic", ...)` syntax to `{{TOOL:delegate_critic_review}}` placeholders.

**Files Converted:**
- src/workflow/prompts/dataCollection.md
- src/workflow/prompts/IRAnalysis.md  
- src/workflow/prompts/scenarioAnalysis.md
- src/workflow/prompts/useCaseAnalysis.md
- src/workflow/prompts/functionalRefinement.md
- src/workflow/prompts/requirementDecomposition.md
- src/workflow/prompts/systemFunctionalDesign.md
- src/workflow/prompts/moduleFunctionalDesign.md

**Verification Results:**
- ✅ 0 remaining `delegate_task(` calls without placeholders
- ✅ All 8 files contain exactly 1 `{{TOOL:delegate_critic_review}}` placeholder
- ✅ Domain content (Chinese text, stage descriptions, skill references) preserved unchanged
- ✅ Tests pass: 76/79 tests passing (3 pre-existing failures unrelated to changes)

**Pattern Confirmed:**
- Consistent replacement: `delegate_task(subagent_type="HCritic", load_skills=[], ...)` → `{{TOOL:delegate_critic_review}}`
- Placeholder format matches established convention: `{{TOOL:snake_case_name}}`
- No additional tool syntax found in remaining files

**Impact:**
- Workflow prompts now decoupled from specific tool implementation
- Enables dynamic tool resolution via PromptResolver system
- Maintains backward compatibility through placeholder substitution