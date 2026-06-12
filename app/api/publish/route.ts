/**
 * Purpose: Publish endpoint — triggers the GitHub Actions docker.yml workflow.
 * Docs: POST /api/publish → dispatches workflow_dispatch, returns 202.
 * Related issues: #39
 *
 * Uses GitHub's REST API to trigger the docker.yml workflow via
 * workflow_dispatch. The VPS (or local stack) then pulls the new
 * image and restarts — no Docker socket exposure required.
 */

import { NextResponse } from 'next/server'

/** Only POST is supported. */
export const dynamic = 'force-dynamic'

// ── Env vars ────────────────────────────────────────────────

const GITHUB_REPO = process.env.GITHUB_REPO ?? ''
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? ''

// ── Helpers ─────────────────────────────────────────────────

/** Build the GitHub API URL for workflow_dispatch. */
function workflowDispatchUrl(repo: string): string {
  return `https://api.github.com/repos/${repo}/actions/workflows/docker.yml/dispatches`
}

/** Common fetch options for GitHub API calls. */
function githubHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    // Identify the caller — useful for audit logs.
    'User-Agent': 'SIN-Code-WebUI-Publish/1.0',
  }
}

// ── Handler ─────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Validate env
  if (!GITHUB_REPO || !GITHUB_TOKEN) {
    return NextResponse.json(
      {
        status: 'error',
        message:
          'Publish is not configured. Set GITHUB_REPO and GITHUB_TOKEN in .env.',
      },
      { status: 503 },
    )
  }

  // 2. Parse body (best-effort — chatId / projectId / visibility are informational)
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // Empty body is fine — we just trigger the workflow.
  }

  const chatId = (body.chatId as string | undefined) ?? 'unknown'
  const projectId = (body.projectId as string | undefined) ?? undefined
  const visibility = (body.visibility as string | undefined) ?? 'private'

  // 3. Dispatch the workflow
  try {
    const res = await fetch(workflowDispatchUrl(GITHUB_REPO), {
      method: 'POST',
      headers: githubHeaders(GITHUB_TOKEN),
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          chat_id: chatId,
          project_id: projectId ?? '',
          visibility,
        },
      }),
    })

    // 204 = accepted (GitHub returns empty body on success)
    if (res.ok) {
      return NextResponse.json(
        {
          status: 'dispatched',
          message: `Deploy workflow triggered for ${GITHUB_REPO}. Check GitHub Actions for progress.`,
          repo: GITHUB_REPO,
          chatId,
          visibility,
        },
        { status: 202 },
      )
    }

    // 401 / 403 — bad or missing token
    if (res.status === 401 || res.status === 403) {
      const detail = await res.text().catch(() => '')
      return NextResponse.json(
        {
          status: 'error',
          message:
            'GitHub API authentication failed. Check that GITHUB_TOKEN has the "workflow" scope.',
          detail: detail.slice(0, 500),
        },
        { status: 401 },
      )
    }

    // 429 — rate-limited
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') ?? '60'
      return NextResponse.json(
        {
          status: 'error',
          message: `Rate-limited by GitHub. Retry after ${retryAfter}s.`,
          retryAfter: Number(retryAfter),
        },
        { status: 429 },
      )
    }

    // Other errors
    const detail = await res.text().catch(() => '')
    return NextResponse.json(
      {
        status: 'error',
        message: `GitHub API returned ${res.status}.`,
        detail: detail.slice(0, 500),
      },
      { status: 502 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        status: 'error',
        message: `Failed to reach GitHub API: ${msg}`,
      },
      { status: 502 },
    )
  }
}

/** All other methods → 405. */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
