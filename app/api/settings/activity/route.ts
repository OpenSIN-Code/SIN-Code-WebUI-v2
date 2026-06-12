import { NextResponse } from "next/server"
import { readActivity, summarize } from "@/lib/settings/activity"
import { guardRequest } from "@/lib/sin/guard"
import { getSession } from "@/lib/session"

export async function GET(req: Request) {
  const guard = await guardRequest(req, "settings", 60)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"
  const events = await readActivity(userId)
  return NextResponse.json({
    summary: summarize(events),
    recent: events.slice(0, 50),
  })
}
