# Issues & Gotchas

## Known Issues

- Project uses ESM (`import.meta.url`) - requires `"type": "module"` in package.json
- `@opencode-ai/*` imports need ambient declarations (provided by runtime)
- Workflow state schema must NOT change (backward compatibility)

*(Subagents will append problems encountered here)*
TypeScript errors from initial typecheck:
src/agents/HArchitect/index.ts(155,3): error TS2375: Type '{ name: string; description: string; mode: AgentMode; model: string | undefined; temperature: number; maxTokens: number; variant: string | undefined; prompt: string; permission: Record<...> | { ...; }; color: string; tools: { ...; }; }' is not assignable to type 'AgentConfig' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
src/agents/HCollector/index.ts(130,3): error TS2375: Type '{ name: string; description: string; mode: AgentMode; model: string | undefined; temperature: number; maxTokens: number; variant: string | undefined; prompt: string; permission: Record<...> | { ...; }; color: string; tools: { ...; }; }' is not assignable to type 'AgentConfig' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
src/agents/HCritic/index.ts(71,3): error TS2375: Type '{ name: string; description: string; mode: AgentMode; model: string | undefined; temperature: number; maxTokens: number; variant: string | undefined; prompt: string; permission: {}; color: string; tools: {}; }' is not assignable to type 'AgentConfig' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
src/agents/HEngineer/index.ts(151,3): error TS2375: Type '{ name: string; description: string; mode: AgentMode; model: string | undefined; temperature: number; maxTokens: number; variant: string | undefined; prompt: string; permission: {}; color: string; tools: {}; }' is not assignable to type 'AgentConfig' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
src/config/loader.ts(87,5): error TS2375: Type '{ $schema: string | undefined; agents: { [x: string]: AgentOverrideConfig; }; }' is not assignable to type 'HDConfig' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
src/workflow/hooks/opencode/workflow.ts(11,7): error TS6133: 'SKILLS_DIR' is declared but its value is never read.
src/workflow/hooks/opencode/workflow.ts(117,21): error TS7031: Binding element 'event' implicitly has an 'any' type.
