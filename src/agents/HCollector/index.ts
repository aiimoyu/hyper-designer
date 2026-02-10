import type { AgentPromptMetadata } from "../types"
import type { AgentDefinition } from "../factory"
import { createAgent } from "../factory"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export type HCollectorPhase = "interview" | "research" | "design" | "full"

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

const DEFINITION: AgentDefinition = {
  name: "HCollector",
  description:
    "Data Collection & Requirements Gathering Specialist - Typically delegated by @HArchitect at workflow start. Conducts user interviews to clarify vague requirements, collects reference materials and existing documentation, researches domain knowledge and similar systems. Prepares comprehensive context for requirements analysis. Read-mostly agent focused on discovery and information gathering. (HCollector - OhMyOpenCode)",
  mode: "primary",
  color: "#007ACC",
  defaultTemperature: 0.3,
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
    LS: true,
    delegate_task: true,
    Write: true,
    Edit: true,
    Question: true,
    Bash: false,
    task: false,
  },
}

export function createHCollectorAgent(model?: string) {
  return createAgent(DEFINITION, __dirname, model)
}

createHCollectorAgent.mode = DEFINITION.mode
