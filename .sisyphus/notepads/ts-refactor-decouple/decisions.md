# Architectural Decisions

## Key Decisions Made

- **Core/Adapter Separation**: `src/` is framework-agnostic, adapters in `opencode/`
- **Factory Pattern**: Base `createAgent()` replaces duplicated agent code
- **Import Hierarchy**: types → config → utils → workflow → agents → index
- **No Path Aliases**: Would break OpenCode runtime transpilation

*(Subagents will append implementation decisions here)*
