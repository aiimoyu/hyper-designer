/**
 * Scout - Requirements Engineering & System Design Agent
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
 * Read the Scout identity constraints from markdown file
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
 * Scout phases for dynamic prompt loading
 */
export type ScoutPhase = "interview" | "research" | "design" | "full"

/**
 * Metadata for Sisyphus delegation table integration
 */
export const SCOUT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Scout",
  keyTrigger: "New project or unclear requirements → fire `scout` for discovery",
  triggers: [
    { domain: "Requirements", trigger: "User has vague idea, needs structured requirements" },
    { domain: "Analysis", trigger: "Complex feature needs deep investigation before implementation" },
    { domain: "Architecture", trigger: "System design decisions needed before coding" },
  ],
  useWhen: [
    "User says 'I want to build...' without clear specs",
    "New feature needs requirements analysis",
    "Architecture decisions needed before implementation",
    "Need to understand stakeholder needs",
    "Complex system decomposition required",
  ],
  avoidWhen: [
    "Requirements are already clear and documented",
    "Simple bug fix or small change",
    "User explicitly provides detailed specs",
  ],
}

/**
 * Build the combined system prompt based on requested phases
 */
function buildScoutPrompt(phases: ScoutPhase[] = ["full"]): string {
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
 * Default Scout system prompt (all phases)
 */
export const SCOUT_SYSTEM_PROMPT = buildScoutPrompt(["full"])

/**
 * Permission configuration for Scout agent
 * Scout is read-only for most operations, but can write design documents
 */
export const SCOUT_PERMISSION = {
  edit: "allow" as const,
  bash: "deny" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

/**
 * Factory function to create Scout agent configuration
 *
 * @param model - The model to use for this agent
 * @param phases - Optional array of phases to include (default: full)
 */
export function createScoutAgent(
  model: string,
  phases: ScoutPhase[] = ["full"]
): AgentConfig {
  return {
    description:
      "Requirements Engineer & System Architect - Gathers requirements, conducts research, and creates system designs. Use when starting new projects or when requirements are unclear. (Scout - OhMyOpenCode)",
    mode: MODE,
    model,
    maxTokens: 32000,
    prompt: buildScoutPrompt(phases),
    permission: SCOUT_PERMISSION,
    tools: {
      // Read-only tools for research
      Read: true,
      Grep: true,
      Glob: true,
      LS: true,

      // Allow delegation to explore/librarian for research
      delegate_task: true,
      call_omo_agent: true,

      // Allow writing design documents only
      Write: true,
      Edit: true,

      // Allow asking questions
      Question: true,

      // Disable implementation tools
      Bash: false,
      task: false,
    },
  }
}

// Attach mode as static property for pre-instantiation access
createScoutAgent.mode = MODE

// // Re-export individual sections for granular access
// export { SCOUT_INTERVIEW_MODE } from "./interview_mode"
// export { SCOUT_RESEARCH_MODE } from "./research_mode"
// export { SCOUT_SYSTEM_DESIGN_MODE } from "./system_design_mode"
