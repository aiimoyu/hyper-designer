# Code Citation Rules

All analysis artifacts must reference source code using standardized citation formats. This enables traceability and update reminders.

## Citation Format

### Inline Citation

When referencing a specific file or code element in text:

```
[File: relative/path/to/file.ts:Line-Range]
```

Examples:
- "The authentication logic is implemented in [File: src/auth/AuthService.ts:45-78]"
- "User validation rules are defined in [File: src/models/User.ts:15-30]"
- "API routing is configured in [File: src/api/routes.ts:1-100]"

### Block Citation

When describing a larger code block or multiple files:

```markdown
**Implementation:**

- Authentication: [File: src/auth/AuthService.ts]
- User model: [File: src/models/User.ts]
- Routes: [File: src/api/routes.ts]
```

### Function/Class Citation

When referencing specific functions or classes:

```
[Function: functionName in File: relative/path/to/file.ts:Line-Range]
[Class: ClassName in File: relative/path/to/file.ts:Line-Range]
```

Examples:
- "The `validateUser` method [Function: validateUser in File: src/auth/AuthService.ts:45-78] performs input validation"
- "The `AuthService` class [Class: AuthService in File: src/auth/AuthService.ts:1-200] handles all authentication operations"

## Citation Rules

### 1. Use Relative Paths

Always use paths relative to target project root:

- ✅ `src/auth/AuthService.ts`
- ❌ `/home/user/project/src/auth/AuthService.ts`
- ❌ `AuthService.ts` (ambiguous)

### 2. Include Line Ranges

Always include line ranges for precision:

- ✅ `[File: src/auth/AuthService.ts:45-78]`
- ❌ `[File: src/auth/AuthService.ts]` (too broad for inline citations)

Exception: Block citations can omit line ranges when referring to entire files.

### 3. Be Specific

Cite the smallest relevant unit:

- ✅ `[Function: validateToken in File: src/auth/AuthService.ts:45-78]`
- ❌ `[File: src/auth/AuthService.ts]` (too broad)

### 4. Verify Existence

All citations must reference actual files in source-inventory.json:

- Stage 3 validates that all cited files exist
- Stage 3 validates that line ranges are within file bounds
- Missing or invalid citations are flagged as coverage failures

### 5. Avoid Over-Citation

Don't cite every line - cite meaningful units:

- ✅ Cite entire functions or logical blocks
- ❌ Cite individual lines or trivial statements

### 6. Group Related Citations

When multiple citations relate to same concept, group them:

```markdown
**Authentication Flow:**

1. Token validation: [Function: validateToken in File: src/auth/AuthService.ts:45-78]
2. User lookup: [Function: findByToken in File: src/repositories/UserRepository.ts:120-145]
3. Session creation: [Function: createSession in File: src/auth/SessionManager.ts:89-112]
```

## Citation Patterns by Dimension

### Structure Dimension

Cite:
- Directory structure files (index.ts, package.json, etc.)
- Module definition files
- Configuration files

Example:
```
The API layer is organized in [File: src/api/index.ts:1-50] with route definitions in [File: src/api/routes.ts:1-200].
```

### Dependencies Dimension

Cite:
- Import statements
- Dependency injection points
- External library usage

Example:
```
The service depends on [File: src/database/Connection.ts:1-100] for database access and uses [File: node_modules/lodash/index.js] for utility functions.
```

### Data Flow Dimension

Cite:
- Entry points (controllers, handlers)
- Data transformation functions
- Database queries
- Response builders

Example:
```
Request enters at [Function: handleLogin in File: src/api/controllers/AuthController.ts:15-45], is validated by [Function: validateCredentials in File: src/auth/Validator.ts:10-30], and stored via [Function: saveSession in File: src/repositories/SessionRepository.ts:55-78].
```

### State Management Dimension

Cite:
- State variable declarations
- State mutation functions
- Database model definitions
- Cache access points

Example:
```
User sessions are stored in [Class: SessionStore in File: src/auth/SessionStore.ts:1-150] with schema defined in [File: src/models/Session.ts:1-40].
```

### Patterns and Anti-Patterns Dimension

Cite:
- Pattern implementations
- Anti-pattern locations
- Code smell instances

Example:
```
Singleton pattern is used in [Class: DatabaseConnection in File: src/database/Connection.ts:1-80]. A potential God Object anti-pattern exists in [Class: UserService in File: src/services/UserService.ts:1-500] which handles too many responsibilities.
```

## Citation Validation

Stage 3 performs strict validation:

1. **File existence**: All cited files must exist in source-inventory.json
2. **Line range validity**: Line ranges must be within file bounds
3. **Function/class resolution**: Named functions/classes must exist at cited locations
4. **Coverage completeness**: All source files should be cited at least once

## Citation Best Practices

### DO ✅

- Use citations to support claims about code
- Include line ranges for precision
- Group related citations
- Use consistent format throughout
- Verify citations before finalizing

### DON'T ❌

- Make claims without citation support
- Use absolute paths
- Omit line ranges for inline citations
- Cite non-existent files
- Over-cite trivial code

## Examples

### Good Example

```markdown
## Authentication Component

The authentication system uses JWT tokens for session management. Token generation is handled by [Function: generateToken in File: src/auth/JwtService.ts:45-78], which includes user claims and expiration time.

**Key Functions:**

- Token generation: [Function: generateToken in File: src/auth/JwtService.ts:45-78]
- Token validation: [Function: validateToken in File: src/auth/JwtService.ts:80-120]
- User lookup: [Function: findByUsername in File: src/repositories/UserRepository.ts:45-67]
```

### Bad Example

```markdown
## Authentication Component

The authentication system uses JWT tokens. It generates tokens and validates them.

**Key Functions:**

- generateToken
- validateToken
- findByUsername
```

(No citations, no file references, not traceable)
