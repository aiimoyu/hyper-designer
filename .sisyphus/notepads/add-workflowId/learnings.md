
## Task: Add workflowId field to workflow state management

### Changes Made

#### 1. WorkflowState Interface (`src/workflow/state.ts`)
- Added `workflowId: string` as a required field to the WorkflowState interface
- Positioned as the first field for clarity

#### 2. initializeWorkflowState Function
- Now extracts `workflowId` from `definition.id` 
- Ensures new state files always include the workflowId field

#### 3. readWorkflowStateFile Function
- Added backward compatibility logic with null coalescing: `parsed.workflowId ?? "traditional"`
- Legacy state files without workflowId will load with "traditional" as default
- Fallback state (when file doesn't exist) also includes "traditional" as workflowId

#### 4. Test Coverage
- Updated existing test to verify `workflowId` is set correctly from definition
- Added new test: "loads legacy state file without workflowId with default value"
- Test verifies backward compatibility by manually creating a legacy state file without workflowId

### Key Implementation Details

**Backward Compatibility Strategy:**
- Used null coalescing operator (`??`) to provide default value
- Default is "traditional" which matches the legacy 8-stage workflow id
- No migration of existing files needed - they work transparently

**Source of workflowId:**
- Comes from `WorkflowDefinition.id` field
- Passed via `initializeWorkflowState(definition)` call
- Plugin layer will provide this from hd-config.json.workflow

### Test Results
- All 21 tests passing
- No TypeScript errors
- Verified: new state files include workflowId
- Verified: legacy files load with "traditional" default

### Dependencies
- This is Task 3 of 9
- Can run in parallel with Task 1 and 2
- Blocks: Task 8 (agents need workflowId in state)
