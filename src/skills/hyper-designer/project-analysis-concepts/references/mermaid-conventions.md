# Mermaid Conventions

All diagrams in analysis artifacts must follow these conventions for consistency and tool support.

## Supported Diagram Types

| Type | Use Case | Stage |
|------|-----------|-------|
| `graph TD` | Hierarchy, directory structure, dependency trees | All |
| `graph LR` | Flow, pipelines, interactions | All |
| `sequenceDiagram` | Request-response flows, call sequences | All |
| `classDiagram` | Data models, class structures, interfaces | All |
| `stateDiagram` | State machines, lifecycle | All |
| `erDiagram` | Database schemas, entity relationships | All |
| `gantt` | Timelines, process flows | Optional |
| `pie` | Statistics, distributions | Optional |

## Diagram Naming

Each diagram must have a descriptive title:

```mermaid
graph TD
    title System Architecture Overview
    ...
```

## Node Naming Conventions

### Files and Modules

Use full relative paths for clarity:

```mermaid
graph TD
    A[src/auth/AuthService.ts]
    B[src/models/User.ts]
    A --> B
```

### Components

Use component slugs from component-manifest.json:

```mermaid
graph TD
    A[auth-service]
    B[user-repository]
    A --> B
```

### Layers

Use standard layer names:

```mermaid
graph LR
    A[API Layer]
    B[Business Layer]
    C[Data Layer]
    A --> B --> C
```

## Edge Styling

### Dependency Types

| Edge Type | Style | Meaning |
|-----------|--------|---------|
| Direct dependency | `-->` | Standard dependency |
| Weak dependency | `-.->` | Optional or indirect |
| Bidirectional | `<-->` | Circular dependency (warning) |
| Data flow | `==>` | Data movement |
| Control flow | `-->` | Execution order |

### Example

```mermaid
graph TD
    A[Controller] --> B[Service]
    B -.-> C[Cache]
    B --> D[Repository]
    D ==> E[Database]
```

## Subgraphs

Use subgraphs to group related nodes:

```mermaid
graph TD
    subgraph Auth Module
        A[AuthService]
        B[SessionManager]
    end

    subgraph User Module
        C[UserService]
        D[UserRepository]
    end

    A --> C
    B --> D
```

## Diagram Size Limits

- **Maximum nodes**: 50 per diagram
- **Maximum edges**: 100 per diagram
- **Maximum nesting**: 5 levels deep

If diagram exceeds limits, split into multiple diagrams with clear numbering:

```mermaid
graph TD
    title Architecture Overview - Part 1: Core Modules
    ...
```

```mermaid
graph TD
    title Architecture Overview - Part 2: Utilities
    ...
```

## Diagram-Specific Conventions

### Directory Structure (graph TD)

```mermaid
graph TD
    title Project Directory Structure
    Root[src/]
    Root --> Auth[src/auth/]
    Root --> Models[src/models/]
    Root --> API[src/api/]
    Auth --> AuthService[AuthService.ts]
    Models --> User[User.ts]
    API --> Routes[routes.ts]
```

### Dependency Graph (graph TD)

```mermaid
graph TD
    title Module Dependency Graph
    A[AuthService] --> B[UserRepository]
    A --> C[SessionManager]
    B --> D[DatabaseConnection]
    C --> D
    E[APIController] --> A
```

### Data Flow (graph LR)

```mermaid
graph LR
    title Authentication Data Flow
    A[Request] --> B[Validate]
    B --> C[Authenticate]
    C --> D[Generate Token]
    D --> E[Response]
```

### Sequence Diagram (sequenceDiagram)

```mermaid
sequenceDiagram
    title Login Request Flow
    participant Client
    participant API
    participant Service
    participant DB

    Client->>API: POST /login
    API->>Service: authenticate()
    Service->>DB: findByUsername()
    DB-->>Service: User
    Service-->>API: Token
    API-->>Client: 200 OK
```

### Class Diagram (classDiagram)

```mermaid
classDiagram
    title User Model
    class User {
        +string id
        +string username
        +string email
        +Date createdAt
        +validate() boolean
        +save() Promise
    }
    class Session {
        +string token
        +string userId
        +Date expiresAt
        +isValid() boolean
    }
    User "1" --> "*" Session : has
```

