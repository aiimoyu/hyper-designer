---
name: opencode-dev
description: |
  OpenCode development decision hub. Use this skill when Claude needs to decide
  whether to create an SDK integration, an OpenCode plugin, a local/native tool,
  or an agent/workflow. Load when prompts mention OpenCode, opencode-ai SDK,
  opencode plugin/tool/agent, or code appears under `.opencode/` directories.
  Triggers include: "create plugin", "build tool", "opencode agent",
  `@opencode-ai/sdk`, and file paths like `.opencode/plugins/` or `.opencode/tools/`.
---

# When to Use This Skill

Immediate triggers (load this SKILL.md when any apply):

- Direct user request to "create an OpenCode plugin", "build a tool", "use the
  OpenCode SDK", or "design an agent workflow".
- Conversation mentions opencode-ai SDK, `@opencode-ai/sdk`, or `opencode` runtime.
- Workspace contains `.opencode/plugins/`, `.opencode/tools/`, or opencode config files.
- User asks for decision guidance: "Should I use SDK, plugin, tool, or agent?"

Quick classifier signals (fast heuristics to choose a guide):

- If user needs UI-hosted commands that run inside a local OpenCode runtime →
  Plugin (guides/02-plugins.md).
- If user needs custom tools the LLM can call during conversations →
  Tool (guides/03-tools.md).
- If user wants programmatic API integration, client libraries, or embedding
  OpenCode into another platform → SDK (guides/01-sdk.md).
- If user plans agent configurations or custom agent behaviors →
  Agent (guides/04-agents.md).
- For debugging runtime or configuration issues → Debug (guides/05-debugging.md).

# Decision Matrix — map intent to solution

| Intent | Must-have constraint | Recommended path | Guide (file) |
|--------|---------------------|------------------|--------------|
| Local iteration, fast UI commands | Needs to run inside OpenCode UI; small JS surface | Plugin | guides/02-plugins.md |
| Custom LLM-callable tools | Needs to extend tool surface with custom logic | Tool | guides/03-tools.md |
| Full lifecycle integration, SDK access | Need programmatic client, typed APIs, server SDKs | SDK | guides/01-sdk.md |
| Custom agent configurations | Define agent behavior, prompts, permissions | Agent | guides/04-agents.md |
| Troubleshooting runtime failures | Traces, logs, diagnostic commands | Debug | guides/05-debugging.md |

Decision heuristics (short):

- If the feature touches a host UI (commands, notifications), prefer Plugin.
- If feature adds new capabilities the LLM can invoke, prefer Tool.
- If you need a typed consumption surface (clients, SDKs) for other services
  or teams, prefer SDK.
- If you need custom agent behavior definitions, prefer Agent configuration.

# SDK vs Plugin vs Tool vs Agent — practical tradeoffs

## 1) SDK (guides/01-sdk.md)

Purpose: Embed OpenCode into apps and provide programmatic APIs. Use when the
primary deliverable is a library or client that other developers call.

**Pros:**
- Typed API surface for server and client platforms
- Easier automated testing and CI integration
- Fits well for full-lifecycle integrations (auth, telemetry, multi-tenant)

**Cons:**
- More responsibility for backwards-compatibility
- Higher surface area to maintain

**Installation:**
```bash
npm install @opencode-ai/sdk
```

**TypeScript example — minimal client usage:**

```ts
import { createOpencodeClient } from '@opencode-ai/sdk';

const client = createOpencodeClient({ baseUrl: "http://localhost:4096" });

async function listSessions() {
  return await client.session.list();
}
```

## 2) Plugin (guides/02-plugins.md)

Purpose: Extend OpenCode by hooking into events and customizing behavior.
Run inside the OpenCode host runtime.

**Pros:**
- Fast edit/test loop — reloads inside the host
- Low friction for small developer productivity features
- Access to Bun shell API and SDK client

**Cons:**
- Limited to host capabilities
- Requires understanding of hook system

**Installation:**
```bash
npm install @opencode-ai/plugin
```

**TypeScript example — plugin structure:**

