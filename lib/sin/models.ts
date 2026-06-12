/**
 * Purpose: Map UI model ids (shown in pickers) to real gateway model
 * strings. Env-overridable per tier. Single source of truth for the
 * PromptBox picker, the FollowUpBar picker AND /api/chat.
 */
export const SIN_MODELS = [
  {
    id: 'sin-code-pro',
    label: 'SIN-Code Pro',
    description: 'Most capable — deep refactors, orchestration',
    gateway: process.env.SIN_MODEL_PRO ?? 'anthropic/claude-sonnet-4.5',
  },
  {
    id: 'sin-code-fast',
    label: 'SIN-Code Fast',
    description: 'Low latency — search, reads, quick edits',
    gateway: process.env.SIN_MODEL_FAST ?? 'openai/gpt-5-mini',
  },
  {
    id: 'sin-code-mini',
    label: 'SIN-Code Mini',
    description: 'Lightweight tasks — summaries, todos',
    gateway: process.env.SIN_MODEL_MINI ?? 'google/gemini-3-flash',
  },
] as const

export type SinModelId = (typeof SIN_MODELS)[number]['id']

export function resolveModel(id?: string): string {
  const found = SIN_MODELS.find((m) => m.id === id)
  if (found) return found.gateway
  // Allow raw gateway strings (e.g. from SIN_CHAT_MODEL) to pass through.
  if (id?.includes('/')) return id
  return process.env.SIN_CHAT_MODEL ?? 'openai/gpt-5-mini'
}
