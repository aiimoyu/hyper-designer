/**
 * Tools Prompt Generator
 *
 * 根据runtime类型生成工具使用说明提示词
 */

/**
 * 工具的通用描述（所有runtime共享）
 */
export interface ToolPromptDefinition {
  /** 工具名称 */
  name: string
  /** 工具用途描述 */
  description: string
  /** 使用方式的通用语言描述 */
  usage: string
}

/**
 * Runtime特定的工具语法
 */
export interface RuntimeToolSyntax {
  /** 工具名称 */
  toolName: string
  /** 语法格式 */
  syntax: string
  /** 完整示例 */
  example: string
  /** 参数说明 */
  parameters?: Record<string, string>
}

/**
 * Runtime类型
 */
export type RuntimeType = 'opencode' | 'claudecode'

/**
 * 工具语法注册表
 */
export type ToolSyntaxRegistry = Record<string, RuntimeToolSyntax>

/**
 * 通用工具描述（所有runtime共享）
 */
export const TOOL_DEFINITIONS: Record<string, ToolPromptDefinition> = {
  ask_user: {
    name: 'ask_user',
    description: '向用户提问，获取确认或选择',
    usage: `使用ask_user工具
标题：<header>
问题：<question>
选项：
  - <option1_label>: <option1_description>
  - <option2_label>: <option2_description>
多选：<true|false>`
  },

  task: {
    name: 'task',
    description: '委托子agent执行任务',
    usage: `使用task工具
类型：<explore|librarian|quick>
描述：<description>
提示：<prompt>
后台运行：<true|false>`
  },

  todowrite: {
    name: 'todowrite',
    description: '创建和管理任务列表',
    usage: `使用todowrite工具
任务ID：<unique-id>
任务内容：<content>
状态：<pending|in_progress|completed>
优先级：<high|medium|low>`
  },

  workflow_handover: {
    name: 'workflow_handover',
    description: '执行工作流阶段交接',
    usage: `使用workflow_handover工具
目标阶段：<stage_name>`
  },

  workflow_get_state: {
    name: 'workflow_get_state',
    description: '获取当前工作流状态',
    usage: `使用workflow_get_state工具
直接调用即可获取当前状态`
  },

  delegate_explore: {
    name: 'delegate_explore',
    description: '委托explore agent进行代码探索',
    usage: `使用task工具委托explore agent
描述：<description>
提示：<prompt>`
  },

  delegate_librarian: {
    name: 'delegate_librarian',
    description: '委托librarian agent进行资料收集',
    usage: `使用task工具委托librarian agent
描述：<description>
提示：<prompt>`
  },

  delegate_review: {
    name: 'delegate_review',
    description: '委托HCritic agent进行设计审查',
    usage: `使用task工具委托HCritic agent
描述：<description>
提示：<prompt>`
  }
}

/**
 * OpenCode工具语法
 */
