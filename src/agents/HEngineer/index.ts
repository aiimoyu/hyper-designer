/**
 * HEngineer - System Engineer Agent
 *
 * A workflow-driven agent for system-level and module-level detailed design:
 * - Executes system functional design (combines requirement decomposition + functional design)
 * - Executes module functional design (combines activity decomposition + module design)
 * - Outputs structured technical design documents
 * - Works with HArchitect for upstream requirements
 * - Coordinates with HCritic for design review
 *
 * Workflow stages handled by HEngineer:
 * 1. System Functional Design (systemRequirementDecomposition + systemFunctionalDesign)
 *    - Sub-step 1: System Requirement Decomposition
 *    - Sub-step 2: System Functional Design
 * 2. Module Functional Design (activityRequirementDecomposition + moduleFunctionalDesign)
 *    - Sub-step 1: Activity Requirement Decomposition
 *    - Sub-step 2: Module Functional Design
 */

import type { AgentConfig, AgentMode, AgentPromptMetadata } from "../types"

import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const MODE: AgentMode = "primary"

/**
 * Read the HEngineer identity constraints from markdown file
 */
function readIdentityConstraints(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const filePath = join(__dirname, "identity_constraints.md")
    return readFileSync(filePath, "utf-8")
  } catch (error) {
    console.error(`Failed to read HEngineer identity constraints: ${error}`)
    return "# HEngineer Identity - Failed to load identity constraints"
  }
}

/**
 * Read the HEngineer interview mode from markdown file
 */
function readInterviewMode(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const filePath = join(__dirname, "interview_mode.md")
    return readFileSync(filePath, "utf-8")
  } catch (error) {
    console.error(`Failed to read HEngineer interview mode: ${error}`)
    return "# HEngineer Interview Mode - Failed to load interview mode"
  }
}

/**
 * HEngineer phases for dynamic prompt loading
 */
export type HEngineerPhase = "interview" | "design" | "full"

/**
 * Metadata for Sisyphus delegation table integration
 */
export const HENGINEER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "HEngineer",
  keyTrigger: "System and module level detailed design",
  triggers: [
    { domain: "System Design", trigger: "Need system requirement decomposition and architecture design" },
    { domain: "Module Design", trigger: "Need activity decomposition and detailed module specifications" },
    { domain: "Technical Specification", trigger: "Require implementable technical design documents" },
  ],
  useWhen: [
    "Need to decompose system requirements into modules",
    "Require system architecture and technology stack selection",
    "Need to break down work into executable activities and estimates",
    "Require detailed module technical specifications for implementation",
    "Working on complex systems requiring detailed design phase",
  ],
  avoidWhen: [
    "Simple feature implementation with clear specs",
    "Upstream requirements analysis not yet complete",
    "Need high-level requirements analysis (use HArchitect instead)",
  ],
}

/**
 * Build the HEngineer system prompt based on requested phases
 */
function buildHEngineerPrompt(phases: HEngineerPhase[] = ["full"]): string {
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
    prompt += "\n\n" + interviewMode
  }

  return prompt
}

/**
 * Default HEngineer system prompt (all phases)
 */
export const HENGINEER_SYSTEM_PROMPT = buildHEngineerPrompt(["full"])

/**
 * Permission configuration for HEngineer agent
 * HEngineer can write design documents and coordinate workflow
 */
export const HENGINEER_PERMISSION = {
  edit: "allow" as const,
  bash: "deny" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

/**
 * Factory function to create HEngineer agent configuration
 *
 * @param model - The model to use for this agent
 * @param phases - Optional array of phases to include (default: full)
 */
export function createHEngineerAgent(
  model: string | undefined,
  phases: HEngineerPhase[] = ["full"]
): AgentConfig {
  return {
    name: "HEngineer",
    description:
      "System Engineer - Executes system-level and module-level detailed design. Handles system functional design (decomposition + architecture) and module functional design (activities + specifications). Works with HArchitect for requirements and HCritic for reviews. (HEngineer - OhMyOpenCode)",
    mode: MODE,
    model,
    maxTokens: 32000,
    prompt: buildHEngineerPrompt(phases),
    permission: HENGINEER_PERMISSION,
    tools: {
      // Read tools for research and context
      Read: true,
      Grep: true,
      Glob: true,

      // Write tools for design documents
      Write: true,
      Edit: true,

      // Workflow coordination tools
      get_hd_workflow_state: true,
      set_hd_workflow_stage: true,
      set_hd_workflow_current: true,
      set_hd_workflow_handover: true,

      // Allow delegation to explore/librarian for research
      delegate_task: true,

      // Allow asking questions
      Question: true,

      // Disable implementation tools
      Bash: false,
      task: false,
    },
  }
}

// Attach mode as static property for pre-instantiation access
createHEngineerAgent.mode = MODE
