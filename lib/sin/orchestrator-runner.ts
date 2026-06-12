import { spawn } from "node:child_process"

const BIN = process.env.SIN_CODE_BIN || "sin-code"

export function runOrchestratorStream(task: string): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const child = spawn(BIN, ["orchestrator-run", task], {
        cwd: process.env.SIN_WORKSPACE_DIR || process.cwd(),
        env: process.env,
      })
      child.stdout.on("data", (chunk: Buffer) => controller.enqueue(encoder.encode(chunk.toString())))
      child.stderr.on("data", (chunk: Buffer) => controller.enqueue(encoder.encode(chunk.toString())))
      child.on("close", () => controller.close())
      child.on("error", (err) => {
        controller.enqueue(encoder.encode(`[error] ${err.message}\n`))
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  })
}
