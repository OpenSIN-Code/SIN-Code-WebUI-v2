/**
 * Purpose: GET /api/sin/agents — list orchestrator agents + agent config.
 * POST { action: 'doctor' } — run the agent doctor.
 */
import { runSin, sinJson } from '@/lib/sin/run'

export async function GET() {
  return sinJson(await runSin('orchestrator-agents'))
}

export async function POST(req: Request) {
  const { action }: { action?: 'doctor' } = await req.json()
  if (action === 'doctor') {
    return sinJson(await runSin('orchestrator-agents', ['--doctor']))
  }
  return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 })
}
