# Coverage Category Reference

Detailed guidance for each of the 7 strict coverage categories for project-analysis workflow.

## 1. Missing Components

### Definition
Components listed in component-manifest.json but without corresponding analysis outputs.

### Detection Strategy

1. Extract all components from component-manifest.json:
   - Component slugs
   - Component names
   - Component paths

2. Verify each component has analysis outputs:
   - Check if `component/{componentSlug}.md` exists
   - Check if `_meta/components/{componentSlug}.json` exists
   - Verify component names match exactly

3. Report missing components with context:
   - Component slug and name
   - Expected markdown and metadata paths
   - Why it's needed (referenced in manifest)

### Example Findings

```markdown
## Missing Components

### user-service
- **Severity**: HIGH
- **Referenced in**: `component-manifest.json`
- **Expected markdown**: `component/user-service.md`
- **Expected metadata**: `_meta/components/user-service.json`
- **Purpose**: User authentication and profile management
- **Impact**: Component analysis incomplete, Stage 2 output missing
```

### Remediation

1. Create component analysis markdown for the missing component
2. Generate component metadata JSON
3. Cover all 4 component dimensions (IOP, Responsibility, Interface, Structure)
4. Update cross-references in architecture.md

---

## 2. Missing Files

### Definition
Source files referenced in component analyses but not present in the target project codebase.

### Detection Strategy

1. Parse all file references in component analyses:
   - Source file paths in implementation sections
   - Configuration file references
   - Test file references
   - Documentation file references

2. Verify file existence in target project:
   - Check exact file path relative to project root
   - Consider case sensitivity (Linux vs Windows)
   - Handle relative vs absolute paths
   - Respect excluded patterns from source-inventory.json

3. Report missing files with context:
   - What file should contain
   - Where it's referenced from
   - Why it's needed

### Example Findings

```markdown
## Missing Files

### src/services/auth.ts
- **Severity**: MEDIUM
- **Referenced in**: `component/auth-controller.md §2.1 Implementation`
- **Expected content**: Implementation of AuthenticationService interface
- **Required for**: User authentication and session management
- **Impact**: Code reference in analysis does not exist in codebase
```

### Remediation

1. Create the missing file with appropriate structure
2. Add initial implementation or stubs
3. Ensure file follows project conventions
4. Update documentation if file location changes
5. Consider if file should be in source-inventory.json

---

## 3. Missing Folders

### Definition
Expected directory structures that are absent from the target project codebase.

### Detection Strategy

1. Define expected folder structure based on:
   - Project type (web app, library, CLI tool)
   - Framework conventions (React, Node.js, Python)
   - Module organization patterns from architecture.md
   - Component paths from component-manifest.json

2. Check for standard directories:
   - `src/` or `lib/` for source code
   - `tests/` or `__tests__/` for test files
   - `docs/` for documentation
   - `config/` or `.config/` for configuration
   - Component-specific directories from manifest

3. Report missing folders with purpose:
   - What folder should contain
   - Why it's needed for project structure
   - Which component or module requires it

### Example Findings

```markdown
## Missing Folders

### tests/integration/
- **Severity**: LOW
- **Expected purpose**: Integration tests for API endpoints
- **Referenced in**: `component/api-service.md §4 Testing`
- **Impact**: Integration testing strategy cannot be implemented
```

### Remediation

1. Create the missing directory structure
2. Add appropriate .gitkeep files if needed
3. Update project documentation
4. Consider if folder is actually needed (may be optional)

---

## 4. Missed API Identification

### Definition
APIs used in target code but not documented in api-manifest.json.

### Detection Strategy

1. Scan target codebase for API usage:
   - Function calls to external services
   - REST API endpoints (Express, FastAPI, etc.)
   - GraphQL queries and mutations
   - Database queries (ORM, raw SQL)
   - Message queue operations

2. Cross-reference with api-manifest.json:
   - Check if API is documented in manifest
   - Verify parameters match documentation
   - Confirm return types are specified
   - Check component mapping is valid

3. Report undocumented APIs:
   - API name and signature
   - Where it's used in code
   - Expected documentation location
   - Which component API should be mapped to

### Example Findings

```markdown
## Missed API Identification

### PaymentGateway.processPayment()
- **Severity**: HIGH
- **Used in**: `src/services/payment.ts:45`
- **Expected documentation**: `api-manifest.json`
- **Component mapping**: payment-service
- **Parameters**: amount, currency, cardDetails
- **Impact**: Payment integration may fail if API contract is misunderstood
```

### Remediation

1. Document API in api-manifest.json
2. Specify parameters, return types, and error conditions
3. Add component mapping
4. Update component analysis to reference API manifest entry
5. Consider creating API specification document

---

## 5. Insufficient Mermaid Coverage

### Definition
Critical diagrams that are missing or incomplete in architecture.md or component analyses.

### Detection Strategy

1. Identify required diagrams based on system complexity:
   - System architecture diagram (always required in architecture.md)
   - Component interaction diagrams for critical flows
   - Sequence diagrams for key use cases
   - Data flow diagrams for data-intensive systems
   - State diagrams for stateful components

