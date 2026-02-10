import type { AgentPromptMetadata } from "../types"
import type { AgentDefinition } from "../factory"
import { createAgent } from "../factory"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export type HEngineerPhase = "interview" | "design" | "full"

export const HENGINEER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "HEngineer",
  keyTrigger: "System and module detailed design - takes over after HArchitect completes functional refinement. MUST call @HCritic after completing each design stage.",
  triggers: [
    { domain: "System Design", trigger: "Need system requirement decomposition (SR-AR) and system functional design (architecture, tech stack, data models)" },
    { domain: "Module Design", trigger: "Need module functional design (detailed class design, algorithms, implementation specs)" },
    { domain: "Technical Specification", trigger: "Require implementable technical design documents ready for coding" },
  ],
  useWhen: [
    "HArchitect has completed functional refinement and handed over to HEngineer",
    "Need to decompose system requirements into module-level SRs and implementation-level ARs",
    "Require system architecture design with technology stack selection and data models",
    "Need detailed module specifications with class design, algorithms, and implementation guidance",
    "Working on design phases after requirements analysis is complete",
  ],
  avoidWhen: [
    "Requirements analysis phase (IR, Scenario, UseCase, Functional Refinement - use @HArchitect instead)",
    "Simple feature implementation without formal design process",
    "Upstream requirements not yet complete or approved",
  ],
}

const DEFINITION: AgentDefinition = {
  name: "HEngineer",
  description:
    "System Engineer & Technical Design Specialist - Executes system-level design (SR-AR decomposition + system functional design: architecture, tech stack, data models) and module-level design (detailed class design, algorithms, implementation specs). Takes over from @HArchitect after functional refinement. After completing each stage document, MUST call @HCritic for quality gate review. (HEngineer - OhMyOpenCode)",
  mode: "primary",
  color: "#FF6F00",
  defaultTemperature: 0.4,
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

export function createHEngineerAgent(model?: string) {
  return createAgent(DEFINITION, __dirname, model)
}

createHEngineerAgent.mode = DEFINITION.mode
