// SPDX-License-Identifier: MIT

import { NextResponse } from 'next/server'
import { getHistory, undo, redo, clearHistory } from '@/lib/workspace/design-history'

export async function GET() {
  return NextResponse.json(await getHistory())
}

export async function POST(req: Request) {
  const { action } = (await req.json()) as { action?: 'undo' | 'redo' }
  if (action !== 'undo' && action !== 'redo') {
    return NextResponse.json({ error: 'action must be "undo" or "redo"' }, { status: 400 })
  }
  try {
    const entry = action === 'undo' ? await undo() : await redo()
    if (!entry) return NextResponse.json({ ok: false, reason: 'empty-stack' })
    return NextResponse.json({ ok: true, entry })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 409 })
  }
}

export async function DELETE() {
  await clearHistory()
  return NextResponse.json({ ok: true })
}
