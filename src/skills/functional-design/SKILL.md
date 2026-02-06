---
name: functional-design
description: System and module functional design for requirements engineering. Use when workflow state is `systemFunctionalDesign` or `moduleFunctionalDesign`, or when detailed architecture design, technology selection, component design, or API specification is needed. Supports both system-level (architecture, tech stack, data models) and module-level (class design, design patterns, detailed logic) design tasks.
---

# Functional Design Skill

Design system architectures and module implementations based on decomposed requirements. This skill supports both system-level and module-level design with progressive detail.

## Usage

**System-level design**: Generate overall architecture, tech stack selection, data models, and interface specifications.

**Module-level design**: Generate detailed class designs, design patterns, algorithms, and implementation specifications.

## Quick Start

### System Design
For system-level architecture and tech stack design, see [references/system-design.md](references/system-design.md).

### Module Design
For module implementation and detailed component design, see [references/module-design.md](references/module-design.md).

## Inputs

All design tasks require:
- **SR-AR分解分配表** (System/Activity Requirements Decomposition): Located in `.hyper-designer/systemRequirementDecomposition/` or `.hyper-designer/activityRequirementDecomposition/`
- **项目代码**: Context files in the project
- **参考项目代码**: Reference implementations (if available)
- **功能库**: Reusable component library (if available)

## Outputs

**System design**: `XX功能系统设计说明书.md` in `.hyper-designer/systemFunctionalDesign/`

**Module design**: `XXX模块功能设计说明书.md` in `.hyper-designer/moduleFunctionalDesign/{模块名}/`

## Design Principles

### Evidence-Based Selection
Every architecture decision and technology choice must be justified with:
- Decision drivers (requirements, constraints, NFRs)
- Alternative options considered
- Trade-off analysis (cost, complexity, maintainability, performance)
- Risk assessment

### SOLID + Design Patterns
Module designs must follow SOLID principles:
- **Single Responsibility**: Clear, focused module purpose
- **Open/Closed**: Extensible via interfaces
- **Liskov Substitution**: Interchangeable implementations
- **Interface Segregation**: Narrow, focused interfaces
- **Dependency Inversion**: Depend on abstractions

Apply design patterns appropriately (Strategy, Factory, Observer, Adapter, etc.) and explain why each pattern solves a specific coupling or extensibility problem.

### Progressive Architecture
Start simple, design for evolution:
- Avoid premature optimization
- Build extensibility points
- Document upgrade paths
- Map NFRs to architecture decisions

## Quality Checklist

Before finalizing any design document, verify:

**System design**:
- [ ] Architecture diagram covers all modules and external dependencies
- [ ] Tech stack choices have trade-off records
- [ ] Key data models defined with consistency strategies
- [ ] Interface protocols and auth strategies specified
- [ ] NFRs mapped to implementation strategies
- [ ] Deployment and CI/CD process documented
- [ ] Test strategy covers integration, performance, fault tolerance
- [ ] Risk/trade-off records preserved

**Module design**:
- [ ] Module responsibilities clear and non-overlapping
- [ ] Interface specs include error semantics, SLA, and examples
- [ ] Internal component boundaries and responsibilities clear
- [ ] Key algorithms have pseudo-code or flowcharts
- [ ] Data models include fields, indexes, consistency notes
- [ ] Unit/integration/performance test cases cover key scenarios
- [ ] Deployment config and operational checks documented

## Common Pitfalls

| Pitfall | Recognition Signal | Strategy |
|---------|-------------------|----------|
| Premature optimization | Complex architecture for unproven load | Use evolvable design, implement simple solution with extension points |
| Preference-driven selection | Team preference drives tech choices | Require trade-off tables with evidence (benchmarks, community support) |
| Ignoring operations | Post-deployment observability/recovery issues | Define observability and drill strategies during design |
| Over-coupling | Module frequently calls other module internals | Introduce clearer interfaces, use events/messages for decoupling |
| Missing edge cases | No handling for concurrency or null cases | List boundary conditions, cover in unit tests |
| No fallback mechanism | Third-party failure causes chain unavailability | Implement circuit breakers, retries, and degradation paths |

## Workflow Integration

**When to use this skill**:
- Workflow state is `systemFunctionalDesign` → Use system design
- Workflow state is `moduleFunctionalDesign` → Use module design
- System requirements decomposition completed → Ready for system design
- System functional design completed → Ready for module design

**Document locations**:
- System design drafts: `.hyper-designer/systemFunctionalDesign/draft.md`
- Module design drafts: `.hyper-designer/moduleFunctionalDesign/{模块名}/draft.md`

**Pre-requisites**:
- System design requires: System requirement decomposition document
- Module design requires: System functional design document

**Next steps**:
- After system design: Submit to HCritic review, then proceed to activity requirement decomposition
- After module design: Submit to HCritic review, then proceed to implementation
