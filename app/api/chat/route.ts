import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'
import { getSinTools } from '@/lib/sin/mcp'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are SIN, an expert AI coding assistant powered by the SIN-Code-Bundle semantic backend (https://github.com/OpenSIN-Code/SIN-Code-Bundle).

When SIN-Code tools are available, prefer them over guessing:
- sin_read for structural file analysis and semantic URIs (sckg://, poc://, ibd://)
- sin_search for unified code search (regex, semantic, symbol, usage)
- sin_edit for hashline-anchored, content-hash verified patches
- sin_bash for safe command execution with secret redaction
- sin_check_architecture / sin_preflight before risky changes
- recall_tool / remember_tool for persistent memory across sessions

Answer concisely. Use markdown. Use fenced code blocks with language tags for code.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const sin = await getSinTools()

  const result = streamText({
    model: 'anthropic/claude-sonnet-4.5',
    system: sin.available
      ? SYSTEM_PROMPT
      : `${SYSTEM_PROMPT}\n\nNote: The sin CLI is not installed on this server, so SIN-Code tools are unavailable. Answer from your own knowledge and tell the user to run \`bash install.sh\` from the SIN-Code-Bundle repo to enable the 37 semantic tools.`,
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
