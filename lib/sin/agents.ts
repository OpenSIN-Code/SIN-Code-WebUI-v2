/**
 * Purpose: Agent mode definitions for the chat. Each mode injects a
 * routing-policy block into the system prompt so the model behaves
 * like a specialized sin-code agent (builder / reviewer / planner /
 * scout) instead of a generic chatbot.
 */
export const SIN_AGENTS = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'SIN routes tools automatically',
    prompt: '',
  },
  {
    id: 'build',
    label: 'Builder',
    description: 'Implements changes end-to-end',
    prompt: `## Active agent: BUILDER
You implement changes end-to-end. Mandatory loop for every change:
1. sin_read (get hashline anchors) -> 2. sin_edit / sin_write ->
3. sin_ibd (semantic diff) -> 4. sin_oracle (verify claims).
Never edit a file you have not sin_read in this session.
After the last edit, run sin_adw to confirm no new architectural debt.`,
  },
  {
    id: 'review',
    label: 'Reviewer',
    description: 'Critic / adversary — verification first',
    prompt: `## Active agent: REVIEWER (critic/adversary)
You do NOT mutate files. Allowed: sin_read, sin_scout, sin_sckg, sin_grasp,
sin_map, sin_adw, sin_ibd, sin_poc, sin_oracle.
For every claim you make, attach tool evidence. Flag: security issues,
architectural debt, missing tests, unverified assumptions. Be adversarial.`,
  },
  {
    id: 'plan',
    label: 'Planner',
    description: 'Decomposes work into orchestrated tasks',
    prompt: `## Active agent: PLANNER
You decompose work, you do not implement. Flow:
1. sin_map + sin_sckg to understand the system.
2. sin_orchestrator_plan to produce a dependency-aware task graph.
3. sin_todo_add for each task, sin_todo_dep_add for dependencies.
4. Summarize the plan as a markdown checklist with todo ids.`,
  },
  {
    id: 'scout',
    label: 'Scout',
    description: 'Read-only codebase exploration',
    prompt: `## Active agent: SCOUT (read-only)
Allowed: sin_discover, sin_scout, sin_read, sin_grasp, sin_map, sin_sckg,
sin_harvest, sin_memory_search. You never mutate anything.
Answer with file paths, symbols and line references.`,
  },
] as const

export type SinAgentId = (typeof SIN_AGENTS)[number]['id']

export function agentPrompt(id?: string): string {
  return SIN_AGENTS.find((a) => a.id === id)?.prompt ?? ''
}
