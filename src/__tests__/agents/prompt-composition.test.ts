import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs"
import { join } from "path"
import { generateToolsPrompt, type FrontendType } from "../../prompts/toolsGenerator"
import type { WorkflowState } from "../../workflow/state"

// Local type definition for ToolRegistry (used in placeholder resolution tests)
type ToolRegistry = Record<string, string>

// Test directory for isolated testing
const TEST_DIR = join(process.cwd(), ".test-temp", "prompt-composition-tests")
const WORKFLOW_STATE_PATH = join(process.cwd(), ".hyper-designer", "workflow_state.json")

describe("Prompt Composition Architecture - TDD Tests", () => {
  // Setup and teardown
  beforeEach(() => {
    // Clean up any existing test directories
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  describe("1. Factory loads split prompt files in correct order", () => {
    it("should load prompts in order: identity → constraints → step → workflow → standard → interview → tools", () => {
      // Arrange: Create split prompt files with identifiable content
      const promptsDir = join(TEST_DIR, "prompts")
      mkdirSync(promptsDir, { recursive: true })

      writeFileSync(join(promptsDir, "identity.md"), "# IDENTITY: Test Agent")
      writeFileSync(join(promptsDir, "constraints.md"), "# CONSTRAINTS: Must follow rules")
      writeFileSync(join(promptsDir, "step.md"), "# STEP: Current step instructions")
      writeFileSync(join(promptsDir, "workflow.md"), "# WORKFLOW: Workflow overview")
      writeFileSync(join(promptsDir, "standard.md"), "# STANDARD: Standard operating procedures")
      writeFileSync(join(promptsDir, "interview.md"), "# INTERVIEW: Interview mode instructions")

      // TODO: Implement composePrompt function that loads files in correct order
      // Act
      const composedPrompt = composePrompt(promptsDir, {
        includeTools: true,
        toolList: ["ask_user", "task"],
        frontend: "opencode",
      })

      // Assert: Verify concatenation order using markers
      const identityIndex = composedPrompt.indexOf("# IDENTITY")
      const constraintsIndex = composedPrompt.indexOf("# CONSTRAINTS")
      const stepIndex = composedPrompt.indexOf("# STEP")
      const workflowIndex = composedPrompt.indexOf("# WORKFLOW")
      const standardIndex = composedPrompt.indexOf("# STANDARD")
      const interviewIndex = composedPrompt.indexOf("# INTERVIEW")
      const toolsIndex = composedPrompt.indexOf("## 可用工具")

      expect(identityIndex).toBeGreaterThanOrEqual(0)
      expect(constraintsIndex).toBeGreaterThan(identityIndex)
      expect(stepIndex).toBeGreaterThan(constraintsIndex)
      expect(workflowIndex).toBeGreaterThan(stepIndex)
      expect(standardIndex).toBeGreaterThan(workflowIndex)
      expect(interviewIndex).toBeGreaterThan(standardIndex)
      expect(toolsIndex).toBeGreaterThan(interviewIndex)
    })

    it("should handle missing optional prompt files gracefully", () => {
      // Arrange: Only create required files, omit optional ones
      const promptsDir = join(TEST_DIR, "partial-prompts")
      mkdirSync(promptsDir, { recursive: true })

      writeFileSync(join(promptsDir, "identity.md"), "# IDENTITY")
      writeFileSync(join(promptsDir, "constraints.md"), "# CONSTRAINTS")
      // Missing: step.md, workflow.md, standard.md
      writeFileSync(join(promptsDir, "interview.md"), "# INTERVIEW")

      // Act
      const composedPrompt = composePrompt(promptsDir, {
        includeTools: false,
        toolList: [],
        frontend: "opencode",
      })

      // Assert: Should only include existing files in order
      expect(composedPrompt).toContain("# IDENTITY")
      expect(composedPrompt).toContain("# CONSTRAINTS")
      expect(composedPrompt).toContain("# INTERVIEW")
      expect(composedPrompt).not.toContain("# STEP")
      expect(composedPrompt).not.toContain("# WORKFLOW")
      expect(composedPrompt).not.toContain("# STANDARD")
    })

    it("should fail when required prompt files are missing", () => {
      // Arrange: Empty directory
      const promptsDir = join(TEST_DIR, "empty-prompts")
      mkdirSync(promptsDir, { recursive: true })

      // Act & Assert
      expect(() => {
        composePrompt(promptsDir, {
          includeTools: false,
          toolList: [],
          frontend: "opencode",
        })
      }).toThrow("Required prompt file 'identity.md' not found")
    })
  })

  describe("2. toolsGenerator produces correct output per frontend", () => {
    it("should generate OpenCode-specific tool syntax for opencode frontend", () => {
      // Arrange
      const tools: string[] = ["ask_user", "task", "todowrite"]
      const frontend: FrontendType = "opencode"

      // Act
      const prompt = generateToolsPrompt(frontend, tools)

      // Assert
      expect(prompt).toContain("## 可用工具")
      expect(prompt).toContain("question({")
      expect(prompt).toContain("task({")
      expect(prompt).toContain("todowrite([")
      expect(prompt).toContain("**语法**（opencode）")
    })

    it("should generate Claude Code-specific tool syntax for claudecode frontend", () => {
      // Arrange
      const tools: string[] = ["ask_user", "task"]
      const frontend: FrontendType = "claudecode"

      // Act
      const prompt = generateToolsPrompt(frontend, tools)

      // Assert
      expect(prompt).toContain("## 可用工具")
      expect(prompt).toContain("**语法**（claudecode）")
      // Claude Code uses different syntax than OpenCode
      expect(prompt).toMatch(/@ask_user|@tool:ask_user/)
    })

    it("should throw error for unsupported frontend type", () => {
      // Arrange
      const tools: string[] = ["ask_user"]
      const invalidFrontend = "unsupported" as FrontendType

      // Act & Assert
      expect(() => {
        generateToolsPrompt(invalidFrontend, tools)
      }).toThrow("Unknown frontend: unsupported")
    })

    it("should handle empty tool list gracefully", () => {
      // Arrange
      const tools: string[] = []
      const frontend: FrontendType = "opencode"

      // Act
      const prompt = generateToolsPrompt(frontend, tools)

      // Assert
      expect(prompt).toContain("## 可用工具")
      expect(prompt).toContain("暂无可用工具")
    })

    it("should warn on unknown tools but continue processing", () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      const tools: string[] = ["ask_user", "unknown_tool", "task"]
      const frontend: FrontendType = "opencode"

      // Act
      const prompt = generateToolsPrompt(frontend, tools)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("unknown_tool"))
      expect(prompt).toContain("ask_user")
      expect(prompt).toContain("task")
      expect(prompt).not.toContain("unknown_tool")

      consoleSpy.mockRestore()
    })
  })

  describe("3. workflowId is written to workflow_state.json on new file creation", () => {
    it("should include workflowId when initializing new workflow state", () => {
      // Arrange
      const workflowId = "test-workflow-123"
      const definition = {
        id: workflowId,
        stageOrder: ["stage1", "stage2"],
        stages: {
          stage1: { name: "Stage 1", description: "First stage", promptFile: "stage1.md" },
          stage2: { name: "Stage 2", description: "Second stage", promptFile: "stage2.md" },
        },
      }

      // Clean up any existing workflow state
      if (existsSync(WORKFLOW_STATE_PATH)) {
        rmSync(WORKFLOW_STATE_PATH)
      }

      // Act: Initialize workflow state (should create new file with workflowId)
      const state = getWorkflowStateWithId(definition)

      // Assert
      expect(state.workflowId).toBe(workflowId)

      // Verify file was written with workflowId
      const fileContent = readFileSync(WORKFLOW_STATE_PATH, "utf-8")
      const parsedState = JSON.parse(fileContent) as WorkflowState & { workflowId?: string }
      expect(parsedState.workflowId).toBe(workflowId)
    })

    it("should preserve existing workflowId when reading existing state", () => {
      // Arrange
      const existingWorkflowId = "existing-workflow-456"
      const existingState: WorkflowState & { workflowId: string } = {
        workflowId: existingWorkflowId,
        workflow: {
          stage1: { isCompleted: true },
          stage2: { isCompleted: false },
        },
        currentStep: "stage2",
        handoverTo: null,
      }

      // Write existing state
      const stateDir = join(process.cwd(), ".hyper-designer")
      if (!existsSync(stateDir)) {
        mkdirSync(stateDir, { recursive: true })
      }
      writeFileSync(WORKFLOW_STATE_PATH, JSON.stringify(existingState, null, 2))

      const newDefinition = {
        id: "new-workflow-789",
        stageOrder: ["stage1", "stage2"],
        stages: {},
      }

      // Act
      const state = getWorkflowStateWithId(newDefinition)

      // Assert: Should preserve existing workflowId, not overwrite
      expect(state.workflowId).toBe(existingWorkflowId)
    })

    it("should migrate legacy state without workflowId", () => {
      // Arrange: Create legacy state without workflowId (simulating old file format)
      const legacyState = {
        workflow: {
          dataCollection: { isCompleted: false },
        },
        currentStep: null,
        handoverTo: null,
      } as unknown as WorkflowState

      const stateDir = join(process.cwd(), ".hyper-designer")
      if (!existsSync(stateDir)) {
        mkdirSync(stateDir, { recursive: true })
      }
      writeFileSync(WORKFLOW_STATE_PATH, JSON.stringify(legacyState, null, 2))

      const definition = {
        id: "migrated-workflow",
        stageOrder: ["dataCollection"],
        stages: {},
      }

      // Act
      const state = getWorkflowStateWithId(definition)

      // Assert: Should add workflowId during migration
      expect(state.workflowId).toBe("migrated-workflow")
    })
  })

  describe("4. No {{TOOL:*}} placeholders remain after refactor", () => {
    it("should resolve all TOOL placeholders in composed prompts", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "tools-prompts")
      mkdirSync(promptsDir, { recursive: true })

      writeFileSync(
        join(promptsDir, "identity.md"),
        "You can use {{TOOL:ask_user}} to ask questions."
      )
      writeFileSync(
        join(promptsDir, "constraints.md"),
        "Use {{TOOL:task}} to delegate work."
      )

      const registry: ToolRegistry = {
        ask_user: "question({questions: [...]})",
        task: "task({description: '...', prompt: '...'})",
      }

      // Act
      const composedPrompt = composePromptWithRegistry(promptsDir, registry)

      // Assert
      expect(composedPrompt).not.toMatch(/\{\{TOOL:[a-z_]+\}\}/)
      expect(composedPrompt).toContain("question({questions:")
      expect(composedPrompt).toContain("task({description:")
    })

    it("should throw error for unknown TOOL placeholders", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "bad-prompts")
      mkdirSync(promptsDir, { recursive: true })

      writeFileSync(
        join(promptsDir, "identity.md"),
        "You can use {{TOOL:unknown_tool}} here."
      )

      const registry: ToolRegistry = {
        ask_user: "question({...})",
      }

      // Act & Assert
      expect(() => {
        composePromptWithRegistry(promptsDir, registry)
      }).toThrow("Unknown tool placeholder: {{TOOL:unknown_tool}}")
    })

    it("should handle prompts with no TOOL placeholders", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "clean-prompts")
      mkdirSync(promptsDir, { recursive: true })

      writeFileSync(join(promptsDir, "identity.md"), "# Clean Identity")
      writeFileSync(join(promptsDir, "constraints.md"), "# Clean Constraints")

      const registry: ToolRegistry = {}

      // Act
      const composedPrompt = composePromptWithRegistry(promptsDir, registry)

      // Assert
      expect(composedPrompt).not.toMatch(/\{\{TOOL:/)
      expect(composedPrompt).toContain("# Clean Identity")
      expect(composedPrompt).toContain("# Clean Constraints")
    })
  })

  describe("5. Agent-specific prompt composition rules", () => {
    it("HArchitect should include workflow prompts (workflow.md, step.md)", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "HArchitect-prompts")
      mkdirSync(promptsDir, { recursive: true })

      writeFileSync(join(promptsDir, "identity.md"), "# HArchitect")
      writeFileSync(join(promptsDir, "constraints.md"), "# Constraints")
      writeFileSync(join(promptsDir, "step.md"), "# Step Instructions")
      writeFileSync(join(promptsDir, "workflow.md"), "# Workflow Overview")
      writeFileSync(join(promptsDir, "standard.md"), "# Standards")
      writeFileSync(join(promptsDir, "interview.md"), "# Interview")

      // Act
      const prompt = composeAgentPrompt("HArchitect", promptsDir, {
        includeWorkflow: true,
        frontend: "opencode",
        tools: ["ask_user", "task"],
      })

      // Assert
      expect(prompt).toContain("# Step Instructions")
      expect(prompt).toContain("# Workflow Overview")
    })

    it("HEngineer should include workflow prompts (workflow.md, step.md)", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "HEngineer-prompts")
      mkdirSync(promptsDir, { recursive: true })

      writeFileSync(join(promptsDir, "identity.md"), "# HEngineer")
      writeFileSync(join(promptsDir, "constraints.md"), "# Constraints")
      writeFileSync(join(promptsDir, "step.md"), "# Step Instructions")
      writeFileSync(join(promptsDir, "workflow.md"), "# Workflow Overview")

      // Act
      const prompt = composeAgentPrompt("HEngineer", promptsDir, {
        includeWorkflow: true,
        frontend: "opencode",
        tools: [],
      })

      // Assert
      expect(prompt).toContain("# Step Instructions")
      expect(prompt).toContain("# Workflow Overview")
    })

    it("HCollector should NOT include workflow prompts", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "HCollector-prompts")
      mkdirSync(promptsDir, { recursive: true })

      writeFileSync(join(promptsDir, "identity.md"), "# HCollector")
      writeFileSync(join(promptsDir, "constraints.md"), "# Constraints")
      // HCollector doesn't use workflow.md or step.md

      // Act
      const prompt = composeAgentPrompt("HCollector", promptsDir, {
        includeWorkflow: false, // HCollector doesn't participate in workflow stages
        frontend: "opencode",
        tools: ["ask_user"],
      })

      // Assert
      expect(prompt).not.toContain("# Step Instructions")
      expect(prompt).not.toContain("# Workflow Overview")
    })

    it("HCritic should NOT include workflow prompts", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "HCritic-prompts")
      mkdirSync(promptsDir, { recursive: true })

      writeFileSync(join(promptsDir, "identity.md"), "# HCritic")
      writeFileSync(join(promptsDir, "constraints.md"), "# Constraints")
      // HCritic doesn't use workflow.md or step.md

      // Act
      const prompt = composeAgentPrompt("HCritic", promptsDir, {
        includeWorkflow: false, // HCritic is called ad-hoc, not workflow participant
        frontend: "opencode",
        tools: ["read", "edit"],
      })

      // Assert
      expect(prompt).not.toContain("# Step Instructions")
      expect(prompt).not.toContain("# Workflow Overview")
    })
  })

  describe("6. Edge cases and error handling", () => {
    it("should handle circular dependencies in prompt loading gracefully", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "circular-prompts")
      mkdirSync(promptsDir, { recursive: true })

      // Create prompts that might reference each other (if we add include support later)
      writeFileSync(join(promptsDir, "identity.md"), "# IDENTITY")
      writeFileSync(join(promptsDir, "constraints.md"), "# CONSTRAINTS")

      // Act & Assert: Should not hang or crash
      expect(() => {
        composePrompt(promptsDir, {
          includeTools: false,
          toolList: [],
          frontend: "opencode",
        })
      }).not.toThrow()
    })

    it("should handle very long prompt files without performance issues", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "long-prompts")
      mkdirSync(promptsDir, { recursive: true })

      // Create a large prompt file (100KB)
      const largeContent = "# Large Content\n".repeat(5000)
      writeFileSync(join(promptsDir, "identity.md"), largeContent)
      writeFileSync(join(promptsDir, "constraints.md"), "# Constraints")

      // Act
      const startTime = Date.now()
      const composedPrompt = composePrompt(promptsDir, {
        includeTools: false,
        toolList: [],
        frontend: "opencode",
      })
      const endTime = Date.now()

      // Assert
      expect(composedPrompt).toContain("# Large Content")
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it("should handle special characters in prompt files", () => {
      // Arrange
      const promptsDir = join(TEST_DIR, "special-chars-prompts")
      mkdirSync(promptsDir, { recursive: true })

      const specialContent = `# Identity
Special chars: <>&"'
Unicode: 你好世界 🎉
Markdown: **bold** *italic* \`code\`
RegEx: /\\{\{TOOL:(\w+)\\}\}/g`

      writeFileSync(join(promptsDir, "identity.md"), specialContent)
      writeFileSync(join(promptsDir, "constraints.md"), "# Constraints")

      // Act
      const composedPrompt = composePrompt(promptsDir, {
        includeTools: false,
        toolList: [],
        frontend: "opencode",
      })

      // Assert
      expect(composedPrompt).toContain("Special chars: <>&\"'")
      expect(composedPrompt).toContain("你好世界 🎉")
      expect(composedPrompt).toContain("**bold** *italic*")
    })

    it("should validate required parameters for composePrompt", () => {
      // Act & Assert
      expect(() => {
        composePrompt("", {
          includeTools: false,
          toolList: [],
          frontend: "opencode",
        })
      }).toThrow("Invalid prompts directory: empty string")

      expect(() => {
        composePrompt(TEST_DIR, {
          includeTools: true,
          toolList: ["ask_user"],
          frontend: "" as FrontendType,
        })
      }).toThrow("Invalid frontend type: empty string")
    })
  })
})

