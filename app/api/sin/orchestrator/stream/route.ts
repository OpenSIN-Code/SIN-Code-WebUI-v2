/**
 * Purpose: SSE stream for long-running orchestrator runs.
 * GET /api/sin/orchestrator/stream?task=…
 * Emits: event "line" per stdout line, event "done" with exit code,
 *        event "error" on failure.
 */
import { spawn } from 'node:child_process'
import { guardRequest } from '@/lib/sin/run'

export const maxDuration = 300

const SAFE_TOKEN = /^[\w@./:=,\- ?!]{1,512}$/

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(req: Request) {
  const guard = await guardRequest(req, 'orchestrator-stream', 3, 60_000)
  if (guard) return guard

  const task = new URL(req.url).searchParams.get('task')?.trim()
  if (!task || !SAFE_TOKEN.test(task)) {
    return Response.json({ ok: false, error: 'invalid task' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const bin = process.env.SIN_CODE_BIN || 'sin-code'

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const child = spawn(bin, ['orchestrator-run', task], {
        timeout: 280_000,
      })

      let buffer = ''
      const pushLines = (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.trim()) {
            controller.enqueue(encoder.encode(sse('line', { line })))
          }
        }
      }

      child.stdout.on('data', pushLines)
      child.stderr.on('data', pushLines)

      child.on('error', (err) => {
        const e = err as NodeJS.ErrnoException
        controller.enqueue(
          encoder.encode(
            sse('error', {
              error:
                e.code === 'ENOENT'
                  ? 'sin-code binary not installed'
                  : e.message,
            }),
          ),
        )
        controller.close()
      })

      child.on('close', (code) => {
        if (buffer.trim()) {
          controller.enqueue(encoder.encode(sse('line', { line: buffer })))
        }
        controller.enqueue(encoder.encode(sse('done', { exitCode: code })))
        controller.close()
      })

      req.signal.addEventListener('abort', () => {
        child.kill('SIGTERM')
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
