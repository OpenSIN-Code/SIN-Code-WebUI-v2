// SPDX-License-Identifier: MIT

'use client'

/**
 * Purpose: Agents overview — chat agent modes + orchestrator agents from
 * the sin-code backend, with a doctor action.
 */
import { Bot, RefreshCw, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { SIN_AGENTS } from '@/lib/sin/agents'
import { useSinAgents } from '@/lib/sin/use-sin'
import { cn } from '@/lib/utils'

export function AgentsView() {
  const { data, isLoading, mutate } = useSinAgents()
  const [doctor, setDoctor] = useState<string | null>(null)
  const [doctorBusy, setDoctorBusy] = useState(false)

  const backendAgents: unknown[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.agents)
      ? data.data.agents
      : []
  const notInstalled = data && data.ok === false

  async function runDoctor() {
    setDoctorBusy(true)
    try {
      const res = await fetch('/api/sin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'doctor' }),
      })
      const json = await res.json()
      setDoctor(JSON.stringify(json.data ?? json, null, 2))
    } finally {
      setDoctorBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Agents
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Chat agent modes and orchestrator agents from the sin-code backend.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mutate()}
            className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={runDoctor}
            disabled={doctorBusy}
            className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <Stethoscope className="size-3.5" />
            Doctor
          </button>
        </div>
      </div>

      <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Chat Agent Modes
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {SIN_AGENTS.filter((a) => a.id !== 'auto').map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md border border-border">
                <Bot className="size-4 text-muted-foreground" />
              </span>
              <span className="text-[14px] font-medium text-foreground">
                {a.label}
              </span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              {a.description}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Orchestrator Agents (backend)
      </h2>
      <div className="mt-3 rounded-xl border border-border bg-card">
        {notInstalled ? (
          <p className="p-4 text-[13px] text-muted-foreground">
            sin-code backend not installed — orchestrator agents unavailable.
          </p>
        ) : backendAgents.length === 0 ? (
          <p className="p-4 text-[13px] text-muted-foreground">
            {isLoading ? 'Loading…' : 'No orchestrator agents reported.'}
          </p>
        ) : (
          <pre className="max-h-96 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
            {JSON.stringify(backendAgents, null, 2)}
          </pre>
        )}
      </div>

      {doctor && (
        <>
          <h2 className="mt-10 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Doctor Report
          </h2>
          <pre className="mt-3 max-h-96 overflow-auto rounded-xl border border-border bg-card p-4 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
            {doctor}
          </pre>
        </>
      )}
    </div>
  )
}
