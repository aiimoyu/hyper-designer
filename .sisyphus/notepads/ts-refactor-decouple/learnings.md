# Learnings - TypeScript Refactoring & Frontend Decoupling

## Conventions & Patterns

*(Subagents will append discoveries here)*
Learnings from package infrastructure setup:
- exactOptionalPropertyTypes: true causes strict checking of optional properties, requiring explicit undefined handling
- AgentConfig interface has required 'model' property, but factory functions return optional model
