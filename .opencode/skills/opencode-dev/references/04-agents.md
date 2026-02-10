---
title: "OpenCode Agent Configuration Guide"
load_when: "User needs to configure or customize OpenCode agents"
---

# OpenCode Agent Configuration Guide

This guide covers configuring OpenCode agents through declarative markdown files.

## Overview

Agents in OpenCode are configurable AI personalities. You can customize existing agents or create new ones by placing markdown files in the `.opencode/agents/` directory.

## Agent Types

### Built-in Agents

OpenCode includes several built-in agents:

- **build** - Default agent for development work (full access)
- **plan** - Read-only agent for analysis and planning
- **general** - Subagent for complex searches and multi-step tasks

### Custom Agents

Create your own agents for specialized tasks.

## Agent File Location

Place agent configuration files in:

- `.opencode/agents/*.md` - Project-level agents
- `~/.config/opencode/agents/*.md` - Global agents

## Basic Agent Structure

Agents are defined as Markdown files with YAML frontmatter:

```markdown
---
name: "my-agent"
description: "Description of what this agent does"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.5
---

Your agent's system prompt goes here.
Describe behavior, constraints, and specializations.
```

## Frontmatter Options

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `name` | `string` | **Required.** Unique agent identifier | `"security-auditor"` |
| `description` | `string` | **Required.** Short description | `"Security-focused code reviewer"` |
| `model` | `string` | **Required.** LLM model to use | `"anthropic/claude-3-5-sonnet-20241022"` |
| `temperature` | `number` | Creativity level (0-2) | `0.2` |
| `hidden` | `boolean` | Hide from agent switcher | `false` |
| `color` | `string` | UI color theme | `"blue"` |
| `steps` | `number` | Max reasoning steps | `3` |
| `permissions` | `array` | Granted permissions | `["read:repo", "write:files"]` |

## Model Format

Models use the format `provider/model-id`:

```yaml
# Anthropic
model: "anthropic/claude-3-5-sonnet-20241022"
model: "anthropic/claude-3-5-haiku-20241022"

# OpenAI
model: "openai/gpt-4o"
model: "openai/gpt-4o-mini"

# Local models (via Ollama, etc.)
model: "ollama/llama3.2"
```

## Permission System

Grant specific permissions to agents:

```yaml
permissions:
  - "read:repo"           # Read repository files
  - "write:files"         # Modify files
  - "run:tests"           # Execute tests
  - "run:shell"           # Run shell commands
  - "mcp:*"               # Access all MCP servers
  - "mcp:scanner:read"    # Specific MCP access
```

## Working Examples

### Example 1: Basic Agent

`.opencode/agents/basic.md`:

```markdown
---
name: "basic-helper"
description: "General purpose coding assistant"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.5
---

You are a helpful coding assistant. Follow these guidelines:
- Write clean, well-documented code
- Follow existing code style and patterns
- Ask for clarification when requirements are unclear
```

### Example 2: Security Auditor

`.opencode/agents/security-auditor.md`:

```markdown
---
name: "security-auditor"
description: "Security-focused code auditor for vulnerability scanning"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.0
permissions:
  - "read:repo"
  - "run:static-scan"
---

You are a security auditor. Your job is to:
- Scan code for security vulnerabilities
- Identify common security issues (injection, XSS, CSRF, etc.)
- Check for secrets or credentials in code
- Review authentication and authorization logic
- Suggest remediation steps

Format findings as:
- Severity: [Critical/High/Medium/Low]
- Issue: Brief description
- Location: File and line number
- Recommendation: How to fix
```

### Example 3: Performance Optimizer

```markdown
---
name: "performance-auditor"
description: "Performance optimization specialist"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.2
permissions:
  - "read:repo"
  - "run:tests"
  - "run:benchmark"
---

You are a performance optimization expert. Focus on:
- Algorithmic efficiency
- Database query optimization
- Memory usage patterns
- Caching strategies
- Async/await best practices

Always measure before and after changes.
```

