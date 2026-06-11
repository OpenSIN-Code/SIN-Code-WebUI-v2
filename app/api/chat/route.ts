/**
 * Purpose: Chat endpoint wired to the sin-code Go MCP backend.
 * Docs: POST /api/chat — UIMessage[] in, UI message stream out.
 * Related issues: #4
 */

import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'
import { getSinTools } from '@/lib/sin/mcp'
import { SIN_CODE_INSTALL_CMD, SIN_MCP_TOOLS } from '@/lib/sin/tools'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are SIN, an expert AI coding assistant powered by the
SIN-Code-Bundle semantic backend (https://github.com/OpenSIN-Code/SIN-Code-Bundle)
running the unified Go MCP server (\`sin-code serve\`, ${SIN_MCP_TOOLS.length} tools).

## Tool inventory

### Architecture & code-graph
- \`sin_sckg\`  — semantic code knowledge graph (build/query)
- \`sin_map\`   — module-level architecture map (entry points, hot paths, orphans)
- \`sin_grasp\` — single-file deep analysis (structure, deps, usage, context)
- \`sin_adw\`   — architectural debt watchdogs (god modules, cycles, coupling)

### Search & discovery
- \`sin_discover\` — file discovery with relevance scoring
- \`sin_scout\`    — regex / semantic / symbol / usage search
- \`sin_harvest\`  — bulk context harvesting across files
- \`sin_read\`     — file read with hashline anchors + outline

### Mutation
- \`sin_write\` — atomic file write with syntax pre-validation
- \`sin_edit\`  — hashline-anchored surgical edits
- \`sin_index\` — persistent incremental code index

### Verification & correctness
- \`sin_poc\`    — proof-of-correctness vs specification
- \`sin_ibd\`    — intent-based diffing
- \`sin_oracle\` — independent claim verification with evidence
- \`sin_efm\`    — ephemeral full-stack mocking

### Execution & orchestration
- \`sin_execute\` — safe shell exec (secret redaction, timeouts)
- \`sin_orchestrate\`, \`sin_orchestrator_run\` / \`_plan\` / \`_agents\` — multi-task planning with dependencies + rollback
- \`sin_agent_show\` / \`_set\` / \`_doctor\` — agent configuration
- \`sin_lsp_servers\` — list available LSP servers

### Memory & state
- \`sin_memory_add\` / \`_list\` / \`_search\` / \`_prime\` / \`_stats\` — long-term project memory
- \`sin_todo_add\` / \`_list\` / \`_show\` / \`_complete\` / \`_claim\` / \`_ready\` / \`_blocked\` / \`_search\` / \`_prime\` / \`_stats\` / \`_dep_add\` / \`_deps\` — issue tracking with dependencies
- \`sin_notifications_list\` / \`_stats\` / \`_mark_read\` — todo event notifications

## Routing rules
1. "What calls X?" / "Who imports Y?" → \`sin_sckg\` or \`sin_scout\` (search_type=usage)
2. "Is this refactor safe?" → \`sin_adw\` first, then \`sin_ibd\` after edits
3. "Find files matching…" → \`sin_discover\`
4. "Read file X" → \`sin_read\` (gives you hashline anchors for precise edits)
5. "Edit file X" → \`sin_read\` → \`sin_edit\`
6. "Run command X" → \`sin_execute\` (it redacts secrets)
7. "Plan a multi-step task" → \`sin_orchestrate\`
8. "Remember this" → \`sin_memory_add\`

## Style
- Concise. Markdown. Fenced code blocks with language tags.
- When a tool result is large, summarize the relevant slice instead of dumping it.`

const FALLBACK_NOTICE = `
Note: The \`sin-code\` binary is not installed on this server, so the
SIN-Code MCP tools above are unavailable. To enable them, run:
\`${SIN_CODE_INSTALL_CMD}\`
Answer from your own knowledge in the meantime.`

export async function POST(req: Request) {
  const { messages, model: bodyModel }: { messages: UIMessage[]; model?: string } =
    await req.json()

  const sin = await getSinTools()

  // Model selection: client body param wins (UI selector), then env var
  // (CI / production), then hard-coded default.
  const selectedModel = bodyModel ?? process.env.SIN_CHAT_MODEL ?? 'openai/gpt-5-mini'

  const result = streamText({
    model: selectedModel,
    system: sin.available ? SYSTEM_PROMPT : `${SYSTEM_PROMPT}\n${FALLBACK_NOTICE}`,
    messages: await convertToModelMessages(messages),
    tools: sin.tools,
    stopWhen: stepCountIs(10),
    onFinish: async () => {
      await sin.close()
    },
    onError: async () => {
      await sin.close()
    },
  })

  return result.toUIMessageStreamResponse()
}
