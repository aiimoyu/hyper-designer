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
  keyTrigger: "Requirements engineering workflow coordinator - from data collection to functional refinement. MUST delegate to @HCritic after completing each stage document.",
  triggers: [
    { domain: "Requirements Engineering", trigger: "Starting requirements analysis workflow (IR Analysis → Scenario → UseCase → Functional Refinement)" },
    { domain: "System Analysis", trigger: "Need structured requirements breakdown before detailed design" },
    { domain: "Workflow Coordination", trigger: "Managing multi-stage requirements process with quality gates (HCritic) and handover to HEngineer" },
  ],
  useWhen: [
    "Starting a new system design from user requirements",
    "Need to perform IR Analysis, Scenario Analysis, Use Case Analysis, or Functional Refinement",
    "Require formal documentation at each analysis stage with quality reviews",
    "Working on requirements phase (before system/module design)",
    "User provides high-level requirements that need structured analysis",
  ],
  avoidWhen: [
    "System functional design or module design (use @HEngineer instead - HArchitect hands over after functional refinement)",
    "Simple feature implementation with clear specs (no formal workflow needed)",
    "Quick prototyping without formal process",
    "Bug fixes or minor enhancements",
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
      "System Architect & Requirements Workflow Coordinator - Manages requirements engineering from data collection (delegates to @HCollector) through functional refinement. After completing each stage document, MUST call @HCritic for quality gate review. Hands over to @HEngineer for system/module design phases. Coordinates multi-stage design with formal documentation and review cycles. (HArchitect - OhMyOpenCode)",
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
