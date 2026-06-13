// SPDX-License-Identifier: MIT

import { promises as fs } from "fs"
import path from "path"

let _base: string | null = null
function base(): string {
  if (!_base) _base = path.join(/*turbopackIgnore: true*/ process.cwd(), ".sin-webui")
  return _base
}

function activityFile(userId: string): string {
  if (userId === "global") return path.join(base(), "activity.jsonl")
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_")
  return path.join(base(), "users", safe, "activity.jsonl")
}

export interface ActivityEvent {
  ts: string
  type: "chat" | "tool_call" | "agent_run" | "error"
  model?: string
  tokensIn?: number
  tokensOut?: number
  label?: string
}

export async function logActivity(userId: string = "global", event: Omit<ActivityEvent, "ts">): Promise<void> {
  const file = activityFile(userId)
  await fs.mkdir(path.dirname(file), { recursive: true })
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event })
  await fs.appendFile(file, line + "\n", "utf8")
}

export async function readActivity(userId: string = "global", limit = 500): Promise<ActivityEvent[]> {
  try {
    const file = activityFile(userId)
    const raw = await fs.readFile(file, "utf8")
    const lines = raw.trim().split("\n")
    return lines
      .slice(-limit)
      .map((l) => {
        try {
          return JSON.parse(l) as ActivityEvent
        } catch {
          return null
        }
      })
      .filter((e): e is ActivityEvent => e !== null)
      .reverse()
  } catch {
    return []
  }
}

export interface UsageSummary {
  totalChats: number
  totalToolCalls: number
  totalTokensIn: number
  totalTokensOut: number
  byDay: { date: string; chats: number; tokens: number }[]
}

export function summarize(events: ActivityEvent[]): UsageSummary {
  const byDayMap = new Map<string, { chats: number; tokens: number }>()
  let totalChats = 0
  let totalToolCalls = 0
  let totalTokensIn = 0
  let totalTokensOut = 0

  for (const e of events) {
    if (e.type === "chat") totalChats++
    if (e.type === "tool_call") totalToolCalls++
    totalTokensIn += e.tokensIn ?? 0
    totalTokensOut += e.tokensOut ?? 0

    const date = e.ts.slice(0, 10)
    const day = byDayMap.get(date) ?? { chats: 0, tokens: 0 }
    if (e.type === "chat") day.chats++
    day.tokens += (e.tokensIn ?? 0) + (e.tokensOut ?? 0)
    byDayMap.set(date, day)
  }

  const byDay = [...byDayMap.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)

  return { totalChats, totalToolCalls, totalTokensIn, totalTokensOut, byDay }
}
