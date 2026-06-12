import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { loc, oldClasses, newClasses } = await req.json()

  if (typeof oldClasses !== 'string' || typeof newClasses !== 'string') {
    return NextResponse.json({ error: 'oldClasses and newClasses required' }, { status: 400 })
  }
  if (typeof loc !== 'string' || !loc.includes(':')) {
    return NextResponse.json(
      { error: 'loc required (file:line). Add data-sin-loc attributes to your dev build.' },
      { status: 400 },
    )
  }

  // Dynamic import keeps fs/path/cwd out of the route boundary the NFT
  // tracer inspects — this is what finally clears the warning (#59).
  const { applyClassEdit } = await import('@/lib/workspace/design-edit-fs')
  const result = await applyClassEdit(loc, oldClasses, newClasses)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json({ ok: true, file: result.file, line: result.line })
}
