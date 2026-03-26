import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { StageFileItem, WorkflowDefinition } from '../../../types'
import { summarizeHook } from '../../../workflows/stageHooks'
import { filePrompt as workflowFilePrompt } from '../../../workflows/utils'

const __dirname = dirname(fileURLToPath(import.meta.url))

function buildHandoverPrompt(thisName: string, stageTask: string, currentName?: string | null): string {
  const thisDisplay = thisName.toUpperCase()
  const fromDisplay = currentName ? currentName.toUpperCase() : null
  const phaseHeader = fromDisplay
    ? `[ PHASE: ${fromDisplay} → ${thisDisplay} ]`
    : `[ PHASE: ${thisDisplay} ]`
  const switchMsg = fromDisplay
    ? `工作流已从 \`${fromDisplay}\` 切换至 \`${thisDisplay}\`。`
    : `工作流已切换至 \`${thisDisplay}\`。`

  return (
    `${phaseHeader}\n\n` +
    `${switchMsg} 请基于当前上下文与前序产物，${stageTask}，并生成本阶段要求的输出。\n\n` +
    '请遵循 Single-Stage Processing Pipeline，立即开始工作。'
  )
}

const PROJECT_OVERVIEW_OUTPUTS: StageFileItem[] = [
  { id: '项目概览', path: './.hyper-designer/projectToSkill/references/Overview.md', type: 'file', description: 'Project overview with basic info, tech stack, directory structure, and entry points' },
  { id: '系统架构', path: './.hyper-designer/projectToSkill/references/Architecture.md', type: 'file', description: 'System architecture with layers, design patterns, and component relationships' },
  { id: '开发指南', path: './.hyper-designer/projectToSkill/references/Guides.md', type: 'file', description: 'Operational guides for deployment, configuration, testing, and common tasks' },
  { id: '开发纲领', path: './.hyper-designer/projectToSkill/references/Principles.md', type: 'file', description: 'Development principles, coding standards, and design philosophy' },
]

const MODULE_ANALYSIS_INPUTS: StageFileItem[] = [
  { id: '项目概览', path: './.hyper-designer/projectToSkill/references/Overview.md', type: 'file', description: 'Project overview from stage 1' },
  { id: '系统架构', path: './.hyper-designer/projectToSkill/references/Architecture.md', type: 'file', description: 'System architecture from stage 1' },
]

const MODULE_ANALYSIS_OUTPUTS: StageFileItem[] = [
  { id: '模块分析', path: './.hyper-designer/projectToSkill/references/Modules.md', type: 'file', description: 'Module hierarchy, dependencies, interfaces, and data flow' },
]

const DETAILED_MODULES_INPUTS: StageFileItem[] = [
  { id: '模块分析', path: './.hyper-designer/projectToSkill/references/Modules.md', type: 'file', description: 'Module analysis from stage 2' },
  { id: '系统架构', path: './.hyper-designer/projectToSkill/references/Architecture.md', type: 'file', description: 'System architecture from stage 1' },
]

const DETAILED_MODULES_OUTPUTS: StageFileItem[] = [
  { id: '模块详情', path: './.hyper-designer/projectToSkill/references/modules/', type: 'folder', description: 'Individual module analysis files (M001-xxx.md, M002-xxx.md, etc.)' },
]

const SKILL_GENERATION_INPUTS: StageFileItem[] = [
  { id: '项目概览', path: './.hyper-designer/projectToSkill/references/Overview.md', type: 'file', description: 'Project overview from stage 1' },
  { id: '系统架构', path: './.hyper-designer/projectToSkill/references/Architecture.md', type: 'file', description: 'System architecture from stage 1' },
  { id: '模块分析', path: './.hyper-designer/projectToSkill/references/Modules.md', type: 'file', description: 'Module analysis from stage 2' },
  { id: '开发纲领', path: './.hyper-designer/projectToSkill/references/Principles.md', type: 'file', description: 'Development principles from stage 1' },
  { id: '模块详情', path: './.hyper-designer/projectToSkill/references/modules/', type: 'folder', description: 'Module details from stage 3' },
]

const SKILL_GENERATION_OUTPUTS: StageFileItem[] = [
  { id: 'SKILL文件', path: './.hyper-designer/projectToSkill/SKILL.md', type: 'file', description: 'Main skill file with frontmatter, quick reference, and navigation' },
  { id: '项目洞察', path: './.hyper-designer/projectToSkill/references/Insights.md', type: 'file', description: 'LLM insights about code quality, patterns, and recommendations' },
]

export const projectToSkillWorkflow: WorkflowDefinition = {
  id: 'projectToSkill',
  name: 'Project to Skill',
  description: '4-stage workflow: project overview → module analysis → detailed modules → skill generation. Generates architecture docs, module analysis, development principles, and a ready-to-use SKILL.md.',
  entryStageId: 'projectOverview',

  promptBindings: {
    '{HYPER_DESIGNER_WORKFLOW_OVERVIEW_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'projectOverview.md')),
  },

  stages: {
    projectOverview: {
      stageId: 'projectOverview',
      name: 'Project Overview',
      description: 'Analyze the target project: basic info, tech stack, architecture, guides, and development principles.',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STAGE_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'projectOverview.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: [],
      outputs: PROJECT_OVERVIEW_OUTPUTS,
      transitions: [{ id: 'to-module-analysis', toStageId: 'moduleAnalysis', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '执行项目概览分析，生成Overview.md、Architecture.md、Guides.md、Principles.md', currentName),
    },

    moduleAnalysis: {
      stageId: 'moduleAnalysis',
      name: 'Module Analysis',
      description: 'Decompose project into modules: hierarchy, dependencies, interfaces.',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STAGE_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'moduleAnalysis.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: MODULE_ANALYSIS_INPUTS,
      outputs: MODULE_ANALYSIS_OUTPUTS,
      transitions: [{ id: 'to-detailed-modules', toStageId: 'detailedModules', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '分析模块结构，生成Modules.md', currentName),
    },

    detailedModules: {
      stageId: 'detailedModules',
      name: 'Detailed Module Analysis',
      description: 'Deep dive into each module: file structure, classes, functions, design patterns, data flow.',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STAGE_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'detailedModules.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: DETAILED_MODULES_INPUTS,
      outputs: DETAILED_MODULES_OUTPUTS,
      after: [{ id: 'summarize-modules', description: 'Summarize module analysis context', fn: summarizeHook }],
      transitions: [{ id: 'to-skill-generation', toStageId: 'skillGeneration', mode: 'auto', priority: 0 }],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '深入分析每个模块，生成详细的模块分析文件', currentName),
    },

    skillGeneration: {
      stageId: 'skillGeneration',
      name: 'Skill Generation',
      description: 'Generate SKILL.md using skill-creator methodology and Insights.md with observations.',
      agent: 'HAnalysis',
      inject: [{ provider: 'stage-inputs' }, { provider: 'stage-outputs' }],
      promptBindings: {
        '{HYPER_DESIGNER_WORKFLOW_STAGE_PROMPT}': workflowFilePrompt(join(__dirname, 'prompts', 'skillGeneration.md')),
      },
      requiredMilestones: [],
      required: true,
      inputs: SKILL_GENERATION_INPUTS,
      outputs: SKILL_GENERATION_OUTPUTS,
      transitions: [],
      getHandoverPrompt: (currentName, thisName) =>
        buildHandoverPrompt(thisName, '生成SKILL.md和Insights.md，完成项目到skill的转换', currentName),
    },
  },
}
