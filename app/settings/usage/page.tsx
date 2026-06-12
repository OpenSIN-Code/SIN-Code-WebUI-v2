"use client"

import useSWR from "swr"
import { MessageSquare, Wrench, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface UsageData {
  summary: {
    totalChats: number
    totalToolCalls: number
    totalTokensIn: number
    totalTokensOut: number
    byDay: { date: string; chats: number; tokens: number }[]
  }
  recent: {
    ts: string
    type: string
    model?: string
    tokensIn?: number
    tokensOut?: number
    label?: string
  }[]
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export default function UsagePage() {
  const { data } = useSWR<UsageData>("/api/settings/activity", fetcher)

  if (!data) {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>
  }

  const { summary, recent } = data
  const maxTokens = Math.max(1, ...summary.byDay.map((d) => d.tokens))

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-semibold">Usage &amp; Activity</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Token usage and agent activity across all chats.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <StatCard
          icon={<MessageSquare className="size-4" />}
          label="Chats"
          value={fmt(summary.totalChats)}
        />
        <StatCard
          icon={<Wrench className="size-4" />}
          label="Tool Calls"
          value={fmt(summary.totalToolCalls)}
        />
        <StatCard
          icon={<ArrowDownToLine className="size-4" />}
          label="Tokens In"
          value={fmt(summary.totalTokensIn)}
        />
        <StatCard
          icon={<ArrowUpFromLine className="size-4" />}
          label="Tokens Out"
          value={fmt(summary.totalTokensOut)}
        />
      </div>

      <h2 className="mt-8 text-sm font-medium text-muted-foreground">
        Tokens per Day (last 14 days)
      </h2>
      <div className="mt-3 rounded-xl border border-border bg-card p-5">
        {summary.byDay.length ? (
          <div className="flex h-32 items-end gap-1.5">
            {summary.byDay.map((d) => (
              <div
                key={d.date}
                className="group relative flex flex-1 flex-col items-center justify-end gap-1"
                title={`${d.date}: ${fmt(d.tokens)} tokens, ${d.chats} chats`}
              >
                <div
                  className="w-full rounded-sm bg-primary/80 transition-colors group-hover:bg-primary"
                  style={{ height: `${Math.max(4, (d.tokens / maxTokens) * 100)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {d.date.slice(8)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        )}
      </div>

      <h2 className="mt-8 text-sm font-medium text-muted-foreground">Recent Activity</h2>
      <div className="mt-3 rounded-xl border border-border bg-card">
        {recent.length ? (
          recent.map((e, i) => (
            <div
              key={`${e.ts}-${i}`}
              className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium capitalize">
                  {e.type.replace("_", " ")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {e.label ?? e.model ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                {(e.tokensIn || e.tokensOut) && (
                  <span>
                    {fmt(e.tokensIn ?? 0)} in / {fmt(e.tokensOut ?? 0)} out
                  </span>
                )}
                <span>{new Date(e.ts).toLocaleString()}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No activity yet — start a chat to see events here.
          </p>
        )}
      </div>
    </div>
  )
}
