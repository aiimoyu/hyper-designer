---
name: system-analysis
description: Stage 1 system analysis for project-analysis workflow. Performs architecture discovery, component identification, API inventory, and source mapping. Generates system-level architecture analysis and machine-readable manifests (system-analysis.json, component-manifest.json, api-manifest.json, source-inventory.json) that serve as the single source of truth for downstream stages. Must analyze all 5 architecture dimensions and establish component granularity boundaries. Forbids Stage 2 fan-out logic and Stage 3 coverage reconciliation logic.
---

# System Analysis Skill (Stage 1)

## Purpose

Discover and document the target project's architecture, components, APIs, and source code structure. This stage establishes the foundational understanding of the system and produces machine-readable manifests that downstream stages consume as the single source of truth.

## Critical Constraint

**Stage 1 outputs are the ONLY source of truth for Stage 2 and Stage 3.**

- The component manifest from this stage defines the complete component set for Stage 2 fan-out
- The API manifest provides the authoritative API inventory for coverage validation
- The source inventory maps all analyzed source files for completeness checks
- Do NOT allow downstream stages to rediscover or override these manifests

## Execution Flow

### 1. Establish Analysis Context

Adopt the architect identity and gather target project information:

```
你是系统架构师，专注于[目标项目领域]的系统分析。
我将系统性地分析该项目的架构、组件、API 和源代码结构。
```

**Ask the user for:**

- **Target project path**: The absolute path to the project to analyze
- **Project context**: Brief description of the project's domain and purpose
- **Analysis scope**: Whether to analyze entire codebase or specific modules

### 2. Scan Analysis Boundaries

Before deep analysis, establish the scope boundaries:

- **Exclude directories**: `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/`, `.next/`, `.nuxt/`
- **Exclude file patterns**: `*.min.js`, `*.min.css`, `*.map`, `*.lock`, `package-lock.json`, `yarn.lock`
- **Include languages**: Identify primary languages (TypeScript, JavaScript, Python, Go, etc.)
- **Framework detection**: Identify frameworks (React, Vue, Express, Django, Spring, etc.)
- **Entry points**: Locate main entry files (index.ts, main.go, app.py, etc.)

### 3. Analyze Architecture Dimensions

Perform systematic analysis across 5 mandatory dimensions. Each dimension must produce structured output for both the human-readable markdown and machine-readable JSON manifests.

#### Dimension 1: System Structure and Organization

**Analysis scope:**

- **Module boundaries**: Identify top-level modules and their responsibilities
- **Layering architecture**: Map layers (affects/presentation/domain/infrastructure) if present
- **Directory structure**: Document the intentional directory organization patterns
- **Module dependencies**: Map import/require relationships between modules
- **Circular dependencies**: Identify and flag any circular dependency issues

**Output requirements:**

- Module hierarchy tree with responsibilities
- Dependency graph (Mermaid)
- Layer separation violations if any
- Module cohesion assessment

#### Dimension 2: Component Discovery and Granularity

**Analysis scope:**

- **Component identification**: Apply component discovery rules (see below)
- **Granularity assessment**: Apply component granularity principles (see below)
- **Component types**: Classify by type (service, repository, controller, utility, library)
- **Component boundaries**: Define clear responsibility boundaries for each component
- **Component dependencies**: Map inter-component dependencies

**Component discovery rules:**

1. **Domain-driven components**: Look for bounded contexts or domain modules
2. **Framework components**: Identify controllers, services, repositories based on framework patterns
3. **Utility components**: Identify shared utilities and helper modules
4. **Library components**: Identify third-party library wrappers or adapters
5. **Cross-cutting concerns**: Identify logging, auth, config, and middleware components

**Component granularity principles:**

- **Single responsibility**: Each component should have one clear responsibility
- **Cohesive coupling**: Related functionality should be grouped together
- **Interface-based boundaries**: Components should be bounded by public interfaces
- **Testability**: Components should be independently testable
- **Domain alignment**: Component boundaries should align with domain concepts

**Output requirements:**

- Component manifest with: `componentSlug`, `name`, `description`, `path`, `type`, `dependencies`
- Component hierarchy tree
- Dependency graph between components
- Granularity assessment notes

#### Dimension 3: API and Interface Inventory

**Analysis scope:**

- **REST APIs**: Identify HTTP endpoints, routes, and controllers
- **GraphQL APIs**: Identify schema definitions, resolvers, and queries/mutations
- **RPC APIs**: Identify gRPC services, Thrift services, or other RPC patterns
- **Event APIs**: Identify message producers/consumers, event handlers
- **Library APIs**: Identify public module exports and class interfaces

**Output requirements:**

- API manifest with: `apiSlug`, `name`, `description`, `type`, `path`, `signature`, `component`
- API categorization by type (REST/GraphQL/RPC/Event/Library)
- API-to-component mapping
- Input/output schemas for each API

#### Dimension 4: Data Flow and Persistence

**Analysis scope:**

- **Data models**: Identify entity definitions, data structures, and schemas
- **Data access patterns**: Identify repositories, DAOs, ORM usage
- **Database schemas**: Map database tables/collections to domain models
- **Data transformation**: Identify data mappers, DTOs, and transformation logic
- **Caching strategies**: Identify cache usage patterns and invalidation

**Output requirements:**

- Data model catalog
- Data flow diagrams (Mermaid)
- Persistence layer mapping
- Cache strategy documentation

#### Dimension 5: Configuration and Deployment

**Analysis scope:**

- **Configuration files**: Identify config files, environment variables, and settings
- **Build and bundling**: Identify build scripts, bundler configuration, and compilation steps
- **Deployment artifacts**: Identify Docker files, deployment scripts, and CI/CD configs
- **External dependencies**: Identify third-party libraries and their purposes
- **Environment-specific configs**: Identify dev/staging/prod configuration differences

