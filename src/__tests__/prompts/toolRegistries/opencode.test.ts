import { describe, it, expect } from "vitest";
import { OPENCODE_TOOL_REGISTRY } from "../../../prompts/toolRegistries/opencode";

describe("OPENCODE_TOOL_REGISTRY", () => {
  const requiredKeys = [
    "ask_user",
    "create_todos",
    "delegate_review",
    "delegate_explore",
    "delegate_librarian",
    "workflow_handover",
    "workflow_get_state",
    "delegate_critic_review"
  ];

  it("should have all required keys", () => {
    const keys = Object.keys(OPENCODE_TOOL_REGISTRY);
    expect(keys).toHaveLength(requiredKeys.length);
    requiredKeys.forEach(key => {
      expect(keys).toContain(key);
    });
  });

  it("should have non-empty string values", () => {
    Object.values(OPENCODE_TOOL_REGISTRY).forEach(value => {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    });
  });
});