```ts
import type { Plugin } from '@opencode-ai/plugin';

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  console.log("Plugin initialized!");
  
  return {
    // Listen to events
    event: async ({ event }) => {
      if (event.type === "session.created") {
        console.log("New session:", event.properties.info.id);
      }
    },
    
    // Modify behavior
    "tool.execute.before": async (input, output) => {
      console.log("Tool:", input.tool);
    }
  };
};
```

## 3) Tool (guides/03-tools.md)

Purpose: Create custom tools the LLM can call during conversations.

**Pros:**
- Directly callable by the AI
- Type-safe with Zod validation
- Can invoke scripts in any language

**Cons:**
- Limited to request/response pattern
- Must follow tool schema conventions

**TypeScript example — tool definition:**

```ts
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args, context) {
    return `Executed: ${args.query}`;
  },
});
```

## 4) Agent (guides/04-agents.md)

Purpose: Configure AI agent behavior through markdown files.

**Pros:**
- Declarative configuration
- Version-controllable agent behavior
- Supports custom prompts, models, permissions

**Cons:**
- Not programmatic
- Limited to configuration surface

**Example agent configuration:**

```yaml
---
name: "security-auditor"
description: "Security-focused code auditor"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.0
---
```

# Navigation Map — which guide to open

Open the single guide that matches the selected path:

- **01-sdk.md** — SDK patterns, client design, `@opencode-ai/sdk` API reference
- **02-plugins.md** — Plugin lifecycle, hooks, event handling, `@opencode-ai/plugin`
- **03-tools.md** — Custom tools with `tool()` helper, Zod schemas, context access
- **04-agents.md** — Agent configuration files, frontmatter options, permissions
- **05-debugging.md** — Debug commands, diagnostic patterns, troubleshooting

When to load which guide (triggers):

- User: "How do I use the OpenCode SDK?" → load 01-sdk.md
- User: "How do I create a plugin?" → load 02-plugins.md
- User: "How do I add custom tools?" → load 03-tools.md
- User: "How do I configure agents?" → load 04-agents.md
- User: "OpenCode runtime issues" → load 05-debugging.md

# 30‑second Quickstarts

## 1) SDK — create a client in 30s

```bash
npm init -y
npm i @opencode-ai/sdk
```

Create `client.ts`:
```ts
import { createOpencodeClient } from '@opencode-ai/sdk';
const client = createOpencodeClient({ baseUrl: "http://localhost:4096" });
const sessions = await client.session.list();
console.log(sessions);
```

## 2) Plugin — register a hook in 30s

Create `.opencode/plugins/my-plugin.ts`:
```ts
import type { Plugin } from '@opencode-ai/plugin';

export const MyPlugin: Plugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await client.app.log({ body: { service: "my-plugin", level: "info", message: "Session started" } });
      }
    }
  };
};
```

## 3) Tool — create a custom tool in 30s

Create `.opencode/tools/hello.ts`:
```ts
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Say hello",
  args: { name: tool.schema.string() },
  async execute(args) {
    return `Hello, ${args.name}!`;
  },
});
```

## 4) Agent — create agent config in 30s

Create `.opencode/agents/my-agent.md`:
```yaml
---
name: "my-agent"
description: "A custom agent"
model: "anthropic/claude-3-5-sonnet-20241022"
temperature: 0.5
---

You are a helpful assistant specialized in...
```

## 5) Debug — check configuration in 30s

```bash
opencode debug config
opencode debug paths
opencode debug agent <agent-name>
```

# Prerequisites

- Node.js: >= 18 (LTS) recommended
- Package manager: npm, bun, pnpm, or yarn
- TypeScript: >= 4.5
- For plugins/tools: `@opencode-ai/plugin` package
- For SDK: `@opencode-ai/sdk` package

# Path Conventions and Naming Notes

- **Plugins**: `.opencode/plugins/*.ts` or `~/.config/opencode/plugins/`
- **Tools**: `.opencode/tools/*.ts` or `~/.config/opencode/tools/`
- **Agents**: `.opencode/agents/*.md`
- **Config**: `opencode.json` or `~/.config/opencode/opencode.json`
- **Dependencies**: `.opencode/package.json` for local plugins/tools

