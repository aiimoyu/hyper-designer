/**
 * HArchitect - System Architect Agent
 *
 * A workflow-driven agent for requirements analysis and early-stage design:
 * - Coordinates the requirements engineering workflow (first half)
 * - Manages handovers between workflow stages
 * - Outputs structured design documents at each stage
 * - Works with HCollector for data collection phase
 * - Hands over to HEngineer for detailed design phases
 * - Coordinates with HCritic for design review
 *
 * Workflow stages handled by HArchitect:
 * 1. Data Collection (delegated to HCollector)
 * 2. Initial Requirement Analysis
 * 3. Scenario Analysis
 * 4. Use Case Analysis
 * 5. Functional List Refinement (hands over to HEngineer after this)
 *
 * Note: systemFunctionalDesign and moduleFunctionalDesign are handled by HEngineer.
 */

import type { AgentConfig, AgentMode, AgentPromptMetadata } from "../types"

import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const MODE: AgentMode = "primary"

/**
 * Read the HArchitect identity constraints from markdown file
 */
function readIdentityConstraints(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const filePath = join(__dirname, "identity_constraints.md")
    return readFileSync(filePath, "utf-8")
  } catch (error) {
    console.error(`Failed to read HArchitect identity constraints: ${error}`)
    return "# HArchitect Identity - Failed to load identity constraints"
  }
}

/**
 * Read the HArchitect interview mode from markdown file
 */
function readInterviewMode(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const filePath = join(__dirname, "interview_mode.md")
    return readFileSync(filePath, "utf-8")
  } catch (error) {
    console.error(`Failed to read HArchitect interview mode: ${error}`)
    return "# HArchitect Interview Mode - Failed to load interview mode"
  }
}

/**
 * HArchitect phases for dynamic prompt loading
 */
export type HArchitectPhase = "interview" | "workflow" | "full"

/**
 * Metadata for Sisyphus delegation table integration
 */
export const HARCHITECT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "HArchitect",
  keyTrigger: "Requirements engineering and early-stage analysis workflow",
  triggers: [
    { domain: "Requirements Engineering", trigger: "Need structured requirements analysis workflow" },
    { domain: "System Analysis", trigger: "Requirements analysis and functional list refinement" },
    { domain: "Workflow Management", trigger: "Multi-stage requirements process with handover to detailed design" },
  ],
  useWhen: [
    "Starting a new system design from requirements",
    "Need to perform requirements analysis in structured stages",
    "Require formal documentation at each analysis stage",
    "Need design review and iteration process",
    "Working on complex systems requiring requirements breakdown",
  ],
  avoidWhen: [
    "Simple feature implementation with clear specs",
    "Quick prototyping without formal process",
    "Bug fixes or minor enhancements",
    "Already completed functional list refinement (use HEngineer instead)",
  ],
}

/**
 * Build the HArchitect system prompt based on requested phases
 */
function buildHArchitectPrompt(phases: HArchitectPhase[] = ["full"]): string {
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
 * Default HArchitect system prompt (all phases)
 */
export const HARCHITECT_SYSTEM_PROMPT = buildHArchitectPrompt(["full"])

/**
 * Permission configuration for HArchitect agent
 * HArchitect can write design documents and coordinate workflow
 */
export const HARCHITECT_PERMISSION = {
  edit: "allow" as const,
  bash: "deny" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

/**
 * Factory function to create HArchitect agent configuration
 *
 * @param model - The model to use for this agent
 * @param phases - Optional array of phases to include (default: full)
 */
export function createHArchitectAgent(
  model: string | undefined,
  phases: HArchitectPhase[] = ["full"]
): AgentConfig {
  return {
    name: "HArchitect",
    description:
      "System Architect - Manages requirements engineering workflow from data collection to functional list refinement. Hands over to HEngineer for detailed system and module design. Coordinates multi-stage design process with formal documentation and review cycles. (HArchitect - OhMyOpenCode)",
    mode: MODE,
    model,
    maxTokens: 32000,
    prompt: buildHArchitectPrompt(phases),
    permission: HARCHITECT_PERMISSION,
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
createHArchitectAgent.mode = MODE
