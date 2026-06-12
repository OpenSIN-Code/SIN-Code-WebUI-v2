import { NextResponse } from "next/server"
import { isVercelConfigured } from "@/lib/vercel/client"
import { createDeployment, getDeploymentStatus } from "@/lib/vercel/deploy"
import { guardRequest } from "@/lib/sin/run"

export const maxDuration = 300

export async function POST(req: Request) {
  const guard = await guardRequest(req, "deploy", 5)
  if (guard) return guard
  if (!isVercelConfigured()) {
    return NextResponse.json({ error: "VERCEL_TOKEN is not configured" }, { status: 503 })
  }
  const { target = "preview", projectName = "sin-workspace" } = await req.json().catch(() => ({}))
  try {
    const deployment = await createDeployment({ projectName, target })
    return NextResponse.json({
      id: deployment.id,
      url: `https://${deployment.url}`,
      status: deployment.readyState,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// Status-Polling: GET /api/workspace/deploy?id=dpl_xxx
export async function GET(req: Request) {
  const guard = await guardRequest(req, "deploy", 60)
  if (guard) return guard
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const d = await getDeploymentStatus(id)
  return NextResponse.json({ id: d.id, url: `https://${d.url}`, status: d.readyState })
}
