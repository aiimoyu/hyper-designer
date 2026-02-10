---
title: "OpenCode Custom Tools Guide"
load_when: "User needs to create custom tools callable by the AI"
---

# OpenCode Custom Tools Guide

This guide explains how to create custom tools that the OpenCode AI can call during conversations.

## Overview

Custom tools extend OpenCode's capabilities by adding functions the AI can invoke. They work alongside built-in tools like `read`, `write`, and `bash`.

## Installation

```bash
npm install @opencode-ai/plugin
# or
bun add @opencode-ai/plugin
```

## Tool Locations

Tools can be defined in:

- `.opencode/tools/*.ts` - Project-level tools
- `~/.config/opencode/tools/*.ts` - Global tools

## Basic Tool Structure

Use the `tool()` helper from `@opencode-ai/plugin`:

```ts
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Description of what this tool does",
  args: {
    param1: tool.schema.string().describe("Description of param1"),
    param2: tool.schema.number().optional(),
  },
  async execute(args, context) {
    // Tool implementation
    return "Result";
  },
});
```

The **filename** (without extension) becomes the **tool name**.

## The `tool()` Helper

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `description` | `string` | Yes | What the tool does |
| `args` | `ZodSchema` | Yes | Input parameter schema |
| `execute` | `function` | Yes | Implementation function |

### Args Schema with Zod

`tool.schema` is Zod. You can also import Zod directly:

```ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

export default tool({
  description: "Example tool",
  args: {
    // Basic types
    name: tool.schema.string(),
    count: tool.schema.number(),
    enabled: tool.schema.boolean(),
    
    // With descriptions
    query: tool.schema.string().describe("Search query"),
    
    // Optional fields
    limit: tool.schema.number().optional(),
    
    // Default values
    offset: tool.schema.number().default(0),
    
    // Enums
    env: tool.schema.enum(["dev", "staging", "prod"]).default("dev"),
    
    // Arrays
    tags: tool.schema.array(tool.schema.string()).optional(),
    
    // Nested objects
    options: tool.schema.object({
      retry: tool.schema.number().default(3),
      timeout: tool.schema.number(),
    }).optional(),
    
    // Using Zod directly
    email: z.string().email(),
  },
  async execute(args) {
    // Args are fully typed and validated
    return `Hello ${args.name}`;
  },
});
```

## Context Object

Tools receive context about the current session:

```ts
export default tool({
  description: "Get project info",
  args: {},
  async execute(args, context) {
    const {
      agent,        // Current agent name
      sessionID,    // Session ID
      messageID,    // Message ID
      directory,    // Session working directory
      worktree,     // Git worktree root
    } = context;
    
    return `Agent: ${agent}, Session: ${sessionID}`;
  },
});
```

## Multiple Tools Per File

Export multiple tools from a single file. Each export becomes a separate tool
with the name `<filename>_<exportname>`:

```ts
import { tool } from "@opencode-ai/plugin";

export const add = tool({
  description: "Add two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a + args.b;
  },
});

export const multiply = tool({
  description: "Multiply two numbers",
  args: {
    a: tool.schema.number(),
    b: tool.schema.number(),
  },
  async execute(args) {
    return args.a * args.b;
  },
});
```

This creates `math_add` and `math_multiply` tools (if file is `math.ts`).

## Working Examples

### Example 1: Database Query Tool

```ts
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args, context) {
    // Your database logic here
    // e.g., using a connection from context or importing a client
    return `Executed query: ${args.query}`;
  },
});
```

### Example 2: HTTP API Call

```ts
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Fetch data from external API",
  args: {
    endpoint: tool.schema.string().describe("API endpoint"),
    method: tool.schema.enum(["GET", "POST"]).default("GET"),
  },
  async execute(args) {
    const response = await fetch(args.endpoint, {
      method: args.method,
    });
    return await response.json();
  },
});
```

### Example 3: File Processing

```ts
import { tool } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";

export default tool({
  description: "Parse and analyze a JSON file",
  args: {
    path: tool.schema.string().describe("Path to JSON file"),
  },
  async execute(args, context) {
    const fullPath = `${context.worktree}/${args.path}`;
    const content = await readFile(fullPath, "utf-8");
    const data = JSON.parse(content);
    return {
      keys: Object.keys(data),
      size: content.length,
    };
  },
});
```

