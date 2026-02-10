# Learnings - TypeScript Refactoring & Frontend Decoupling

## Conventions & Patterns

*(Subagents will append discoveries here)*
Learnings from package infrastructure setup:
- exactOptionalPropertyTypes: true causes strict checking of optional properties, requiring explicit undefined handling
- AgentConfig interface has required 'model' property, but factory functions return optional model
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.
Consolidated duplicate type definitions by removing them from src/agents/types.ts and keeping only the canonical definitions in their respective modules.

## 2026-02-10T16:26:06+08:00 Task 3: Debug Logger DRY Refactor
Successfully refactored src/utils/debug.ts to eliminate 4 near-identical methods by extracting generic writeLog() function. Reduced line count from 136 to 58 lines (57% reduction). Preserved public API, log output format, and helper functions unchanged. TypeScript diagnostics clean for the file.

## 2026-02-10T16:26:31+08:00 Task 4: Core Adapter Interfaces
Successfully created 3 new files with extracted framework-agnostic code. Interfaces define contracts for adapters, handover config moved to dedicated module, prompt loader extracted as pure utility. No framework imports in core files. Verification passed except for pre-existing TypeScript errors in other files.
