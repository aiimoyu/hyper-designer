import type { AgentConfig } from '../types'
import type { AgentDefinition } from '../factory'
import { createAgent, filePrompt } from '../factory'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DEFINITION: AgentDefinition = {
  name: 'Hyper',
  description:
    'Hyper Router Agent - Routes user requests to the correct specialist agent. Can directly handle simple user requests when workflow is not initialized. (Hyper - OhMyOpenCode)',
  mode: 'primary',
  color: '#2563EB',
  defaultTemperature: 0.4,
  promptGenerators: [filePrompt(join(__dirname, 'prompt.md'))],
  defaultPermission: {
    bash: 'deny',
    edit: 'allow',
    skill: 'allow',
    todoread: 'allow',
    webfetch: 'deny',
    websearch: 'deny',
    question: 'allow',
    task: 'allow',
    external_directory: 'allow',
    hd_workflow_state: 'allow',
    hd_handover: 'allow',
    hd_force_next_step: 'allow',
  },
}

export function createHyperAgent(model?: string): AgentConfig {
  return createAgent(DEFINITION, model)
}

createHyperAgent.mode = DEFINITION.mode
