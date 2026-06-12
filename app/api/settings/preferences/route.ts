import { NextResponse } from "next/server"
import {
  readPreferences,
  writePreferences,
  DEFAULT_PREFERENCES,
} from "@/lib/settings/store"

export async function GET() {
  return NextResponse.json(await readPreferences())
}

export async function PUT(req: Request) {
  const body = await req.json()
  const prefs = { ...DEFAULT_PREFERENCES, ...(await readPreferences()), ...body }
  if (typeof prefs.customInstructions === "string") {
    prefs.customInstructions = prefs.customInstructions.slice(0, 2000)
  }
  await writePreferences(prefs)
  return NextResponse.json(prefs)
}
