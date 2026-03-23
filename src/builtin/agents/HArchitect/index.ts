import type { AgentDefinition, AgentPromptMetadata } from '../../../sdk/contracts'
import { agentFilePrompt, agentStringPrompt, createSdkAgent } from '../../../sdk/contracts'
import { join } from "path"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export type HArchitectPhase = "interview" | "workflow" | "full"

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

const DEFINITION: AgentDefinition = {
  name: "HArchitect",
  description:
    "System Architect & Requirements Workflow Coordinator - Manages requirements engineering from data collection through functional refinement. After completing each stage document, MUST call @HCritic for quality gate review. Hands over to @HEngineer for system/module design phases. Coordinates multi-stage design with formal documentation and review cycles.",
  mode: "primary",
  color: "#C8102E",
  defaultTemperature: 0.6,
  promptGenerators: [
    agentFilePrompt(join(__dirname, "prompts", "identity.md")),
    agentFilePrompt(join(__dirname, "prompts", "first-principles.md")),
    agentStringPrompt("{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}"),
    agentFilePrompt(join(__dirname, "prompts", "step.md")),
    agentFilePrompt(join(__dirname, "prompts", "file.md")),
    agentFilePrompt(join(__dirname, "prompts", "interview.md")),
    agentFilePrompt(join(__dirname, "prompts", "constraints.md")),
    agentStringPrompt("{HYPER_DESIGNER_WORKFLOW_STEP_PROMPT}"),
  ],
  defaultPermission: {
    bash: "deny",
    edit: "allow",
    skill: "allow",
    todoread: "allow",
    webfetch: "deny",
    websearch: "deny",
    question: "allow",
    task: "allow",
    external_directory: "allow",
    hd_workflow_list: 'deny',
    hd_workflow_select: 'deny',
    hd_workflow_state: "allow",
    hd_handover: "allow",
    hd_force_next_step: "ask",
    hd_record_milestone: "deny",
    call_omo_agent: "deny",
  },
}

export function createHArchitectAgent(model?: string) {
  return createSdkAgent(DEFINITION, model)
}

createHArchitectAgent.mode = DEFINITION.mode
