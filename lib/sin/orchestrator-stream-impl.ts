/**
 * Purpose: The actual spawn() implementation of runOrchestratorStream.
 * Lives in its own module (loaded via `await import()` from
 * orchestrator-stream.ts) so Turbopack's NFT tracer never sees spawn()
 * at the orchestrator-stream route boundary (#59 / #60).
 */
// SPDX-License-Identifier: MIT

export async function runOrchestratorStreamImpl(
  task: string,
  signal: AbortSignal | null,
): Promise<Response> {
  const encoder = new TextEncoder()
  const bin = process.env.SIN_CODE_BIN || 'sin-code'

  const sse = (event: string, data: unknown): string =>
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

  const { spawn } = await import('node:child_process')

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

      child.stdout?.on('data', pushLines)
      child.stderr?.on('data', pushLines)

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

      signal?.addEventListener('abort', () => {
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
