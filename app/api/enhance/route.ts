/**
 * Purpose: Rewrite a short user prompt into a more detailed, actionable version via LLM.
 * Docs: route.doc.md
 * Body: { prompt: string, model?: SinModelId | gateway string }
 */
// SPDX-License-Identifier: MIT

import { generateText } from 'ai'
import { guardRequest } from '@/lib/sin/guard'
import { resolveModel } from '@/lib/sin/models'

export const maxDuration = 60

const ENHANCE_SYSTEM = `You are a prompt enhancer. Rewrite the user's prompt to be more detailed, specific, and actionable while preserving the original intent.

Rules:
- Keep it concise (under 200 words).
- Use clear, direct language.
- Do NOT add extra commentary, headings, or markdown formatting.
- Return ONLY the rewritten prompt.`

export async function POST(req: Request) {
  const guard = await guardRequest(req, 'enhance', 10, 60_000)
  if (guard) return guard

  const { prompt, model }: { prompt?: string; model?: string } = await req.json()

  if (!prompt || typeof prompt !== 'string') {
    return Response.json({ ok: false, error: 'Missing prompt' }, { status: 400 })
  }

  const trimmed = prompt.trim()
  if (!trimmed) {
    return Response.json({ ok: false, error: 'Empty prompt' }, { status: 400 })
  }

  const selectedModel = resolveModel(model)

  const { text } = await generateText({
    model: selectedModel,
    system: ENHANCE_SYSTEM,
    prompt: trimmed,
  })

  return Response.json({ ok: true, enhanced: text.trim() })
}
