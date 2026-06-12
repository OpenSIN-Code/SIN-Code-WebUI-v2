/**
 * Purpose: Serialize a chat (UIMessage[]) to Markdown for export.
 * Tool calls are rendered as collapsible <details> blocks so the
 * exported file stays readable.
 */
import type { UIMessage } from 'ai'

type AnyPart = {
  type: string
  text?: string
  state?: string
  input?: unknown
  output?: unknown
  errorText?: string
}

function fence(value: unknown, lang = 'json'): string {
  const body =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return `\`\`\`${lang}\n${body}\n\`\`\``
}

export function chatToMarkdown(
  meta: { id: string; label: string },
  messages: UIMessage[],
): string {
  const lines: string[] = [
    `# ${meta.label}`,
    '',
    `> Chat \`${meta.id}\` — exported ${new Date().toISOString()} from SIN-Code WebUI`,
    '',
  ]

  for (const message of messages) {
    lines.push(`## ${message.role === 'user' ? 'User' : 'SIN'}`)
    lines.push('')

    for (const part of (message.parts ?? []) as AnyPart[]) {
      if (part.type === 'text' && part.text?.trim()) {
        lines.push(part.text.trim(), '')
        continue
      }
      if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
        const toolName = part.type.replace(/^tool-/, '')
        const failed = part.state === 'output-error'
        lines.push(
          `<details>`,
          `<summary>Tool: <code>${toolName}</code>${failed ? ' (error)' : ''}</summary>`,
          '',
        )
        if (part.input != null) {
          lines.push('**Input**', '', fence(part.input), '')
        }
        if (failed) {
          lines.push('**Error**', '', fence(part.errorText ?? 'Tool error', 'text'), '')
        } else if (part.output != null) {
          lines.push('**Output**', '', fence(part.output), '')
        }
        lines.push('</details>', '')
      }
    }
  }

  return lines.join('\n')
}