2. Check diagram completeness:
   - Verify diagram exists in expected document
   - Check if all components are included
   - Ensure all critical flows are represented
   - Validate Mermaid syntax

3. Report missing or incomplete diagrams:
   - Diagram type and purpose
   - What components/flows should be shown
   - Why diagram is needed
   - Which document should contain it

### Example Findings

```markdown
## Insufficient Mermaid Coverage

### Payment Processing Sequence Diagram
- **Severity**: MEDIUM
- **Context**: PaymentService component
- **Expected location**: `component/payment-service.md`
- **Purpose**: Document payment flow with external gateway
- **Expected elements**: UserService, PaymentService, PaymentGateway, BankAPI
- **Impact**: Payment flow integration may have race conditions or errors
```

### Remediation

1. Create the missing diagram
2. Include all relevant components
3. Show all critical interactions
4. Validate Mermaid syntax
5. Add explanatory notes if needed

---

## 6. Broken Cross References

### Definition
Invalid internal references between project-analysis documents.

### Detection Strategy

1. Extract all cross-references from documents:
   - Internal links between architecture.md and component/*.md
   - Section references (e.g., "see §3.2")
   - Figure and table references
   - Code block references
   - Component slug references

2. Validate reference targets:
   - Check if target document exists
   - Verify section numbers are correct
   - Confirm figure/table IDs are valid
   - Test component slug references against component-manifest.json
   - Test API slug references against api-manifest.json

3. Report broken references:
   - Source document and location
   - Target reference
   - Why it's broken (file not found, section renamed, etc.)

### Example Findings

```markdown
## Broken Cross References

### Reference to §4.3 in architecture.md
- **Severity**: MEDIUM
- **Source**: `component/user-service.md §2.1`
- **Target**: `architecture.md §4.3`
- **Issue**: Section 4.3 does not exist (renamed to §4.4)
- **Impact**: Documentation navigation is broken
```

### Remediation

1. Update reference to correct target
2. Or update target section to match reference
3. Use stable IDs instead of section numbers
4. Implement automated reference validation in Stage 2 reconciliation

---

## 7. System/Component Inconsistency

### Definition
Mismatch between architecture.md (system-level) and component analyses (component-level).

### Detection Strategy

1. Compare architecture.md and component analyses:
   - Component names and slugs
   - Component dependencies
   - Interface contracts
   - API mappings

2. Identify discrepancies:
   - Different component names between manifest and analyses
   - Mismatched interface signatures
   - Conflicting dependency lists
   - Inconsistent component types

3. Report inconsistencies:
   - System specification (architecture.md or manifests)
   - Component specification (component/*.md or metadata)
   - Nature of discrepancy
   - Impact on analysis completeness

### Example Findings

```markdown
## System/Component Inconsistency

### UserService Interface Mismatch
- **Severity**: HIGH
- **System spec**: `component-manifest.json` - `type: "service"`
- **Component spec**: `component/user-service.md` - `type: "controller"`
- **Discrepancy**: Component type mismatch between manifest and analysis
- **Impact**: Component categorization is inconsistent
```

### Remediation

1. Align component specification with system specification
2. Or update system specification to reflect component analysis
3. Document rationale for any intentional differences
4. Ensure traceability is maintained across all manifests

---

## Severity Guidelines

### HIGH Severity
Use for issues that:
- Block analysis completeness
- Cause data inconsistency between manifests
- Create critical gaps in documentation
- Break manifest-driven orchestration

### MEDIUM Severity
Use for issues that:
- Impair analysis quality
- Create technical debt
- Cause confusion in documentation
- Require manual fixes

### LOW Severity
Use for issues that:
- Are nice to have
- Improve documentation
- Enhance maintainability
- Don't block analysis completeness

---

## Automation Tips

### Creating Automated Checks

```typescript
// Example automated check for missing components
async function checkMissingComponents() {
  const componentManifest = await loadComponentManifest()
  const componentAnalyses = await loadComponentAnalyses()

  const missingComponents = []

  for (const component of componentManifest.components) {
    const markdownPath = `component/${component.componentSlug}.md`
    const metadataPath = `_meta/components/${component.componentSlug}.json`

    if (!hasFile(markdownPath)) {
      missingComponents.push({
        componentSlug: component.componentSlug,
        missingMarkdown: markdownPath,
        severity: 'high'
      })
    }

    if (!hasFile(metadataPath)) {
      missingComponents.push({
        componentSlug: component.componentSlug,
        missingMetadata: metadataPath,
        severity: 'high'
      })
    }
  }

  return missingComponents
}
```

### Continuous Integration

Add coverage checks to CI pipeline:

```yaml
# .github/workflows/coverage-check.yml
name: Coverage Check
on: [pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run coverage check
        run: npm run coverage:check
      - name: Upload coverage report
        uses: actions/upload-artifact@v2
        with:
          name: coverage-report
          path: .hyper-designer/projectAnalysis/coverage-report.md
```
