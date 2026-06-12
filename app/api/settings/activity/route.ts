import { NextResponse } from "next/server"
import { readActivity, summarize } from "@/lib/settings/activity"

export async function GET() {
  const events = await readActivity()
  return NextResponse.json({
    summary: summarize(events),
    recent: events.slice(0, 50),
  })
}
