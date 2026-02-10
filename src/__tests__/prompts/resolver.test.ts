import { describe, it, expect } from "vitest";
import { resolvePrompt } from "../../prompts/resolver";

describe("resolvePrompt", () => {
  const registry = {
    ask_user: "question({...})",
    create_todos: "todowrite([...])"
  };

  it("should resolve known placeholders", () => {
    const prompt = "Use {{TOOL:ask_user}} to ask the user";
    const result = resolvePrompt(prompt, registry);
    expect(result).toBe("Use question({...}) to ask the user");
  });

  it("should return unchanged when no placeholders", () => {
    const prompt = "This is a plain prompt";
    const result = resolvePrompt(prompt, registry);
    expect(result).toBe(prompt);
  });

  it("should throw error for unknown placeholder", () => {
    const prompt = "Use {{TOOL:unknown_tool}}";
    expect(() => resolvePrompt(prompt, registry)).toThrow(
      "Unknown tool placeholder: {{TOOL:unknown_tool}}. Available tools: ask_user, create_todos"
    );
  });

  it("should resolve multiple placeholders", () => {
    const prompt = "{{TOOL:ask_user}} and {{TOOL:create_todos}}";
    const result = resolvePrompt(prompt, registry);
    expect(result).toBe("question({...}) and todowrite([...])");
  });
});