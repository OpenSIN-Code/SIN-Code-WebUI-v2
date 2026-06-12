import { NextResponse } from 'next/server'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'

const DIR = path.join(process.cwd(), '.sin-webui', 'screenshots')
const INDEX = path.join(process.cwd(), '.sin-webui', 'screenshots.json')

type Meta = { id: string; filename: string; createdAt: string; size: number }

async function readIndex(): Promise<Meta[]> {
  try {
    return JSON.parse(await fs.readFile(INDEX, 'utf8')) as Meta[]
  } catch {
    return []
  }
}

export async function GET() {
  return NextResponse.json(await readIndex())
}

export async function POST(req: Request) {
  const { dataUrl } = (await req.json()) as { dataUrl?: string }
  if (!dataUrl?.startsWith('data:image/png;base64,')) {
    return NextResponse.json({ error: 'dataUrl (image/png) required' }, { status: 400 })
  }
  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64')
  if (buffer.length > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Screenshot too large' }, { status: 413 })
  }
  await fs.mkdir(DIR, { recursive: true })
  const id = randomUUID()
  const filename = `${Date.now()}-${id.slice(0, 8)}.png`
  await fs.writeFile(path.join(DIR, filename), buffer)

  const index = await readIndex()
  index.unshift({ id, filename, createdAt: new Date().toISOString(), size: buffer.length })
  await fs.writeFile(INDEX, JSON.stringify(index.slice(0, 200), null, 2))

  return NextResponse.json({ id, url: `/api/workspace/screenshot/${filename}` })
}

export async function DELETE(req: Request) {
  const { id } = (await req.json()) as { id?: string }
  const index = await readIndex()
  const meta = index.find((m) => m.id === id)
  if (meta) {
    await fs.rm(path.join(DIR, meta.filename), { force: true })
    await fs.writeFile(INDEX, JSON.stringify(index.filter((m) => m.id !== id), null, 2))
  }
  return NextResponse.json({ ok: true })
}
