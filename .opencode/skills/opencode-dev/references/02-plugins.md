---
title: "OpenCode Plugins Complete Guide"
load_when: "User needs to create plugins, implement hooks, or extend OpenCode behavior"
---

# OpenCode Plugins Complete Guide

This guide covers creating OpenCode plugins using `@opencode-ai/plugin`. Plugins extend OpenCode by hooking into events and customizing behavior.

## Overview

Plugins allow you to:
- Integrate external services (notifications, metrics)
- Enforce project policies (sensitive-file protection)
- Modify runtime data (message transforms, parameter tuning)
- Provide custom tools the AI can call

## Installation

```bash
npm install @opencode-ai/plugin
# or
bun add @opencode-ai/plugin
```

## Plugin Locations

Plugins are loaded from:

- `.opencode/plugins/*.ts` - Project-level plugins
- `~/.config/opencode/plugins/*.ts` - Global plugins

## Basic Plugin Structure

A plugin is a JavaScript/TypeScript module that exports an async function.

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const MyPlugin: Plugin = async ({
  project,    // Current project info
  client,     // SDK client for API calls
  $,          // Bun shell API
  directory,  // Current working directory
  worktree,   // Git worktree path
}) => {
  console.log("Plugin initialized!");
  
  return {
    // Event handler - receives all events
    event: async ({ event }) => {
      if (event.type === "session.created") {
        console.log("Session created:", event.properties.info.id);
      }
    },
    
    // Direct hooks
    "tool.execute.before": async (input, output) => {
      console.log("Tool executing:", input.tool);
    },
  };
};
```

## Context Object

The plugin function receives a context object with:

| Property | Type | Description |
|----------|------|-------------|
| `project` | `object` | Project configuration and paths |
| `client` | `SDKClient` | OpenCode SDK client instance |
| `$` | `BunShell` | Bun's shell API for commands |
| `directory` | `string` | Current working directory |
| `worktree` | `string` | Git worktree root path |

## Dependencies

For local plugins needing npm packages, create `.opencode/package.json`:

```json
{
  "dependencies": {
    "shescape": "^2.1.0"
  }
}
```

OpenCode runs `bun install` at startup.

## Available Hooks

### Event Hook (All Events)

**`event`** - Receives all OpenCode events

```ts
event: async ({ event }) => {
  // event.type - the event type
  // event.properties - event-specific data
}
```

**Available Event Types:**
- `session.created` - New session created
- `session.updated` - Session updated
- `session.deleted` - Session deleted
- `session.idle` - Session became idle
- `session.compacted` - Session was compacted
- `session.error` - Session encountered error
- `message.updated` - Message updated
- `message.removed` - Message removed
- `file.edited` - File was modified
- `file.watcher.updated` - File watcher detected changes
- `command.executed` - Command was executed
- `permission.asked` - Permission requested
- `permission.replied` - Permission response received
- `installation.updated` - Installation state changed
- `lsp.client.diagnostics` - LSP diagnostics received
- `lsp.updated` - LSP state updated
- `todo.updated` - Todo list updated
- `tui.prompt.append` - Text appended to prompt
- `tui.command.execute` - TUI command executed
- `tui.toast.show` - Toast notification shown
- `server.connected` - Server connection established
- And more...

### Direct Hooks (Modify Behavior)

These hooks allow you to modify behavior:

- **`chat.message`** - Intercept/modify incoming messages
- **`chat.params`** - Adjust LLM parameters (temperature, etc.)
- **`chat.headers`** - Modify request headers
- **`permission.ask`** - Influence permission decisions
- **`command.execute.before`** - Intercept commands
- **`tool.execute.before`** - Inspect/modify tool input
- **`tool.execute.after`** - Transform tool output
- **`shell.env`** - Inject environment variables
- **`experimental.chat.messages.transform`** - Transform message list
- **`experimental.chat.system.transform`** - Mutate system prompt
- **`experimental.session.compacting`** - Customize compaction
- **`experimental.text.complete`** - Intercept completion text

### Tool Provider Hook

**`tool`** - Provide custom tools

```ts
tool: {
  mytool: tool({
    description: "My custom tool",
    args: { ... },
    async execute(args, context) { ... }
  })
}
```

## Hook Signatures

### Event Hook

```ts
event: async ({ event }) => {
  switch (event.type) {
    case "session.created":
      console.log("Session:", event.properties.info);
      break;
    case "file.edited":
      console.log("File:", event.properties.file);
      break;
  }
}
```

### Direct Hooks with Input/Output

```ts
"tool.execute.before": async (input, output) => {
  // input.tool - tool name
  // input.sessionID - session ID
  // input.callID - call ID
  // Can modify output.args before execution
}
```

## Working Examples

### Example 1: Basic Plugin with Event Handling

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const BasicPlugin: Plugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await client.app.log({
          body: {
            service: "basic-plugin",
            level: "info",
            message: `Session ${event.properties.info.id} created`,
          },
        });
      }
    },
  };
};
```