# Common Pitfalls (decision-focused)

- **Wrong package name**: Use `@opencode-ai/sdk` and `@opencode-ai/plugin`, NOT `@opencode/sdk`
- **Event hook confusion**: Events are received through the `event` hook, NOT individual hooks like `session.created`
- **Plugin vs Tool confusion**: Plugins hook into events; Tools are LLM-callable functions
- **Missing type imports**: Import `Plugin` type from `@opencode-ai/plugin` for TypeScript support
- **Not using tool() helper**: Tools should use the `tool()` factory for proper schema validation

# Load Triggers for the LLM (explicit rules)

**Phrase triggers (user utterance contains any):**
- "create plugin", "opencode plugin", "@opencode-ai/plugin"
- "build tool", "custom tool", "tool() helper"
- "opencode sdk", "@opencode-ai/sdk", "createOpencode"
- "opencode agent", "agent config", ".opencode/agents"
- "opencode debug", "debug config"

**File triggers (workspace contains any path):**
- `.opencode/plugins/`, `.opencode/tools/`, `.opencode/agents/`
- `opencode.json`, `.opencode/package.json`
- Files containing imports from `@opencode-ai/sdk` or `@opencode-ai/plugin`

When a trigger matches, open this SKILL.md and then the single relevant guide
from the Navigation Map.

# How to choose at runtime — short flow

1. Parse the user's request for explicit verbs (create, build, configure) and
   nouns (plugin, tool, SDK, agent).
2. Scan workspace for the file triggers listed in "Load Triggers".
3. If both user intent and file layout point to the same path, load the
   corresponding guide immediately.
4. If signals conflict, ask one clarifying question:
   "Do you need this to hook into OpenCode events (plugin) or be callable by the AI (tool)?"

# Final notes

This SKILL.md is a decision hub — keep it concise and focused on
selection heuristics and load triggers. Do not duplicate implementation details
found in the guides. When deeper instructions are required, open the single
guide mapped in the Navigation Map (01–05).

# Appendix — practical patterns

## Plugin with Event Handler

```ts
import type { Plugin } from "@opencode-ai/plugin";

export const MyPlugin: Plugin = async (ctx) => {
  return {
    event: async ({ event }) => {
      switch (event.type) {
        case "session.created":
          console.log("Session created");
          break;
        case "file.edited":
          console.log("File edited:", event.properties.file);
          break;
      }
    }
  };
};
```

## Plugin with Custom Tool

```ts
import { type Plugin, tool } from "@opencode-ai/plugin";

export const MyPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      mytool: tool({
        description: "Custom tool",
        args: { foo: tool.schema.string() },
        async execute(args, context) {
          return `Hello ${args.foo}`;
        },
      }),
    },
  };
};
```

## SDK session interaction example

```ts
import { createOpencodeClient } from "@opencode-ai/sdk";

const client = createOpencodeClient({ baseUrl: "http://localhost:4096" });
const session = await client.session.create({ body: { title: "Demo" } });
const result = await client.session.prompt({
  path: { id: session.id },
  body: { parts: [{ type: "text", text: "Hello!" }] },
});
```

## GitHub Actions CI sample

```yaml
name: Build & Validate
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
      - name: Type check plugins
        run: bun check .opencode/plugins/*.ts
```

# Governance & Security quick reminders

- Secrets: do not store API keys in code. Use environment variables.
- Dependencies: pin versions in package.json for reproducible builds.
- Permissions: follow least-privilege when configuring agent permissions.

# Change log and maintenance guidance

When you update SKILL.md, change only decision heuristics, triggers, or the
Navigation Map. Implementation guidance belongs in the 01–05 guides.

---

## Source Attribution
- Content synthesized from:
  - opencode.ai: Official SDK and Plugin documentation
  - anomalyco/opencode: GitHub repository and examples
- Canonical source priority: opencode.ai > anomalyco/opencode repo
- Last Updated: 2026-02-11
