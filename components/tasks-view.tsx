'use client'

/**
 * Purpose: Task board — sin_todo_* list/ready/blocked tabs, add/complete
 * actions, and an orchestrator launcher with live SSE output for runs.
 */
import { Check, CirclePlus, ListTodo, Play, Square, Workflow } from 'lucide-react'
import { useRef, useState } from 'react'
import { DashedSpinner } from '@/components/icons'
import { useSinTodos } from '@/lib/sin/use-sin'
import { cn } from '@/lib/utils'

type TodoItem = {
  id?: string | number
  title?: string
  status?: string
  [key: string]: unknown
}

const TABS = [
  { id: 'list', label: 'All' },
  { id: 'ready', label: 'Ready' },
  { id: 'blocked', label: 'Blocked' },
] as const

export function TasksView() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('list')
  const { data, mutate, isLoading } = useSinTodos(tab)
  const [newTitle, setNewTitle] = useState('')
  const [orchTask, setOrchTask] = useState('')
  const [orchLines, setOrchLines] = useState<string[]>([])
  const [orchBusy, setOrchBusy] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const logRef = useRef<HTMLPreElement>(null)

  const todos: TodoItem[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.todos)
      ? data.data.todos
      : []
  const notInstalled = data && data.ok === false

  async function addTodo() {
    const title = newTitle.trim()
    if (!title) return
    setNewTitle('')
    await fetch('/api/sin/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', title }),
    })
    mutate()
  }

  async function completeTodo(id: string) {
    await fetch('/api/sin/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', id }),
    })
    mutate()
  }

  async function planTask() {
    const task = orchTask.trim()
    if (!task) return
    setOrchBusy(true)
    setOrchLines([])
    try {
      const res = await fetch('/api/sin/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'plan', task }),
      })
      const json = await res.json()
      setOrchLines(JSON.stringify(json.data ?? json, null, 2).split('\n'))
      mutate()
    } finally {
      setOrchBusy(false)
    }
  }

  function appendLine(line: string) {
    setOrchLines((prev) => [...prev, line])
    requestAnimationFrame(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
    })
  }

  function runTask() {
    const task = orchTask.trim()
    if (!task || orchBusy) return
    setOrchBusy(true)
    setOrchLines([])

    const es = new EventSource(
      `/api/sin/orchestrator/stream?task=${encodeURIComponent(task)}`,
    )
    esRef.current = es

    es.addEventListener('line', (e) => {
      try {
        appendLine(JSON.parse((e as MessageEvent).data).line)
      } catch {
        /* ignore malformed event */
      }
    })
    es.addEventListener('error', (e) => {
      try {
        appendLine(`[error] ${JSON.parse((e as MessageEvent).data).error}`)
      } catch {
        appendLine('[error] stream interrupted')
      }
      es.close()
      esRef.current = null
      setOrchBusy(false)
    })
    es.addEventListener('done', (e) => {
      try {
        appendLine(`[done] exit code ${JSON.parse((e as MessageEvent).data).exitCode}`)
      } catch {
        appendLine('[done]')
      }
      es.close()
      esRef.current = null
      setOrchBusy(false)
      mutate()
    })
  }

  function stopRun() {
    esRef.current?.close()
    esRef.current = null
    setOrchBusy(false)
    appendLine('[stopped by user]')
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tasks</h1>
      <p className="mt-1 text-[13.5px] text-muted-foreground">
        Backend todo ledger and multi-agent orchestrator.
      </p>

      {/* Orchestrator launcher */}
      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <Workflow className="size-4 text-muted-foreground" />
          Orchestrate a task
          {orchBusy && (
            <DashedSpinner className="size-3.5 animate-[spin_2s_linear_infinite] text-muted-foreground" />
          )}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={orchTask}
            onChange={(e) => setOrchTask(e.target.value)}
            placeholder="Describe a multi-step task for the orchestrator…"
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={planTask}
              disabled={orchBusy || !orchTask.trim()}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <ListTodo className="size-3.5" />
              Plan
            </button>
            {orchBusy ? (
              <button
                type="button"
                onClick={stopRun}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-destructive/40 px-3 text-[12.5px] text-destructive hover:bg-destructive/10"
              >
                <Square className="size-3.5" />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={runTask}
                disabled={!orchTask.trim()}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Play className="size-3.5" />
                Run
              </button>
            )}
          </div>
        </div>
        {orchLines.length > 0 && (
          <pre
            ref={logRef}
            className="mt-3 max-h-64 overflow-auto rounded-lg bg-muted p-3 font-mono text-[11.5px] leading-relaxed text-muted-foreground"
          >
            {orchLines.join('\n')}
          </pre>
        )}
      </div>

      {/* Todo board */}
      <div className="mt-8 flex w-fit items-center gap-1 rounded-full border border-border p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'h-7 rounded-full px-3 text-[12.5px] text-muted-foreground transition-colors',
              tab === t.id && 'bg-accent text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTodo()
          }}
          placeholder="Add a todo…"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={addTodo}
          disabled={!newTitle.trim()}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          <CirclePlus className="size-3.5" />
          Add
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card">
        {notInstalled ? (
          <p className="p-4 text-[13px] text-muted-foreground">
            sin-code backend not installed — todos unavailable.
          </p>
        ) : todos.length === 0 ? (
          <p className="p-4 text-[13px] text-muted-foreground">
            {isLoading ? 'Loading…' : 'No todos in this view.'}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {todos.map((todo, i) => (
              <li
                key={String(todo.id ?? i)}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  #{String(todo.id ?? i)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">
                  {String(todo.title ?? JSON.stringify(todo))}
                </span>
                {todo.status ? (
                  <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {String(todo.status)}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => completeTodo(String(todo.id ?? i))}
                  aria-label="Complete todo"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Check className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
