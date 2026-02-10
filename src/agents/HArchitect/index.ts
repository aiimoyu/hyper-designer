import type { AgentPromptMetadata } from "../types"
import type { AgentDefinition } from "../factory"
import { createAgent } from "../factory"
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
    "System Architect & Requirements Workflow Coordinator - Manages requirements engineering from data collection (delegates to @HCollector) through functional refinement. After completing each stage document, MUST call @HCritic for quality gate review. Hands over to @HEngineer for system/module design phases. Coordinates multi-stage design with formal documentation and review cycles. (HArchitect - OhMyOpenCode)",
  mode: "primary",
  color: "#C8102E",
  defaultTemperature: 0.7,
  defaultMaxTokens: 32000,
  promptFiles: ["identity_constraints.md", "interview_mode.md"],
  defaultPermission: {
    edit: "allow",
    bash: "deny",
    webfetch: "allow",
    question: "allow",
  },
  defaultTools: {
    Read: true,
    Grep: true,
    Glob: true,
    Write: true,
    Edit: true,
    get_hd_workflow_state: true,
    set_hd_workflow_stage: true,
    set_hd_workflow_current: true,
    set_hd_workflow_handover: true,
    delegate_task: true,
    Question: true,
    Bash: false,
    task: false,
  },
}

export function createHArchitectAgent(model?: string) {
  return createAgent(DEFINITION, __dirname, model)
}

createHArchitectAgent.mode = DEFINITION.mode
