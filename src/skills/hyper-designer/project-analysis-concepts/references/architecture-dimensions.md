# Architecture Dimensions

System-level analysis must cover exactly 5 architecture dimensions. Each dimension provides a different lens for understanding the target project.

## The 5 Dimensions

### 1. Structure (结构)

**Purpose**: Understand the overall organization and layout of the codebase.

**Analysis Focus**:
- Directory structure and organization patterns
- Module boundaries and separation of concerns
- Layer architecture (API, business, data, UI, middleware, utility)
- Package/module composition
- Physical vs logical structure alignment

**Required Outputs**:
- Directory tree visualization (Mermaid)
- Layer diagram showing boundaries
- Module responsibility matrix
- Structural patterns identified (e.g., MVC, Clean Architecture, Hexagonal)

**Mermaid Diagram Types**:
- `graph TD` for directory hierarchy
- `graph LR` for layer relationships

**Questions to Answer**:
- How is the code organized?
- What are the main modules and their responsibilities?
- Are there clear layer boundaries?
- Does the structure follow established patterns?

---

### 2. Dependencies (依赖关系)

**Purpose**: Map the web of relationships between modules, components, and external libraries.

**Analysis Focus**:
- Internal dependencies (module-to-module, component-to-component)
- External dependencies (third-party libraries, frameworks)
- Dependency direction and cycles
- Coupling levels (tight vs loose)
- Dependency injection patterns
- Version constraints and compatibility

**Required Outputs**:
- Dependency graph (Mermaid)
- Dependency matrix
- Circular dependency report (if any)
- External dependency inventory
- Coupling analysis

**Mermaid Diagram Types**:
- `graph TD` for dependency hierarchy
- `graph LR` for component interaction flow

**Questions to Answer**:
- What depends on what?
- Are there circular dependencies?
- How coupled are the components?
- What external libraries are used?
- Are there dependency risks (outdated, unmaintained)?

---

### 3. Data Flow (数据流)

**Purpose**: Trace how data moves through the system from input to storage and back.

**Analysis Focus**:
- Entry points (API endpoints, event handlers, CLI commands)
- Data transformation steps
- Validation and sanitization points
- Database operations and queries
- Caching strategies
- Error handling in data flow
- Async processing patterns

**Required Outputs**:
- Data flow diagrams (Mermaid)
- Critical path analysis
- Data transformation pipeline documentation
- Database interaction patterns
- Cache strategy documentation

**Mermaid Diagram Types**:
- `sequenceDiagram` for request-response flows
- `graph LR` for pipeline stages
- `stateDiagram` for state transitions in data processing

**Questions to Answer**:
- How does data enter the system?
- What transformations occur?
- Where is data stored?
- How is data validated?
- Are there bottlenecks in data flow?
- What error handling exists?

---

### 4. State Management (状态管理)

**Purpose**: Understand how the system manages and persists state across requests and components.

**Analysis Focus**:
- In-memory state patterns (singletons, globals, caches)
- Database state (schemas, models, migrations)
- Session management
- Distributed state (Redis, message queues)
- State synchronization mechanisms
- Immutable vs mutable state patterns
- State consistency guarantees

**Required Outputs**:
- State model diagrams (Mermaid)
- Database schema documentation
- State lifecycle documentation
- Concurrency control mechanisms
- State persistence strategies

**Mermaid Diagram Types**:
- `classDiagram` for data models
- `stateDiagram` for state machines
- `erDiagram` for database relationships

**Questions to Answer**:
- What state exists in the system?
- Where is state stored?
- How is state accessed and modified?
- Are there race conditions?
- How is state synchronized?
- What are the consistency guarantees?

---

### 5. Patterns and Anti-Patterns (模式与反模式)

**Purpose**: Identify architectural patterns being used and anti-patterns that may cause issues.

**Analysis Focus**:
- Design patterns in use (Singleton, Factory, Observer, Strategy, etc.)
- Architectural patterns (MVC, MVP, MVVM, Clean Architecture, etc.)
- Anti-patterns (God Objects, Spaghetti Code, Magic Numbers, etc.)
- Code smells (Long Methods, Large Classes, Duplicated Code, etc.)
- SOLID principles adherence
- DRY (Don't Repeat Yourself) violations
- YAGNI (You Aren't Gonna Need It) violations

**Required Outputs**:
- Pattern inventory with locations
- Anti-pattern catalog with severity ratings
- SOLID principles assessment
- Code quality metrics
- Refactoring recommendations

**Mermaid Diagram Types**:
- `graph TD` for pattern relationships
- `graph LR` for anti-pattern impact chains

**Questions to Answer**:
- What design patterns are used?
- Are there anti-patterns present?
- Does the code follow SOLID principles?
- Are there code smells?
- What refactoring opportunities exist?
- What are the technical debt hotspots?

## Dimension Completion Checklist

For each dimension, ensure:

- [ ] Analysis section exists in `architecture.md`
- [ ] Required outputs are present
- [ ] Mermaid diagrams are included and valid
- [ ] Key questions are answered
- [ ] Findings are specific and actionable
- [ ] Code citations reference actual files
- [ ] Risks and recommendations are documented

## Cross-Dimension Relationships

Dimensions are interconnected:

- **Structure** affects **Dependencies** (organization influences coupling)
- **Dependencies** affect **Data Flow** (coupling influences flow patterns)
- **Data Flow** affects **State Management** (flow determines state changes)
- **State Management** affects **Patterns** (state complexity influences pattern choices)
- **Patterns** affect **Structure** (patterns guide organization)

Analysis should identify these relationships and document how dimensions reinforce or conflict with each other.
