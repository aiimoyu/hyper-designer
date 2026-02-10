---
title: "OpenCode Debugging Guide"
load_when: "User needs to debug OpenCode configuration, agents, or tools"
---

# OpenCode Debugging Guide

This guide covers debugging OpenCode using the built-in debug commands and troubleshooting common issues.

## Debug Commands

OpenCode provides a comprehensive `debug` command for diagnostics.

### 1. debug config

View the merged configuration including all loaded agents and settings.

```bash
opencode debug config
```

**Use when:**
- Verifying configuration changes took effect
- Checking which agents are loaded
- Debugging plugin-injected settings

**Output includes:**
- All loaded agents with their configuration
- Plugin settings
- Merged user + global configuration

### 2. debug agent

View agent details and test tool execution.

```bash
# View agent configuration
opencode debug agent <agent-name>

# Test agent with a specific tool
opencode debug agent <agent-name> --tool <tool-name> --params '<json-params>'
```

**Example:**
```bash
opencode debug agent build --tool bash --params '{"command":"ls -la"}'
opencode debug agent plan --tool read --params '{"path":"README.md"}'
```

### 3. debug skill

List all loaded skills with their physical paths.

```bash
opencode debug skill
```

**Use for:**
- Confirming skill loaded correctly
- Finding skill file locations
- Debugging skill conflicts

### 4. debug rg (ripgrep)

Test ripgrep search functionality.

```bash
# Test text search
opencode debug rg search "pattern"

# View file tree
opencode debug rg tree
```

### 5. debug file

Read files with metadata.

```bash
opencode debug file read <path>
opencode debug file status
```

### 6. debug paths

Show OpenCode system paths.

```bash
opencode debug paths
```

**Output:**
```
data       /Users/username/.local/share/opencode
config     /Users/username/.config/opencode
log        /Users/username/.local/share/opencode/log
cache      /Users/username/.cache/opencode
```

### 7. debug lsp

Debug Language Server Protocol integration.

```bash
opencode debug lsp diagnostics <file>
opencode debug lsp symbols <query>
opencode debug lsp document-symbols <file>
```

### 8. debug snapshot

Debug context compression snapshots.

```bash
opencode debug snapshot track
opencode debug snapshot diff <hash>
```

## Debug Command Cheat Sheet

| Command | Purpose |
|---------|---------|
| `opencode debug config` | View merged configuration |
| `opencode debug agent <name>` | View agent details |
| `opencode debug agent <name> --tool <tool>` | Test tool execution |
| `opencode debug skill` | List loaded skills |
| `opencode debug rg search <pattern>` | Test search |
| `opencode debug rg tree` | View file tree |
| `opencode debug file read <path>` | Read file with metadata |
| `opencode debug paths` | Show system paths |
| `opencode debug lsp diagnostics <file>` | LSP diagnostics |

## Troubleshooting Common Issues

### Issue: Plugin Not Loading

**Symptoms:** Plugin code doesn't execute, hooks don't fire

**Check:**
1. File extension must be `.ts` or `.js`
2. File must be in `.opencode/plugins/` directory
3. Must export the plugin function
4. Check syntax with: `bun check plugin.ts`

**Debug:**
```bash
# Check if plugin directory is correct
ls -la .opencode/plugins/

# Check for syntax errors
bun check .opencode/plugins/my-plugin.ts

# View loaded config
opencode debug config | grep -A 10 plugins
```

### Issue: Custom Tool Not Appearing

**Symptoms:** AI can't see or call the custom tool

**Check:**
1. File is in `.opencode/tools/`
2. Uses `tool()` helper from `@opencode-ai/plugin`
3. Has required fields: `description`, `args`, `execute`
4. No syntax errors

**Debug:**
```bash
# Check tool file location
ls -la .opencode/tools/

# Verify tool syntax
bun check .opencode/tools/my-tool.ts

# List available tools (via agent debug)
opencode debug agent build --tool <tool-name> --params '{}'
```

