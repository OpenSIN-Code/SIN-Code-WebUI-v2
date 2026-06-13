/**
 * Purpose: Todo board API.
 * GET  /api/sin/todos?view=list|ready|blocked|stats[&q=…]
 * POST /api/sin/todos { action: 'add'|'complete'|'claim', id?, title? }
 */
// SPDX-License-Identifier: MIT

import { runSin, sinJson } from '@/lib/sin/run'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const view = url.searchParams.get('view') ?? 'list'
  const q = url.searchParams.get('q')

  if (q) return sinJson(await runSin('todo', ['search', q]))
  if (view === 'ready') return sinJson(await runSin('todo', ['ready']))
  if (view === 'blocked') return sinJson(await runSin('todo', ['blocked']))
  if (view === 'stats') return sinJson(await runSin('todo', ['stats']))
  return sinJson(await runSin('todo', ['list']))
}

export async function POST(req: Request) {
  const body: { action: string; id?: string; title?: string } = await req.json()

  switch (body.action) {
    case 'add':
      if (!body.title) {
        return Response.json({ ok: false, error: 'title required' }, { status: 400 })
      }
      return sinJson(await runSin('todo', ['add', body.title]))
    case 'complete':
      if (!body.id) {
        return Response.json({ ok: false, error: 'id required' }, { status: 400 })
      }
      return sinJson(await runSin('todo', ['complete', body.id]))
    case 'claim':
      if (!body.id) {
        return Response.json({ ok: false, error: 'id required' }, { status: 400 })
      }
      return sinJson(await runSin('todo', ['claim', body.id]))
    default:
      return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  }
}