export const OPENCODE_TOOL_SYNTAX: ToolSyntaxRegistry = {
  ask_user: {
    toolName: 'ask_user',
    syntax: 'question({questions: [{header, question, multiple, options}]})',
    example: `question({
  questions: [{
    header: "确认",
    question: "请确认以下内容：",
    multiple: false,
    options: [
      { label: "确认", description: "同意继续" },
      { label: "取消", description: "不同意" }
    ]
  }]
})`,
    parameters: {
      header: 'string - 问题标题',
      question: 'string - 问题内容',
      multiple: 'boolean - 是否允许多选',
      options: 'Array<{label: string, description: string}> - 选项列表'
    }
  },

  task: {
    toolName: 'task',
    syntax: `task({
  category?: string,
  subagent_type?: string,
  load_skills?: string[],
  run_in_background?: boolean,
  description: string,
  prompt: string
})`,
    example: `task({
  subagent_type: "explore",
  load_skills: [],
  run_in_background: false,
  description: "代码探索",
  prompt: "请探索代码库中的..."
})`,
    parameters: {
      category: 'string - agent类别（如quick）',
      subagent_type: 'string - 子agent类型（如explore, librarian）',
      load_skills: 'string[] - 要加载的技能列表',
      run_in_background: 'boolean - 是否后台运行',
      description: 'string - 任务描述',
      prompt: 'string - 详细提示'
    }
  },

  todowrite: {
    toolName: 'todowrite',
    syntax: `todowrite([{
  id: string,
  content: string,
  status: "pending"|"in_progress"|"completed",
  priority: "high"|"medium"|"low"
}])`,
    example: `todowrite([{
  id: "task-1",
  content: "完成需求分析文档",
  status: "pending",
  priority: "high"
}])`,
    parameters: {
      id: 'string - 唯一任务ID',
      content: 'string - 任务内容描述',
      status: 'string - 任务状态',
      priority: 'string - 任务优先级'
    }
  },

  workflow_handover: {
    toolName: 'workflow_handover',
    syntax: 'set_hd_workflow_handover(stageName: string)',
    example: `set_hd_workflow_handover("IRAnalysis")`,
    parameters: {
      stageName: 'string - 目标阶段名称'
    }
  },

  workflow_get_state: {
    toolName: 'workflow_get_state',
    syntax: 'get_hd_workflow_state()',
    example: `const state = get_hd_workflow_state()`,
    parameters: {}
  },

  delegate_explore: {
    toolName: 'delegate_explore',
    syntax: `task({subagent_type: "explore", ...})`,
    example: `task({
  subagent_type: "explore",
  load_skills: [],
  run_in_background: false,
  description: "探索代码库",
  prompt: "请查找..."
})`,
    parameters: {
      '...': '参考task工具的完整参数说明'
    }
  },

  delegate_librarian: {
    toolName: 'delegate_librarian',
    syntax: `task({subagent_type: "librarian", ...})`,
    example: `task({
  subagent_type: "librarian",
  load_skills: [],
  run_in_background: false,
  description: "收集资料",
  prompt: "请查找..."
})`,
    parameters: {
      '...': '参考task工具的完整参数说明'
    }
  },

  delegate_review: {
    toolName: 'delegate_review',
    syntax: `task({category: "quick", ...})`,
    example: `task({
  category: "quick",
  load_skills: [],
  run_in_background: false,
  description: "HCritic审查",
  prompt: "请审查文档..."
})`,
    parameters: {
      '...': '参考task工具的完整参数说明'
    }
  }
}

/**
 * 获取指定runtime的工具语法注册表
 */
function getToolSyntaxRegistry(runtime: RuntimeType): ToolSyntaxRegistry {
  switch (runtime) {
    case 'opencode':
      return OPENCODE_TOOL_SYNTAX
    case 'claudecode':
      // 未来实现Claude Code语法
      throw new Error(`Runtime '${runtime}' not yet supported`)
    default:
      throw new Error(`Unknown runtime: ${runtime}`)
  }
}

/**
 * 生成工具使用说明提示词
 *
 * @param runtime - Runtime类型（opencode/claudecode）
 * @param requiredTools - 需要生成说明的工具列表
 * @returns 生成的工具提示词字符串
 */
export function generateToolsPrompt(
  runtime: RuntimeType,
  requiredTools: string[]
): string {
  const syntaxRegistry = getToolSyntaxRegistry(runtime)

  let prompt = '## 可用工具\n\n'
  prompt += '以下是你可以使用的工具及其用法说明。\n\n'
  prompt += '**重要**：工具的使用方式用通用语言描述，语法示例针对当前环境。\n\n'

  for (const toolName of requiredTools) {
    const definition = TOOL_DEFINITIONS[toolName]
    const syntax = syntaxRegistry[toolName]

    if (!definition) {
      console.warn(`Tool definition not found: ${toolName}`)
      continue
    }

    if (!syntax) {
      console.warn(`Tool syntax not found for ${runtime}: ${toolName}`)
      continue
    }

    prompt += `### ${definition.name}\n\n`
    prompt += `**用途**：${definition.description}\n\n`
    prompt += `**使用方式**：\n\`\`\`\n${definition.usage}\n\`\`\`\n\n`
    prompt += `**语法**（${runtime}）：\n\`\`\`typescript\n${syntax.syntax}\n\`\`\`\n\n`
    prompt += `**示例**：\n\`\`\`typescript\n${syntax.example}\n\`\`\`\n\n`

    if (syntax.parameters && Object.keys(syntax.parameters).length > 0) {
      prompt += `**参数说明**：\n`
      for (const [param, desc] of Object.entries(syntax.parameters)) {
        prompt += `- \`${param}\`: ${desc}\n`
      }
      prompt += '\n'
    }

    prompt += '---\n\n'
  }

  return prompt
}