### State Diagram (stateDiagram)

```mermaid
stateDiagram
    title Session Lifecycle
    [*] --> Active: login
    Active --> Expired: timeout
    Active --> Invalidated: logout
    Expired --> [*]
    Invalidated --> [*]
```

### ER Diagram (erDiagram)

```mermaid
erDiagram
    title Database Schema
    User ||--o{ Session : has
    User {
        string id PK
        string username UK
        string email
        timestamp created_at
    }
    Session {
        string token PK
        string userId FK
        timestamp expires_at
    }
```

## Diagram Validation Rules

Stage 3 validates all Mermaid diagrams:

1. **Syntax validity**: Diagram must parse correctly
2. **Node references**: All nodes must exist in manifests
3. **Edge consistency**: Edges must reference existing nodes
4. **Size limits**: Must not exceed node/edge limits
5. **Title presence**: All diagrams must have titles
6. **No orphan nodes**: All nodes must be connected (except roots)

## Diagram Placement

### In architecture.md

Place diagrams in relevant dimension sections:

```markdown
## 1. Structure

### Directory Organization

```mermaid
graph TD
    title Project Directory Structure
    ...
```

### Layer Architecture

```mermaid
graph LR
    title System Layers
    ...
```
```

### In component/{componentSlug}.md

Place diagrams in relevant dimension sections:

```markdown
## 2. Interfaces

### Component Dependencies

```mermaid
graph TD
    title Component Dependencies
    ...
```

## 3. Data and State

### Internal Data Flow

```mermaid
graph LR
    title Internal Data Flow
    ...
```
```

## Diagram Cross-References

Diagrams can reference each other using hyperlinks:

```mermaid
graph TD
    A[AuthService]
    B[UserRepository]
    A --> B
    click A "component/auth-service.md" "View Auth Service Details"
    click B "component/user-repository.md" "View User Repository Details"
```

## Common Patterns

### Layered Architecture

```mermaid
graph LR
    title Layered Architecture Pattern
    subgraph Presentation
        A[Controllers]
        B[Views]
    end
    subgraph Business
        C[Services]
        D[Domain Models]
    end
    subgraph Data
        E[Repositories]
        F[Database]
    end
    A --> C
    B --> C
    C --> E
    D --> E
    E --> F
```

### Microservices Architecture

```mermaid
graph TD
    title Microservices Architecture
    subgraph Services
        A[Auth Service]
        B[User Service]
        C[Order Service]
    end
    subgraph Infrastructure
        D[API Gateway]
        E[Service Discovery]
        F[Message Broker]
    end
    D --> A
    D --> B
    D --> C
    A --> E
    B --> E
    C --> E
    A --> F
    B --> F
    C --> F
```

### Event-Driven Architecture

```mermaid
graph LR
    title Event-Driven Pattern
    A[Producer] -->|publish| B[Event Bus]
    B -->|subscribe| C[Consumer 1]
    B -->|subscribe| D[Consumer 2]
    B -->|subscribe| E[Consumer 3]
```

## Diagram Maintenance

All diagrams must include update reminders:

```markdown
```mermaid
graph TD
    title Current Architecture
    ...
```

> **Update Reminder**: This diagram reflects the architecture as of [Date]. When the code structure changes, update this diagram to maintain accuracy.
```

## Best Practices

### DO ✅

- Use descriptive titles
- Follow naming conventions
- Keep diagrams under size limits
- Group related nodes with subgraphs
- Use consistent edge styles
- Include update reminders
- Validate syntax before committing

### DON'T ❌

- Create overly complex diagrams
- Use abbreviations for node names
- Mix diagram types in one block
- Exceed size limits
- Omit titles
- Use inconsistent styling
- Skip validation

## Tool Support

These conventions ensure compatibility with:

- **Mermaid Live Editor**: https://mermaid.live/
- **GitHub/GitLab**: Native Mermaid rendering
- **VS Code**: Mermaid Preview extension
- **Markdown viewers**: Most support Mermaid
- **Static site generators**: Hugo, Jekyll, etc.
