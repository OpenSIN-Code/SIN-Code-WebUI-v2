import { runSinCommand } from '@/lib/sin/client'

export async function GET() {
  const result = await runSinCommand('status')
  return Response.json({
    installed: !result.sinMissing,
    ok: result.ok,
    output: result.ok ? result.stdout : result.stderr,
  })
}
