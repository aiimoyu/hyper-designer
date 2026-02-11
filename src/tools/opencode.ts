import type { ToolSyntaxRegistry } from "./index";

export const OPENCODE_TOOL_SYNTAX: ToolSyntaxRegistry = {
  ask_user: {
    uniName: "ask_user",
    description: "向用户提出问题并获取回答",
    syntax: "question({questions: [{header, question, multiple, options}]})",
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
  },

  task: {
    uniName: "task",
    description: "创建并管理子任务代理以完成特定任务",
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
  },

  todowrite: {
    uniName: "todowrite",
    description: "创建或更新待办事项",
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
  },
};
