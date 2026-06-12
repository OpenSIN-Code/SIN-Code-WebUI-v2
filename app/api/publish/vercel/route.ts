/**
 * Purpose: Vercel deployment endpoint — creates a real deployment on Vercel.
 * Docs: POST /api/publish/vercel → deploys workspace files to Vercel.
 * Related issues: #55
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { isVercelConfigured } from '@/lib/vercel/client'
import { createDeployment } from '@/lib/vercel/deploy'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // 1. Auth check
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { status: 'error', message: 'Unauthorized' },
      { status: 401 },
    )
  }

  // 2. Check Vercel configuration
  if (!isVercelConfigured()) {
    return NextResponse.json(
      {
        status: 'error',
        message:
          'Vercel deployment is not configured. Set VERCEL_TOKEN in .env.',
      },
      { status: 503 },
    )
  }

  // 3. Parse body
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // Empty body is fine
  }

  const projectName = (body.projectName as string) || 'sin-app'
  const target = (body.target as 'production' | 'preview') || 'preview'

  // 4. Create deployment
  try {
    const deployment = await createDeployment({
      projectName,
      target,
    })

    return NextResponse.json(
      {
        status: 'deployed',
        message: 'Deployment created on Vercel.',
        deployment: {
          id: deployment.id,
          url: `https://${deployment.url}`,
          state: deployment.readyState,
        },
      },
      { status: 202 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        status: 'error',
        message: `Vercel deployment failed: ${msg}`,
      },
      { status: 502 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
