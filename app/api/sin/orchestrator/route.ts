/**
 * Purpose: Orchestrator API for the Tasks page.
 * GET  /api/sin/orchestrator                    — agents + recent runs
 * POST /api/sin/orchestrator { action, task }    — plan or run a task
 */
// SPDX-License-Identifier: MIT

import { runSin, sinJson } from '@/lib/sin/run'

export async function GET() {
  return sinJson(await runSin('orchestrator-agents'))
}

export async function POST(req: Request) {
  const { action, task }: { action?: 'plan' | 'run'; task?: string } =
    await req.json()
  if (!task?.trim()) {
    return Response.json({ ok: false, error: 'task required' }, { status: 400 })
  }
  if (action === 'plan') return sinJson(await runSin('orchestrator-plan', [task.trim()]))
  if (action === 'run') return sinJson(await runSin('orchestrator-run', [task.trim()]))
  return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 })
}