**Output requirements:**

- Configuration inventory
- Build process documentation
- Deployment pipeline summary
- Dependency tree analysis

### 4. Generate Source Inventory

Create a comprehensive inventory of all analyzed source files:

- **File catalog**: List all files included in analysis with metadata
- **Language distribution**: Count files by language/extension
- **Size metrics**: Record file sizes and total codebase size
- **Exclusion log**: Document what was excluded and why

### 5. Generate Outputs

Produce both human-readable and machine-readable outputs.

#### Human-Readable Output

**File**: `.hyper-designer/projectAnalysis/architecture.md`

Structure:

```markdown
# System Architecture Analysis

## Executive Summary
[High-level overview of the system architecture]

## 1. System Structure and Organization
[Module hierarchy, layering, dependencies]

## 2. Component Landscape
[Component inventory, boundaries, dependencies]

## 3. API and Interface Catalog
[API inventory, categorization, contracts]

## 4. Data Flow and Persistence
[Data models, access patterns, persistence layer]

## 5. Configuration and Deployment
[Configuration, build, deployment pipeline]

## Appendices
- Component Manifest Reference
- API Manifest Reference
- Source Inventory Reference
```

#### Machine-Readable Outputs

**File**: `.hyper-designer/projectAnalysis/_meta/system-analysis.json`

```json
{
  "projectPath": "/path/to/project",
  "analysisTimestamp": "ISO-8601 timestamp",
  "architectureDimensions": {
    "systemStructure": { ... },
    "componentDiscovery": { ... },
    "apiInventory": { ... },
    "dataFlow": { ... },
    "configuration": { ... }
  },
  "frameworks": ["React", "Express"],
  "languages": ["TypeScript", "JavaScript"],
  "excludedPatterns": ["node_modules", "dist"]
}
```

**File**: `.hyper-designer/projectAnalysis/_meta/component-manifest.json`

```json
{
  "components": [
    {
      "componentSlug": "user-service",
      "name": "User Service",
      "description": "Manages user authentication and profile data",
      "path": "src/services/user/",
      "type": "service",
      "dependencies": ["user-repository", "auth-middleware"]
    }
  ],
  "totalComponents": 42,
  "componentTypes": {
    "service": 12,
    "repository": 8,
    "controller": 10,
    "utility": 7,
    "library": 5
  }
}
```

**File**: `.hyper-designer/projectAnalysis/_meta/api-manifest.json`

```json
{
  "apis": [
    {
      "apiSlug": "user-login",
      "name": "User Login",
      "description": "Authenticates user credentials",
      "type": "REST",
      "path": "src/controllers/auth.ts",
      "signature": "POST /api/auth/login",
      "component": "auth-controller"
    }
  ],
  "totalApis": 67,
  "apiTypes": {
    "REST": 45,
    "GraphQL": 12,
    "Event": 8,
    "Library": 2
  }
}
```

**File**: `.hyper-designer/projectAnalysis/_meta/source-inventory.json`

```json
{
  "files": [
    {
      "path": "src/services/user.ts",
      "language": "TypeScript",
      "size": 4521,
      "lines": 156
    }
  ],
  "totalFiles": 234,
  "totalLines": 45678,
  "languageDistribution": {
    "TypeScript": 180,
    "JavaScript": 45,
    "JSON": 9
  },
  "excludedPatterns": ["node_modules/**", "dist/**"]
}
```

## Quality Checklist

Before completing Stage 1:

- [ ] Target project path confirmed and accessible
- [ ] Analysis boundaries clearly defined (exclusions, inclusions)
- [ ] All 5 architecture dimensions analyzed and documented
- [ ] Component discovery rules applied consistently
- [ ] Component granularity principles applied and documented
- [ ] `architecture.md` generated with all 5 dimensions
- [ ] `_meta/system-analysis.json` generated with structured dimension data
- [ ] `_meta/component-manifest.json` generated with complete component inventory
- [ ] `_meta/api-manifest.json` generated with
- [ ] `_meta/source-inventory.json` generated with file catalog
- [ ] All JSON manifests are valid and machine-readable
- [ ] Component manifest includes dependencies between components
- [ ] API manifest includes component mapping
- [ ] Mermaid diagrams included where applicable
- [ ] Cross-references between dimensions are consistent

## Workflow Integration

### When to Use

- Workflow stage: `systemAnalysis` in `projectAnalysis` workflow
- Agent: `HAnalysis` (base prompt + stage-specific loading)
- Context: First stage of project-analysis workflow

### Prerequisites

- Target project path provided by user
- `.hyper-designer/projectAnalysis/` directory exists in target project

### Next Steps

- Successful Stage 1 → Proceed to Stage 2 (`componentAnalysis`)
- Stage 2 will consume `_meta/component-manifest.json` as the ONLY source of truth
- Stage 3 will consume all manifests for coverage validation

## Anti-Patterns

**Do NOT:**

- Skip any of the 5 architecture dimensions
- Generate outputs without analyzing the actual source code
- Use generic directory scanning instead of architecture-aware component discovery
- Create components without applying granularity principles
- Omit machine-readable JSON manifests
- Allow component boundaries to be vague or overlapping
- Skip dependency mapping between components
- Embed Stage 2 fan-out logic or Stage 3 coverage reconciliation logic

**DO:**

- Analyze all 5 architecture dimensions systematically
- Apply component discovery rules and granularity principles
- Generate both human-readable markdown and machine-readable JSON
- Establish clear component boundaries with single responsibilities
- Map all dependencies between components and modules
- Document framework-specific patterns and conventions
- Validate all JSON manifests before declaring Stage 1 complete
- Treat the component manifest as the authoritative source for Stage 2