### Issue: Agent Not Responding as Expected

**Symptoms:** Agent behavior doesn't match configuration

**Check:**
1. Agent file is in `.opencode/agents/`
2. Frontmatter is valid YAML
3. Required fields present: `name`, `description`, `model`
4. No conflicting agent names

**Debug:**
```bash
# View agent configuration
opencode debug agent <agent-name>

# Check all loaded agents
opencode debug config | grep -A 5 agents
```

### Issue: Search Not Finding Files

**Symptoms:** Grep/glob not returning expected results

**Check:**
1. Files aren't in `.gitignore`
2. File exists and is readable
3. Pattern syntax is correct

**Debug:**
```bash
# Test file tree
opencode debug rg tree

# Test search directly
opencode debug rg search "pattern"

# Check file read
opencode debug file read <path>
```

### Issue: Permission Denied

**Symptoms:** Agent can't perform an action

**Check:**
1. Agent has required permission in config
2. Permission string format is correct
3. User confirmed the permission request

**Debug:**
```bash
# Check agent permissions
opencode debug agent <agent-name>

# View full config
opencode debug config
```

### Issue: Configuration Not Applied

**Symptoms:** Settings changes don't take effect

**Check:**
1. Config file is valid JSON
2. File is at correct location
3. No syntax errors in config

**Debug:**
```bash
# Validate JSON
node -e "JSON.parse(require('fs').readFileSync('opencode.json'))"

# View merged config
opencode debug config

# Check config file location
opencode debug paths
```

## Log Files

OpenCode logs are stored in:

```
~/.local/share/opencode/log/
```

View recent logs:

```bash
# Latest log file
ls -t ~/.local/share/opencode/log/ | head -1

# Follow logs
tail -f ~/.local/share/opencode/log/opencode.log
```

## Environment Variables

Useful for debugging:

| Variable | Purpose |
|----------|---------|
| `OPENCODE_LOG=debug` | Enable debug logging |
| `OPENCODE_LOG=trace` | Enable trace logging |
| `DEBUG=opencode*` | Node-style debug output |

Example:
```bash
OPENCODE_LOG=debug opencode
```

## Plugin Development Debugging

### Logging from Plugins

Use structured logging instead of `console.log`:

```ts
export const MyPlugin: Plugin = async ({ client }) => {
  await client.app.log({
    body: {
      service: "my-plugin",
      level: "debug",
      message: "Plugin initialized",
      extra: { version: "1.0.0" },
    },
  });
  
  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await client.app.log({
          body: {
            service: "my-plugin",
            level: "info",
            message: "Session created",
            extra: { sessionId: event.properties.info.id },
          },
        });
      }
    },
  };
};
```

### Testing Hooks

Add temporary logging to verify hooks fire:

```ts
export const TestPlugin: Plugin = async () => {
  return {
    "tool.execute.before": async (input) => {
      console.log("Hook fired:", input.tool, input.args);
    },
  };
};
```

## Best Practices

1. **Start with `debug config`** - Always check the merged configuration first
2. **Use `debug agent --tool`** - Test tools before relying on them
3. **Check paths** - Verify files are in expected locations
4. **Validate JSON/YAML** - Syntax errors are common causes
5. **Enable debug logging** - Use `OPENCODE_LOG=debug` for verbose output
6. **Test incrementally** - Make small changes and verify
7. **Check file permissions** - Ensure files are readable

## Getting Help

If debugging doesn't resolve the issue:

1. Check the [OpenCode documentation](https://opencode.ai/docs)
2. Search [GitHub Issues](https://github.com/anomalyco/opencode/issues)
3. Join the [Discord community](https://opencode.ai/discord)
4. Create a minimal reproduction case

## Source Attribution

- Content synthesized from:
  - opencode.ai/docs: Official documentation
  - anomalyco/opencode: Debug command implementation
- Canonical source priority: opencode.ai > anomalyco/opencode repo
- Last Updated: 2026-02-11
