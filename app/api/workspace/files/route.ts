// SPDX-License-Identifier: MIT

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filePath = searchParams.get('path')

  // Dynamic import keeps fs/path/cwd out of the route boundary the NFT
  // tracer inspects (#59 / #60).
  const { readWorkspaceFile, listWorkspaceTree } = await import('@/lib/workspace/files-fs')

  if (filePath) {
    try {
      const content = await readWorkspaceFile(filePath)
      return NextResponse.json({ content })
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  return NextResponse.json({ nodes: await listWorkspaceTree() })
}
