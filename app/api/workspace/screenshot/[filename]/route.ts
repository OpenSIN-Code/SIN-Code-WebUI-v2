import path from 'node:path'
import { promises as fs } from 'node:fs'

const DIR = path.join(process.cwd(), '.sin-webui', 'screenshots')

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params
  const safe = path.basename(filename) // path-traversal guard
  try {
    const buffer = await fs.readFile(path.join(DIR, safe))
    return new Response(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=31536000' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