// TODO: Implement these functions to make tests pass

/**
 * Composes a prompt from split files in the specified directory
 * TODO: Implement in src/prompts/composition.ts
 */
function composePrompt(
  promptsDir: string,
  options: {
    includeTools: boolean
    toolList: string[]
    frontend: FrontendType
  }
): string {
  // PLACEHOLDER: This will be implemented
  throw new Error("composePrompt not implemented - TDD RED phase")
}

/**
 * Composes a prompt with custom tool registry
 * TODO: Implement in src/prompts/composition.ts
 */
function composePromptWithRegistry(
  promptsDir: string,
  registry: ToolRegistry
): string {
  // PLACEHOLDER: This will be implemented
  throw new Error("composePromptWithRegistry not implemented - TDD RED phase")
}

/**
 * Composes agent-specific prompt with workflow awareness
 * TODO: Implement in src/prompts/composition.ts
 */
function composeAgentPrompt(
  agentName: string,
  promptsDir: string,
  options: {
    includeWorkflow: boolean
    frontend: FrontendType
    tools: string[]
  }
): string {
  // PLACEHOLDER: This will be implemented
  throw new Error("composeAgentPrompt not implemented - TDD RED phase")
}

/**
 * Gets workflow state with workflowId support
 * TODO: Update src/workflow/state.ts to include workflowId
 */
function getWorkflowStateWithId(
  definition: {
    id: string
    stageOrder: string[]
    stages: Record<string, unknown>
  }
): WorkflowState & { workflowId?: string } {
  // PLACEHOLDER: This will be implemented
  throw new Error("getWorkflowStateWithId not implemented - TDD RED phase")
}