### Example 2: Notification on Session Idle

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const IdleNotifier: Plugin = async ({ $ }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        await $`osascript -e 'display notification "Session completed!" with title "OpenCode"'`;
      }
    },
  };
};
```

### Example 3: .env File Protection

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const EnvProtection: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args?.filePath?.includes(".env")) {
        throw new Error("Reading .env files is not allowed");
      }
    },
  };
};
```

### Example 4: Inject Environment Variables

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const InjectEnv: Plugin = async () => {
  return {
    "shell.env": async (input, output) => {
      output.env.MY_API_KEY = process.env.MY_API_KEY;
      output.env.PROJECT_ROOT = input.cwd;
    },
  };
};
```

### Example 5: Custom Tool Definition

```ts
import { type Plugin, tool } from "@opencode-ai/plugin";

export const CustomToolsPlugin: Plugin = async () => {
  return {
    tool: {
      ping: tool({
        description: "Return pong with timestamp",
        args: {
          message: tool.schema.string().optional(),
        },
        async execute(args, context) {
          return {
            pong: true,
            timestamp: Date.now(),
            message: args.message ?? "hello",
          };
        },
      }),
    },
  };
};
```

### Example 6: LLM Parameter Tuning

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const ParamsTuner: Plugin = async () => {
  return {
    "chat.params": async (input, output) => {
      // Adjust temperature based on agent
      if (input.agent === "creative") {
        output.temperature = 0.9;
      } else if (input.agent === "precise") {
        output.temperature = 0.2;
      }
    },
  };
};
```

### Example 7: Permission Auto-Allow

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const AutoPermit: Plugin = async () => {
  return {
    "permission.ask": async (input, output) => {
      // Auto-allow reading markdown files
      if (input.action === "read" && input.resource?.endsWith(".md")) {
        output.status = "allow";
      }
    },
  };
};
```

### Example 8: Session Compaction Hook

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const CompactionPlugin: Plugin = async () => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Add custom context to compaction
      output.context.push(`
## Custom Context
Session: ${input.sessionID}
      `);
    },
  };
};
```

### Example 9: Audit Logging

```ts
import type { Plugin } from "@opencode-ai/plugin";

const AUDIT_URL = "https://audit.example.com/collect";

export const AuditPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      await $`curl -X POST ${AUDIT_URL} -d ${JSON.stringify({
        type: "tool.executed",
        tool: input.tool,
        timestamp: Date.now(),
      })}`;
    },
  };
};
```

### Example 10: Event-Based Message Interceptor

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const MessageInterceptor: Plugin = async () => {
  return {
    event: async ({ event }) => {
      if (event.type === "message.updated") {
        // Access message info via event.properties
        console.log("Message updated:", event.properties.info);
      }
    },
  };
};
```

## TypeScript Support

Import types for better IDE support:

```ts
import type { Plugin, ToolContext } from "@opencode-ai/plugin";
import type { Event } from "@opencode-ai/sdk";
```

## Load Order

Plugins load in this order:
1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`opencode.json`)
3. Global plugin directory
4. Project plugin directory (`.opencode/plugins/`)

## Best Practices

1. **Use the event hook for notifications** - Listen to events without modifying behavior
2. **Use direct hooks for modifications** - Only when you need to change inputs/outputs
3. **Keep hooks small** - Do heavy work asynchronously
4. **Use structured logging** - `client.app.log()` instead of `console.log`
5. **Validate inputs** - Use type guards for hook inputs
6. **Handle errors** - Wrap risky operations in try/catch
7. **Document behavior** - Add comments explaining what the plugin does
8. **Test locally** - Test hooks with simple scripts before deploying

## Common Pitfalls

| Issue | Solution |
|-------|----------|
| Event hook not firing | Use `event` hook, not individual event names |
| Plugin not loading | Verify file is `.ts` or `.js` and in correct directory |
| Type errors | Import `Plugin` type from `@opencode-ai/plugin` |
| Missing dependencies | Create `.opencode/package.json` with dependencies |
| Async issues | Always await async operations in hooks |

## Source Attribution

- Content synthesized from:
  - opencode.ai/docs/plugins: Official plugin documentation
  - anomalyco/opencode: Plugin system implementation
- Canonical source priority: opencode.ai > anomalyco/opencode repo
- Last Updated: 2026-02-11
