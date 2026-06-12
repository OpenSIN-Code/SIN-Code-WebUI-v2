/**
 * Purpose: Client-safe workspace types and constants.
 * Everything here is isomorphic (no Node-only imports).
 */

export type WorkspaceLayout = 'chat' | 'writing' | 'data'

export type Workspace = {
  id: string
  name: string
  description: string
  icon: string
  systemPrompt: string
  enabledTools: string[]
  defaultModel: string
  layout: WorkspaceLayout
  builtIn: boolean
  userId?: string | null
}

/** All tool keys the chat route exposes */
export const ALL_TOOL_KEYS = [
  'sin_status',
  'sin_execute',
  'sin_todos',
  'sin_memory',
  'sin_agents',
  'sin_search',
  'sin_map',
  'web_search',
] as const

export const BUILT_IN_WORKSPACES: Workspace[] = [
  {
    id: 'code',
    name: 'Code',
    description: 'Full agent access to the repository. Plan, edit, execute.',
    icon: 'code',
    systemPrompt:
      'You are SIN, an autonomous coding agent with full access to the repository via your tools. Plan before acting, keep changes minimal and verified.',
    enabledTools: [...ALL_TOOL_KEYS],
    defaultModel: 'anthropic/claude-sonnet-4.5',
    layout: 'chat',
    builtIn: true,
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Plain assistant. Fast answers, no tools, no repo access.',
    icon: 'message-circle',
    systemPrompt:
      'You are a helpful, concise assistant. You have no tools and no access to the codebase — answer from knowledge and reasoning alone.',
    enabledTools: [],
    defaultModel: 'google/gemini-3-flash',
    layout: 'chat',
    builtIn: true,
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Web research with sources. Findings are saved to memory.',
    icon: 'globe',
    systemPrompt:
      'You are a research assistant. Search the web for current, reliable information, always cite sources with URLs, and store key findings via sin_memory so they persist across sessions. Summarize neutrally; flag uncertainty.',
    enabledTools: ['web_search', 'sin_memory', 'sin_search'],
    defaultModel: 'anthropic/claude-sonnet-4.5',
    layout: 'chat',
    builtIn: true,
  },
  {
    id: 'data',
    name: 'Data Analysis',
    description: 'Upload CSV/JSON, ask questions, get charts and insights.',
    icon: 'bar-chart',
    systemPrompt:
      'You are a data analyst. The user provides datasets as message context (CSV/JSON excerpts with column metadata). Analyze rigorously: state assumptions, show the calculation path, and answer with concrete numbers. When a chart would help, describe its structure precisely.',
    enabledTools: [],
    defaultModel: 'openai/gpt-5-mini',
    layout: 'data',
    builtIn: true,
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'Personal knowledge base on top of sin-code memory.',
    icon: 'notebook',
    systemPrompt:
      'You are a knowledge-base assistant backed by sin_memory. When the user shares information, store it with descriptive tags. When asked, retrieve and synthesize stored knowledge — always say whether an answer comes from memory or general knowledge.',
    enabledTools: ['sin_memory', 'sin_search'],
    defaultModel: 'google/gemini-3-flash',
    layout: 'chat',
    builtIn: true,
  },
  {
    id: 'writing',
    name: 'Writing',
    description: 'Long-form drafts with a side-by-side document editor.',
    icon: 'pen-line',
    systemPrompt:
      "You are a writing partner. The current draft is provided as message context. Propose concrete edits and rewrites; preserve the author's voice. Output revised passages in Markdown, clearly marked.",
    enabledTools: [],
    defaultModel: 'anthropic/claude-sonnet-4.5',
    layout: 'writing',
    builtIn: true,
  },
]
