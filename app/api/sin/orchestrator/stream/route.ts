/**
 * Purpose: SSE stream for long-running orchestrator runs.
 * GET /api/sin/orchestrator/stream?task=…
 * Emits: event "line" per stdout line, event "done" with exit code,
 *        event "error" on failure.
 *
 * The actual spawn() lives in lib/sin/orchestrator-stream.ts and is
 * dynamically imported so the NFT tracer never sees child_process at
 * the route boundary (#59 / #60).
 */
import { guardRequest } from '@/lib/sin/guard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

const SAFE_TOKEN = /^[\w@./:=,\- ?!]{1,512}$/

export async function GET(req: Request) {
  const guard = await guardRequest(req, 'orchestrator-stream', 3, 60_000)
  if (guard) return guard

  const task = new URL(req.url).searchParams.get('task')?.trim()
  if (!task || !SAFE_TOKEN.test(task)) {
    return Response.json({ ok: false, error: 'invalid task' }, { status: 400 })
  }

  const { runOrchestratorStream } = await import('@/lib/sin/orchestrator-stream')
  return await runOrchestratorStream(task, req.signal)
}
