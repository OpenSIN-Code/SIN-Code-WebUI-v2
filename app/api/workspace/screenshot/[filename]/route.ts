// SPDX-License-Identifier: MIT

import path from 'node:path'
import { promises as fs } from 'node:fs'

let _dir: string | null = null
// @turbopack-disable-next-line
function dir(): string {
  if (!_dir) _dir = /*turbopackIgnore: true*/ path.join(process.cwd(), '.sin-webui', 'screenshots')
  return _dir
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params
  const safe = path.basename(filename) // path-traversal guard
  try {
    const buffer = await fs.readFile(/*turbopackIgnore: true*/ path.join(dir(), safe))
    return new Response(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=31536000' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
