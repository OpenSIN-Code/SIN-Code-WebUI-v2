import { getAuth } from '@/lib/auth/better-auth'
import { toNextJsHandler } from 'better-auth/next-js'

export async function GET(req: Request) {
  const auth = getAuth()
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Auth not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const { GET: handler } = toNextJsHandler(auth)
  return handler(req)
}

export async function POST(req: Request) {
  const auth = getAuth()
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Auth not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const { POST: handler } = toNextJsHandler(auth)
  return handler(req)
}
