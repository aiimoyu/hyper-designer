# Component Dimensions

Component-level analysis must cover exactly 4 dimensions. Each component from Stage 1's manifest is analyzed independently.

## The 4 Dimensions

### 1. Responsibility (职责)

**Purpose**: Define what the component does and its single responsibility.

**Analysis Focus**:
- Primary purpose and business logic
- Scope boundaries (what's in vs out)
- Responsibility cohesion
- Adherence to Single Responsibility Principle
- Business rules encapsulated
- Side effects and external interactions

**Required Outputs**:
- Responsibility statement (1-2 sentences)
- In-scope functionality list
- Out-of-scope exclusions
- Responsibility cohesion score
- Business rules inventory

**Questions to Answer**:
- What is this component's primary job?
- What business logic does it contain?
- What should it NOT do?
- Is it focused on a single responsibility?
- What side effects does it have?

---

### 2. Interfaces (接口)

**Purpose**: Document all public contracts and communication boundaries.

**Analysis Focus**:
- Public API surface (functions, methods, classes)
- Input parameters and validation
- Return types and error handling
- Event emissions (if applicable)
- Dependencies on other components
- Protocol specifications (HTTP, RPC, event-based)
- Interface versioning strategy

**Required Outputs**:
- Interface inventory table
- Input/Output specifications
- Error contract documentation
- Dependency list with coupling level
- Interface diagrams (Mermaid)
- Usage examples

**Mermaid Diagram Types**:
- `classDiagram` for interface contracts
- `sequenceDiagram` for interaction patterns

**Questions to Answer**:
- What does this component expose?
- What are the input/output contracts?
- How does it communicate with other components?
- What are the error cases?
- How are interfaces versioned?

---

### 3. Data and State (数据与状态)

**Purpose**: Understand data structures, state management, and persistence within component.

**Analysis Focus**:
- Internal data structures (classes, types, schemas)
- State variables and their lifecycle
- Data transformation logic
- Persistence mechanisms (if any)
- State mutation patterns
- Immutable vs mutable data
- Thread-safety considerations

**Required Outputs**:
- Data model documentation
- State variable inventory
- Data flow within component (Mermaid)
- Persistence strategy (if applicable)
- State mutation patterns
- Data validation rules

**Mermaid Diagram Types**:
- `classDiagram` for data structures
- `stateDiagram` for state machines
- `graph LR` for internal data flow

**Questions to Answer**:
- What data does this component manage?
- How is state stored and modified?
- What data transformations occur?
- Is data persisted? How?
- Are there thread-safety concerns?
- What are the data invariants?

---

### 4. Positioning (定位)

**Purpose**: Place component in broader system context and identify its architectural role.

**Analysis Focus**:
- Layer assignment (API, business, data, UI, middleware, utility)
- Subdomain or bounded context
- Position in call hierarchy (upstream/downstream)
- Deployment boundaries
- Scaling characteristics
- Criticality level (core vs auxiliary)
- Relationship to business capabilities

**Required Outputs**:
- Layer classification
- Subdomain mapping
- Upstream/downstream dependencies
- Deployment unit specification
- Scaling profile
- Criticality assessment
- Business capability mapping

**Mermaid Diagram Types**:
- `graph TD` for position in system
- `graph LR` for dependency context

**Questions to Answer**:
- Which layer does this belong to?
- What subdomain does it serve?
- Who calls this component?
- What does this component call?
- How does it scale?
- Is it critical or auxiliary?
- What business capability does it enable?

## Input/Output/Pos Summary

Each component analysis must include a summary table:

| Aspect | Description |
|--------|-------------|
| **Input** | External dependencies, API parameters, event subscriptions |
| **Output** | Public APIs, emitted events, data transformations |
| **Pos** | Layer, subdomain, call hierarchy position, deployment unit |

## Dimension Completion Checklist

For each component and each dimension, ensure:

- [ ] Analysis section exists in component markdown
- [ ] Required outputs are present
- [ ] Mermaid diagrams are included (where applicable)
- [ ] Key questions are answered
- [ ] Findings reference actual code files
- [ ] Dependencies are traced to component manifest
- [ ] Position is consistent with system analysis

## Component Granularity Guidelines

Component analysis should respect the granularity determined in Stage 1:

- **Too granular**: File-level analysis (avoid - too many components)
- **Too coarse**: Entire project as one component (avoid - loses structure)
- **Just right**: Logical units with clear responsibility boundaries

When analyzing components:

1. **Use component-manifest.json as source of truth** - don't rediscover components
2. **Analyze each component independently** - parallel execution
3. **Reference system analysis** - ensure consistency with architecture findings
4. **Document component boundaries** - what's in vs out
5. **Map to subdomains** - identify business domain alignment

## Cross-Component Relationships

While analyzing each component independently, document:

- **Upstream dependencies**: Components that call this one
- **Downstream dependencies**: Components this one calls
- **Shared interfaces**: APIs used by multiple components
- **Data contracts**: Shared data structures
- **Deployment coupling**: Components deployed together

These relationships are aggregated in Stage 3's coverage check to verify consistency between system and component analyses.
