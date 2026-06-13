/**
 * Purpose: v0-style prompt input with model picker and send/stop controls.
 * Docs: prompt-composer.doc.md
 */
// SPDX-License-Identifier: MIT

"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, ArrowUp, Square, ChevronDown, Check } from "lucide-react"

const MODELS = [
  { id: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6" },
  { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { id: "google/gemini-3-flash", label: "Gemini 3 Flash" },
]

interface PromptComposerProps {
  onSend: (text: string, model: string) => void
  onStop?: () => void
  isStreaming?: boolean
  placeholder?: string
  initialModel?: string
}

export function PromptComposer({
  onSend,
  onStop,
  isStreaming,
  placeholder = "Describe what you want to build…",
  initialModel,
}: PromptComposerProps) {
  const [text, setText] = useState("")
  const [model, setModel] = useState(initialModel ?? MODELS[0].id)
  const [pickerOpen, setPickerOpen] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`
  }, [text])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  function send() {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed, model)
    setText("")
  }

  const activeModel = MODELS.find((m) => m.id === model) ?? MODELS[0]

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:border-ring">
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            send()
          }
        }}
        placeholder={placeholder}
        rows={2}
        aria-label="Message"
        className="w-full resize-none bg-transparent px-4 pt-3.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between px-2.5 pb-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Add attachment"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>

          <div ref={pickerRef} className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              aria-expanded={pickerOpen}
              aria-haspopup="listbox"
              className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {activeModel.label}
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${
                  pickerOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {pickerOpen && (
              <div
                role="listbox"
                className="animate-fade-up absolute bottom-full left-0 z-50 mb-2 w-56 rounded-xl border border-border bg-popover p-1 shadow-lg"
              >
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={m.id === model}
                    onClick={() => {
                      setModel(m.id)
                      setPickerOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {m.label}
                    {m.id === model && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={!text.trim()}
            aria-label="Send message"
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30"
          >
            <ArrowUp className="size-4" strokeWidth={2.25} />
          </button>
        )}
      </div>
    </div>
  )
}