### Example 4: Shell Command Wrapper

```ts
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Run npm scripts",
  args: {
    script: tool.schema.string().describe("NPM script name"),
  },
  async execute(args, context) {
    const { $ } = await import("bun");
    const result = await $`cd ${context.worktree} && npm run ${args.script}`;
    return {
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
      exitCode: result.exitCode,
    };
  },
});
```

### Example 5: Python Script Wrapper

```ts
import { tool } from "@opencode-ai/plugin";
import { join } from "path";

export default tool({
  description: "Run Python data analysis",
  args: {
    data: tool.schema.string().describe("Data to analyze"),
  },
  async execute(args, context) {
    const { $ } = await import("bun");
    const scriptPath = join(context.worktree, ".opencode/tools/analyze.py");
    
    const result = await $`python3 ${scriptPath} ${args.data}`;
    return result.stdout.toString().trim();
  },
});
```

Python script (`.opencode/tools/analyze.py`):
```python
import sys

data = sys.argv[1]
# Process data...
print(f"Analyzed: {data}")
```

### Example 6: Validation Tool

```ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

export default tool({
  description: "Validate email address format",
  args: {
    email: z.string().email().describe("Email to validate"),
  },
  async execute(args) {
    return {
      valid: true,
      email: args.email,
      domain: args.email.split("@")[1],
    };
  },
});
```

### Example 7: Time Tracking

```ts
import { tool } from "@opencode-ai/plugin";

const entries: Record<string, number> = {};

export const startTimer = tool({
  description: "Start a timer for a task",
  args: {
    task: tool.schema.string().describe("Task name"),
  },
  async execute(args) {
    entries[args.task] = Date.now();
    return { started: true, task: args.task };
  },
});

export const stopTimer = tool({
  description: "Stop timer and get elapsed time",
  args: {
    task: tool.schema.string().describe("Task name"),
  },
  async execute(args) {
    const start = entries[args.task];
    if (!start) return { error: "Timer not started" };
    
    const elapsed = Date.now() - start;
    delete entries[args.task];
    
    return {
      task: args.task,
      elapsedMs: elapsed,
      elapsedMin: Math.round(elapsed / 60000 * 100) / 100,
    };
  },
});
```

## Schema Patterns

### With Refinement

```ts
args: {
  password: tool.schema.string()
    .min(8)
    .refine((val) => /[A-Z]/.test(val), {
      message: "Must contain uppercase letter",
    }),
}
```

### With Transform

```ts
args: {
  date: tool.schema.string().transform((val) => new Date(val)),
}
```

### Complex Nested Schema

```ts
args: {
  config: tool.schema.object({
    database: tool.schema.object({
      host: tool.schema.string(),
      port: tool.schema.number().default(5432),
      ssl: tool.schema.boolean().default(true),
    }),
    cache: tool.schema.object({
      enabled: tool.schema.boolean().default(false),
      ttl: tool.schema.number().default(3600),
    }).optional(),
  }),
}
```

## Error Handling

```ts
export default tool({
  description: "Safe file reader",
  args: {
    path: tool.schema.string(),
  },
  async execute(args, context) {
    try {
      const content = await readFile(args.path, "utf-8");
      return { success: true, content };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  },
});
```

## Best Practices

1. **Always describe args** - The AI uses descriptions to understand parameters
2. **Use appropriate types** - Be specific with Zod schemas
3. **Set sensible defaults** - Help the AI make good choices
4. **Return structured data** - Objects are easier for the AI to use
5. **Handle errors gracefully** - Return error info, don't throw
6. **Keep tools focused** - One tool should do one thing well
7. **Use context.worktree** - For file operations, respect the project root
8. **Document side effects** - Note if tool modifies state

## Tool vs Plugin Decision

| Use Tool When | Use Plugin When |
|--------------|-----------------|
| AI needs to invoke functionality | Reacting to events is needed |
| Input/output pattern fits | Modifying behavior globally |
| One-shot operations | Continuous monitoring |
| Callable from conversations | Lifecycle hooks required |

## Source Attribution

- Content synthesized from:
  - opencode.ai/docs/custom-tools: Official custom tools documentation
  - anomalyco/opencode: Tool system implementation
- Canonical source priority: opencode.ai > anomalyco/opencode repo
- Last Updated: 2026-02-11