### Example 4: Documentation Writer

```markdown
---
name: "doc-writer"
description: "Technical documentation specialist"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.3
permissions:
  - "read:repo"
  - "write:files"
---

You are a technical writer. Your role:
- Write clear, concise documentation
- Create API docs from code comments
- Write README files with proper structure
- Add inline code comments where helpful
- Follow Markdown best practices

Style guidelines:
- Use active voice
- Include code examples
- Keep sentences concise
- Use proper heading hierarchy
```

### Example 5: Test Generator

```markdown
---
name: "test-generator"
description: "Unit and integration test generator"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.2
permissions:
  - "read:repo"
  - "write:files"
  - "run:tests"
---

You are a test engineer. Your responsibilities:
- Write comprehensive unit tests
- Follow AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Cover edge cases and error paths
- Maintain test isolation

Prefer:
- Descriptive test names over comments
- Table-driven tests for multiple cases
- Mocking external dependencies
- Assertions with meaningful messages
```

### Example 6: Code Reviewer

```markdown
---
name: "code-reviewer"
description: "Thorough code reviewer"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.1
permissions:
  - "read:repo"
---

You are a code reviewer. Review code for:
- Correctness and logic errors
- Code style consistency
- Performance implications
- Security concerns
- Maintainability

Format your review as:
1. **Summary** - Overall assessment
2. **Critical Issues** - Must fix before merge
3. **Suggestions** - Improvements to consider
4. **Questions** - Things that need clarification

Be constructive and explain the "why" behind suggestions.
```

### Example 7: Specialized Language Agent

```markdown
---
name: "rust-expert"
description: "Rust programming specialist"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.3
permissions:
  - "read:repo"
  - "write:files"
  - "run:tests"
---

You are a Rust expert. Specialize in:
- Ownership and borrowing patterns
- Lifetime management
- Trait system design
- Error handling with Result/Option
- Async Rust with Tokio
- Unsafe code guidelines

Always prefer:
- Iterator methods over explicit loops
- Strong typing with newtype patterns
- Explicit error types over Box<dyn Error>
- Documentation comments (///)
```

## Agent Configuration in opencode.json

You can also configure agents in your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "security-auditor": {
      "model": "anthropic/claude-3-5-sonnet-20241022",
      "temperature": 0.0
    }
  }
}
```

## Switching Agents

In the OpenCode TUI, press **Tab** to cycle through available agents.

## Calling Subagents

Reference agents inline with `@`:

```
@security-auditor Please review the authentication code in @src/auth.ts
```

## Best Practices

1. **Be specific** - Clear descriptions help users choose the right agent
2. **Limit permissions** - Grant only necessary permissions
3. **Use low temperature** - For precise tasks (0.0-0.3)
4. **Document constraints** - Note what the agent should NOT do
5. **Test prompts** - Verify the agent behaves as expected
6. **Keep focused** - One agent should have one primary purpose
7. **Use examples** - Include example inputs/outputs in prompts

## Temperature Guidelines

| Temperature | Use Case |
|-------------|----------|
| 0.0 - 0.2 | Code analysis, security, testing (deterministic) |
| 0.3 - 0.5 | General coding, refactoring (balanced) |
| 0.6 - 0.8 | Creative tasks, documentation (more variation) |
| 0.9 - 1.0 | Brainstorming, exploration (high creativity) |

## Common Pitfalls

| Issue | Solution |
|-------|----------|
| Agent not appearing | Check file is `.md` and in `.opencode/agents/` |
| Permissions not working | Verify exact permission strings |
| Model not found | Check provider/model format |
| Agent ignores instructions | Make prompt more explicit and specific |
| Temperature too high | Lower for code-related tasks |

## Source Attribution

- Content synthesized from:
  - opencode.ai/docs/agents: Official agent documentation
  - anomalyco/opencode: Agent system implementation
- Canonical source priority: opencode.ai > anomalyco/opencode repo
- Last Updated: 2026-02-11
