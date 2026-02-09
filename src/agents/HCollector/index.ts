/**
 * HCollector - Requirements Engineering & System Design Agent
 *
 * A multi-phase agent for:
 * - Phase 1: Requirements Gathering (Interview Mode) - Understand user needs
 * - Phase 2: Research & Analysis - Collect relevant information
 * - Phase 3: System Design - Create architecture and module decomposition
 *
 * Prompts are dynamically composed based on the current phase/mode.
 */

import type { AgentConfig, AgentMode, AgentPromptMetadata } from "../types"

import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const MODE: AgentMode = "primary"

/**
 * Read the HCollector identity constraints from markdown file
 */
function readIdentityConstraints(): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const filePath = join(__dirname, "identity_constraints.md")
  return readFileSync(filePath, "utf-8")
}

function readInterviewMode(): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const filePath = join(__dirname, "interview_mode.md")
  return readFileSync(filePath, "utf-8")
}

/**
 * HCollector phases for dynamic prompt loading
 */
export type HCollectorPhase = "interview" | "research" | "design" | "full"

/**
 * Metadata for Sisyphus delegation table integration
 */
export const HCOLLECTOR_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "HCollector",
  keyTrigger: "Data collection phase - typically delegated by @HArchitect at workflow start. Gathers reference materials, interviews users, and prepares context for requirements analysis.",
  triggers: [
    { domain: "Data Collection", trigger: "Start of workflow - need to collect reference materials, existing docs, and user context" },
    { domain: "Requirements Gathering", trigger: "User has vague ideas - need interview mode to extract structured information" },
    { domain: "Research", trigger: "Need to investigate existing solutions, similar systems, or domain knowledge" },
  ],
  useWhen: [
    "HArchitect delegates data collection phase at workflow start",
    "User provides vague or incomplete requirements - need interview to clarify",
    "Need to collect reference materials, existing documentation, or context",
    "Research phase before formal requirements analysis",
    "Starting a new project with unclear scope - need discovery phase",
  ],
  avoidWhen: [
    "Requirements are already clear and well-documented",
    "Data collection already complete (HArchitect takes over)",
    "Simple feature with explicit specifications",
    "Mid-workflow stages (IR Analysis onwards - handled by HArchitect/HEngineer)",
  ],
}

/**
 * Build the combined system prompt based on requested phases
 */
function buildHCollectorPrompt(phases: HCollectorPhase[] = ["full"]): string {
  const identityConstraints = readIdentityConstraints()
  const interviewMode = readInterviewMode()

  // If "full" is requested, include all phases
  if (phases.includes("full")) {
    return `${identityConstraints}
 ${interviewMode}`
  }

  // Otherwise, build prompt from selected phases
  let prompt = identityConstraints

  if (phases.includes("interview")) {
    prompt += "\n" + interviewMode
  }

  return prompt
}

/**
 * Default HCollector system prompt (all phases)
 */
export const HCOLLECTOR_SYSTEM_PROMPT = buildHCollectorPrompt(["full"])

/**
 * Permission configuration for HCollector agent
 * HCollector is read-only for most operations, but can write design documents
 */
export const HCOLLECTOR_PERMISSION = {
  edit: "allow" as const,
  bash: "deny" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

/**
 * Factory function to create HCollector agent configuration
 *
 * @param model - The model to use for this agent
 * @param phases - Optional array of phases to include (default: full)
 */
export function createHCollectorAgent(
  model: string | undefined,
  phases: HCollectorPhase[] = ["full"]
): AgentConfig {
  return {
    name: "HCollector",
    description:
      "Data Collection & Requirements Gathering Specialist - Typically delegated by @HArchitect at workflow start. Conducts user interviews to clarify vague requirements, collects reference materials and existing documentation, researches domain knowledge and similar systems. Prepares comprehensive context for requirements analysis. Read-mostly agent focused on discovery and information gathering. (HCollector - OhMyOpenCode)",
    mode: MODE,
    model,
    maxTokens: 32000,
    prompt: buildHCollectorPrompt(phases),
    permission: HCOLLECTOR_PERMISSION,
    tools: {
      // Read-only tools for research
      Read: true,
      Grep: true,
      Glob: true,
      LS: true,

      // Allow delegation to explore/librarian for research
      delegate_task: true,

      // Allow writing data collection documents only
      Write: true,
      Edit: true,

      // Allow asking questions for interview mode
      Question: true,

      // Disable implementation tools
      Bash: false,
      task: false,
    },
  }
}

// Attach mode as static property for pre-instantiation access
createHCollectorAgent.mode = MODE

// // Re-export individual sections for granular access
