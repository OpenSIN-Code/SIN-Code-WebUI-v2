import { NextResponse } from "next/server"
import { listDeployments } from "@/lib/vercel/deploy"
import { guardRequest } from "@/lib/sin/run"

export async function GET(req: Request) {
  const guard = await guardRequest(req, "deploy", 60)
  if (guard) return guard
  return NextResponse.json(await listDeployments())
}
