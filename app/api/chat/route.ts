/**
 * Purpose: Chat endpoint wired to the sin-code Go MCP backend.
 * Docs: POST /api/chat — UIMessage[] in, UI message stream out.
 * Body: { messages, model?: SinModelId | gateway string, agent?: SinAgentId }
 */
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'
import { buildAgentContext } from '@/lib/settings/agent-context'
import { agentPrompt } from '@/lib/sin/agents'
import { getSinTools } from '@/lib/sin/mcp'
import { resolveModel } from '@/lib/sin/models'
import { guardRequest } from '@/lib/sin/run'
import { SIN_CODE_INSTALL_CMD, SIN_MCP_TOOLS } from '@/lib/sin/tools'
import { getSession } from '@/lib/session'
import { getWorkspace, BUILT_IN_WORKSPACES } from '@/lib/workspaces'

export const maxDuration = 120

const SYSTEM_PROMPT = `You are SIN, an expert AI coding agent powered by the
SIN-Code semantic backend (https://github.com/OpenSIN-Code/SIN-Code)
running the unified Go MCP server (\`sin-code serve\`, ${SIN_MCP_TOOLS.length} tools).

## Tool inventory

### Architecture & code-graph
- \`sin_sckg\` — semantic code knowledge graph (build/query)
- \`sin_map\` — module-level architecture map (entry points, hot paths, orphans)
- \`sin_grasp\` — single-file deep analysis (structure, deps, usage, context)
- \`sin_adw\` — architectural debt watchdogs (god modules, cycles, coupling)

### Search & discovery
- \`sin_discover\` — file discovery with relevance scoring
- \`sin_scout\` — regex / semantic / symbol / usage search
- \`sin_harvest\` — bulk context harvesting across files
- \`sin_read\` — file read with hashline anchors + outline

### Mutation
- \`sin_write\` — atomic file write with syntax pre-validation
- \`sin_edit\` — hashline-anchored surgical edits
- \`sin_index\` — persistent incremental code index

### Verification & correctness
- \`sin_poc\` — proof-of-correctness vs specification
- \`sin_ibd\` — intent-based diffing
- \`sin_oracle\` — independent claim verification with evidence
- \`sin_efm\` — ephemeral full-stack mocking

### Execution & orchestration
- \`sin_execute\` — safe shell exec (secret redaction, timeouts)
- \`sin_orchestrate\`, \`sin_orchestrator_run\` / \`_plan\` / \`_agents\` — multi-task planning with dependencies + rollback
- \`sin_agent_show\` / \`_set\` / \`_doctor\` — agent configuration
- \`sin_lsp_servers\` — list available LSP servers

### Memory & state
- \`sin_memory_add\` / \`_list\` / \`_search\` / \`_prime\` / \`_stats\` — long-term project memory
- \`sin_todo_*\` (12 tools) — issue tracking with dependencies
- \`sin_notifications_list\` / \`_stats\` / \`_mark_read\` — todo event notifications

## Routing rules
1. "What calls X?" / "Who imports Y?" -> \`sin_sckg\` or \`sin_scout\` (search_type=usage)
2. "Is this refactor safe?" -> \`sin_adw\` first, then \`sin_ibd\` after edits
3. "Find files matching…" -> \`sin_discover\`
4. "Read file X" -> \`sin_read\` (gives you hashline anchors for precise edits)
5. "Edit file X" -> \`sin_read\` -> \`sin_edit\`
6. "Run command X" -> \`sin_execute\` (it redacts secrets)
7. "Plan a multi-step task" -> \`sin_orchestrate\` / \`sin_orchestrator_plan\`
8. "Remember this" -> \`sin_memory_add\`
9. At session start, consider \`sin_memory_prime\` + \`sin_todo_prime\` to load context.

## Style
- Concise. Markdown. Fenced code blocks with language tags.
- When a tool result is large, summarize the relevant slice instead of dumping it.`

const FALLBACK_NOTICE = `
Note: The \`sin-code\` binary is not installed on this server, so the
SIN-Code MCP tools above are unavailable. To enable them, run:
\`${SIN_CODE_INSTALL_CMD}\`
Answer from your own knowledge in the meantime.`

export async function POST(req: Request) {
  const guard = await guardRequest(req, 'chat', 10, 60_000)
  if (guard) return guard

  const {
    messages,
    model: bodyModel,
    agent,
    workspaceId,
  }: { messages: UIMessage[]; model?: string; agent?: string; workspaceId?: string } = await req.json()

  const session = await getSession()
  const workspace = await getWorkspace(workspaceId ?? 'code', session?.userId ?? null) ?? BUILT_IN_WORKSPACES[0]

  const sin = await getSinTools()
  const selectedModel = resolveModel(bodyModel)

  const persona = agentPrompt(agent)
  const agentContext = await buildAgentContext()
  const system = [SYSTEM_PROMPT, persona, agentContext, sin.available ? '' : FALLBACK_NOTICE]
    .filter(Boolean)
    .join('\n\n')

  const allTools = sin.tools
  const enabled = new Set(workspace.enabledTools)
  const tools = Object.fromEntries(
    Object.entries(allTools).filter(([key]) => enabled.has(key)),
  )

  const result = streamText({
    model: selectedModel,
    system: [system, workspace.systemPrompt].filter(Boolean).join('\n\n'),
    messages: await convertToModelMessages(messages),
    ...(Object.keys(tools).length > 0 ? { tools, stopWhen: stepCountIs(15) } : {}),
    onFinish: async () => {
      await sin.close()
    },
    onError: async () => {
      await sin.close()
    },
  })

  return result.toUIMessageStreamResponse()
}
