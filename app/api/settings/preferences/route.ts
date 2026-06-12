import { NextResponse } from "next/server"
import {
  readPreferences,
  writePreferences,
  DEFAULT_PREFERENCES,
} from "@/lib/settings/store"
import { guardRequest } from "@/lib/sin/guard"
import { getSession } from "@/lib/session"

export async function GET(req: Request) {
  const guard = await guardRequest(req, "settings", 60)
  if (guard) return guard
  const session = await getSession()
  return NextResponse.json(await readPreferences(session?.userId ?? "global"))
}

export async function PUT(req: Request) {
  const guard = await guardRequest(req, "settings", 30)
  if (guard) return guard
  const session = await getSession()
  const userId = session?.userId ?? "global"

  const body = await req.json()
  const prefs = { ...DEFAULT_PREFERENCES, ...(await readPreferences(userId)), ...body }
  if (typeof prefs.customInstructions === "string") {
    prefs.customInstructions = prefs.customInstructions.slice(0, 2000)
  }
  await writePreferences(userId, prefs)
  return NextResponse.json(prefs)
}
