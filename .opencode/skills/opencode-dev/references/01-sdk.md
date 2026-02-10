---
title: "OpenCode SDK Complete Reference"
load_when: "User needs SDK initialization, API calls, or client patterns"
---

# OpenCode SDK Complete Reference

This guide is a complete, practical reference for the OpenCode JavaScript/TypeScript SDK (`@opencode-ai/sdk`). It covers installation, client initialization, all major API modules, and common real-world patterns.

## Installation

```bash
npm install @opencode-ai/sdk
# or
bun add @opencode-ai/sdk
```

## Client Initialization

### Full Server + Client (createOpencode)

Starts both a local server and client. Useful for programmatic control.

```ts
import { createOpencode } from "@opencode-ai/sdk";

const { client, server } = await createOpencode({
  hostname: "127.0.0.1",
  port: 4096,
  signal: AbortSignal.timeout(30000),
});

console.log(`Server running at ${server.url}`);

// Use the client
const sessions = await client.session.list();

// Cleanup when done
await server.close();
```

### Client-Only Mode

Connect to an existing OpenCode server.

```ts
import { createOpencodeClient } from "@opencode-ai/sdk";

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
  throwOnError: true,
});

const projects = await client.project.list();
```

### Client Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `baseUrl` | `string` | Server URL | `"http://localhost:4096"` |
| `fetch` | `function` | Custom fetch implementation | `globalThis.fetch` |
| `throwOnError` | `boolean` | Throw on HTTP errors | `false` |
| `parseAs` | `string` | Response parsing: "json", "text", "auto" | `"auto"` |
| `responseStyle` | `string` | Return style: "data" or "fields" | `"fields"` |

## API Modules Reference

### 1. Global

Check server health and version.

```ts
const health = await client.global.health();
console.log(health.data.version);  // "1.1.53"
```

### 2. App

Application-level utilities.

```ts
// Write structured logs
await client.app.log({
  body: {
    service: "my-integration",
    level: "info",  // "debug" | "info" | "warn" | "error"
    message: "Operation completed",
    extra: { userId: "123" },
  },
});

// List available agents
const agents = await client.app.agents();
```

### 3. Project

Project management.

```ts
// List all projects
const projects = await client.project.list();

// Get current project
const current = await client.project.current();
console.log(current.name, current.path);
```

### 4. Session (Most Used)

Session creation, messaging, and management.

#### Create and Manage Sessions

```ts
// Create a session
const session = await client.session.create({
  body: { title: "My Session" },
});

// Get session details
const details = await client.session.get({ path: { id: session.id } });

// List all sessions
const sessions = await client.session.list();

// Delete a session
await client.session.delete({ path: { id: session.id } });

// Update session
await client.session.update({
  path: { id: session.id },
  body: { title: "Updated Title" },
});
```

#### Send Messages

```ts
// Simple prompt (waits for response)
const response = await client.session.prompt({
  path: { id: session.id },
  body: {
    model: {
      providerID: "anthropic",
      modelID: "claude-3-5-sonnet-20241022",
    },
    parts: [{ type: "text", text: "Hello!" }],
  },
});
console.log(response.data.text);

// Inject context without reply (for plugins)
await client.session.prompt({
  path: { id: session.id },
  body: {
    noReply: true,
    parts: [{ type: "text", text: "You are a helpful assistant." }],
  },
});

// Execute a command
const cmdResult = await client.session.command({
  path: { id: session.id },
  body: { command: "/help" },
});

// Run shell command
const shellResult = await client.session.shell({
  path: { id: session.id },
  body: { command: "ls -la" },
});
```

#### Session Operations

```ts
// Fork a session
const forked = await client.session.fork({
  path: { id: session.id },
  body: { title: "Forked Session" },
});

// Get session messages
const messages = await client.session.messages({
  path: { id: session.id },
});

// Share/unshare session
await client.session.share({ path: { id: session.id } });
await client.session.unshare({ path: { id: session.id } });

// Summarize session
await client.session.summarize({ path: { id: session.id } });

// Abort running session
await client.session.abort({ path: { id: session.id } });
```

### 5. File Operations

```ts
// Read a file
const file = await client.file.read({
  query: { path: "src/index.ts" },
});
console.log(file.content);

// Get file status
const status = await client.file.status();

// Search for text
const results = await client.find.text({
  query: { pattern: "function.*main" },
});

// Find files by pattern
const files = await client.find.files({
  query: { query: "*.ts", type: "file" },
});

// Find workspace symbols
const symbols = await client.find.symbols({
  query: { query: "MyClass" },
});
```

### 6. TUI Control

Programmatically control the Terminal UI.

```ts
// Append to prompt
await client.tui.appendPrompt({
  body: { text: "Add this to the prompt" },
});

// Submit current prompt
await client.tui.submitPrompt();

// Clear prompt
await client.tui.clearPrompt();

// Show toast notification
await client.tui.showToast({
  body: {
    message: "Task completed!",
    variant: "success",  // "info" | "success" | "warning" | "error"
  },
});

// Open UI panels
await client.tui.openHelp();
await client.tui.openSessions();
await client.tui.openThemes();
await client.tui.openModels();

// Execute a command
await client.tui.executeCommand({
  body: { command: "/clear" },
});
```

### 7. Configuration

```ts
// Get config
const config = await client.config.get();

// Get providers and defaults
const { providers, default: defaults } = await client.config.providers();
```

### 8. Authentication

```ts
// Set API key for a provider
await client.auth.set({
  path: { id: "anthropic" },
  body: {
    type: "api",
    key: process.env.ANTHROPIC_API_KEY,
  },
});
```

### 9. Events (SSE)

Subscribe to real-time events.

```ts
const events = await client.event.subscribe();

for await (const event of events.stream) {
  console.log("Event:", event.type, event.properties);
  
  if (event.type === "session.message") {
    // Handle new message
  }
}

// Later: close the stream
events.stream.return?.();
```

**Event Types:**
- `session.created`, `session.updated`, `session.deleted`
- `message.added`, `message.updated`
- `file.changed`, `file.opened`
- `prompt.started`, `prompt.finished`
- `auth.changed`, `provider.connected`
- And more...

## Error Handling

```ts
import { createOpencodeClient } from "@opencode-ai/sdk";

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
  throwOnError: true,  // Enable throwing on errors
});

try {
  const session = await client.session.get({ path: { id: "invalid-id" } });
} catch (error: any) {
  console.error("Status:", error.status);    // HTTP status code
  console.error("Message:", error.message);  // Error message
  
  if (error.status === 404) {
    // Handle not found
  }
}
```

## TypeScript Types

```ts
import type {
  Session,
  Message,
  Part,
  Project,
  Agent,
  Provider,
  Config,
} from "@opencode-ai/sdk";
```

All types are generated from the server's OpenAPI specification.

## Common Patterns

### Pattern 1: Batch File Processing

```ts
async function analyzeFiles(pattern: string) {
  const files = await client.find.files({
    query: { query: pattern, type: "file" },
  });
  
  const results = [];
  for (const path of files.slice(0, 10)) {  // Limit concurrency
    const content = await client.file.read({ query: { path } });
    results.push({ path, content: content.content });
  }
  
  return results;
}
```

### Pattern 2: Streaming Response Processing

```ts
async function streamSessionEvents(sessionId: string) {
  const events = await client.event.subscribe();
  
  for await (const event of events.stream) {
    if (event.properties?.sessionId === sessionId) {
      yield event;
    }
  }
}
```

### Pattern 3: Session with Context Injection

```ts
async function createContextualSession(context: string) {
  const session = await client.session.create({
    body: { title: "Contextual Session" },
  });
  
  // Inject context without triggering AI response
  await client.session.prompt({
    path: { id: session.id },
    body: {
      noReply: true,
      parts: [{ type: "text", text: context }],
    },
  });
  
  return session;
}
```

### Pattern 4: Error Recovery with Retry

```ts
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      if (error.status >= 500) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}
```

## Best Practices

1. **Use `throwOnError`** during development for easier debugging
2. **Limit concurrency** when reading many files to avoid overwhelming the server
3. **Always close** server instances when done: `await server.close()`
4. **Use `noReply: true`** for context injection to avoid unnecessary AI calls
5. **Subscribe to events** for real-time updates instead of polling
6. **Type your imports** for better IDE support and catch errors early

## Source Attribution

- Content synthesized from:
  - opencode.ai/docs/sdk: Official SDK documentation
  - anomalyco/opencode: SDK source and examples
- Canonical source priority: opencode.ai > anomalyco/opencode repo
- Last Updated: 2026-02-11
