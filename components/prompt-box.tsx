/**
 * Purpose: v0-style landing-page prompt box with model picker, project selector,
 * suggestions, prompt enhancement, voice input, and file attachments.
 * Docs: prompt-box.doc.md
 */
// SPDX-License-Identifier: MIT

'use client'

import {
  ArrowUp,
  Check,
  Loader2,
  Mic,
  Paperclip,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useChatStore } from '@/components/chat-store'
import { Starburst } from '@/components/icons'
import { useProjectStore } from '@/components/project-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SIN_MODELS, type SinModelId } from '@/lib/sin/models'

const SUGGESTION_POOL = [
  'Map this repo architecture',
  'Find architectural debt',
  'Plan a refactor with the orchestrator',
  'What changed since last session?',
  'Add a new page route',
  'Set up a GitHub Action',
  'Create a design system token',
  'Write a unit test for lib/utils',
  'Summarize the last chat',
  'Build a Docker Compose stack',
  'Generate a README from the codebase',
  'Audit this repo for security issues',
]

const MAX_FILES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

// Minimal type shim for the Web Speech API — not in standard DOM types yet.
interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  [index: number]: SpeechRecognitionAlternativeLike
  isFinal: boolean
  length: number
}

interface SpeechRecognitionResultListLike {
  [index: number]: SpeechRecognitionResultLike
  length: number
}

interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultListLike
}

interface SpeechRecognitionInstanceLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  start(): void
  stop(): void
  abort(): void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstanceLike
    webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike
  }
}

type SpeechRecognitionCtor =
  | Window['SpeechRecognition']
  | Window['webkitSpeechRecognition']

type SpeechRecognitionInstance = InstanceType<NonNullable<SpeechRecognitionCtor>>

export function PromptBox() {
  const router = useRouter()
  const { addChat } = useChatStore()
  const { projects } = useProjectStore()

  const [value, setValue] = useState('')
  const [model, setModel] = useState<SinModelId>('sin-code-pro')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isListening, setIsListening] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(() => pickSuggestions())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const currentModel = SIN_MODELS.find((m) => m.id === model) ?? SIN_MODELS[0]
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  // Clean up speech recognition on unmount.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  function pickSuggestions() {
    const shuffled = [...SUGGESTION_POOL].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
  }

  async function enhance() {
    const trimmed = value.trim()
    if (!trimmed || isEnhancing) return
    setIsEnhancing(true)
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, model }),
      })
      if (!res.ok) throw new Error(`Enhance failed: ${res.status}`)
      const data = await res.json()
      if (typeof data.enhanced === 'string') {
        setValue(data.enhanced)
        textareaRef.current?.focus()
      }
    } catch (err) {
      console.error('Enhance error:', err)
    } finally {
      setIsEnhancing(false)
    }
  }

  function handleSubmit() {
    const prompt = value.trim()
    if (!prompt) return

    let finalPrompt = prompt
    if (files.length > 0) {
      const names = files.map((f) => f.name).join(', ')
      finalPrompt = `[Attached: ${names}]\n\n${prompt}`
    }

    const slug =
      prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join('-') || 'new-chat'
    const words = prompt.split(/\s+/)
    const label = words.slice(0, 5).join(' ') + (words.length > 5 ? '…' : '')

    addChat({ id: slug, label, workspaceId: selectedProjectId ?? undefined })

    const params = new URLSearchParams()
    params.set('q', finalPrompt)
    params.set('m', model)
    if (selectedProjectId) params.set('p', selectedProjectId)
    router.push(`/chat/${slug}?${params.toString()}`)
  }

  function fillSuggestion(text: string) {
    setValue(text)
    textareaRef.current?.focus()
  }

  function refreshSuggestions() {
    if (isRefreshing) return
    setIsRefreshing(true)
    // Small delay so the animation is visible.
    window.setTimeout(() => {
      setSuggestions(pickSuggestions())
      setIsRefreshing(false)
    }, 250)
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFiles(selected: FileList | null) {
    if (!selected) return
    const incoming = Array.from(selected).filter((f) => f.size <= MAX_FILE_SIZE)
    const remaining = Math.max(0, MAX_FILES - files.length)
    setFiles((prev) => [...prev, ...incoming.slice(0, remaining)])
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }

  function startListening() {
    if (isListening) return
    const SR = (window.SpeechRecognition ?? window.webkitSpeechRecognition) as
      | SpeechRecognitionCtor
      | undefined
    if (!SR) {
      alert('Voice input is not supported in this browser.')
      return
    }

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = (event: Event) => {
      console.error('Speech recognition error:', event)
      setIsListening(false)
    }
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const results = event.results
      if (!results?.length) return
      const last = results[results.length - 1]
      const transcript = last[0]?.transcript ?? ''
      if (last.isFinal) {
        setValue((prev) => (prev ? prev + ' ' + transcript : transcript))
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }

  return (
    <div className="flex w-full max-w-[540px] flex-col gap-2.5">
      {/* Prompt card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="What do you want to build?"
          rows={4}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {files.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2">
            {files.map((file) => (
              <span
                key={file.name}
                className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
              >
                <Paperclip className="size-3" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removeFile(file.name)}
                  className="rounded p-0.5 hover:bg-accent-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex items-center gap-1 px-2 pb-2">
          {/* Attachment */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            aria-hidden="true"
          />
          <button
            type="button"
            aria-label="Add attachment"
            onClick={openFilePicker}
            disabled={files.length >= MAX_FILES}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <Paperclip className="size-4" />
          </button>

          {/* Model picker */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-foreground hover:bg-accent"
                />
              }
            >
              <Starburst className="size-4 text-brand" />
              <span>{currentModel.label}</span>
              <svg viewBox="0 0 16 16" className="size-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6 8 10 12 6" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuGroup>
                {SIN_MODELS.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => setModel(m.id)}>
                    <Starburst className="size-4 text-brand" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[13px]">{m.label}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {m.description}
                      </span>
                    </span>
                    {model === m.id && <Check className="size-4 shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* Project selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground"
                />
              }
            >
              {selectedProject ? selectedProject.name : 'Project'}
              <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6 8 10 12 6" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSelectedProjectId(null)}>
                  No Project
                  {selectedProjectId === null && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
                {projects.length > 0 && (
                  <div className="my-1 border-t border-border" />
                )}
                {projects.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => setSelectedProjectId(p.id)}>
                    <span className="truncate">{p.name}</span>
                    {selectedProjectId === p.id && <Check className="ml-auto size-4 shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Enhance */}
          <button
            type="button"
            aria-label="Enhance prompt"
            aria-busy={isEnhancing}
            disabled={isEnhancing || !value.trim()}
            onClick={enhance}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            {isEnhancing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
          </button>

          {/* Send / Mic — round black button like v0 */}
          {value.trim() ? (
            <button
              type="button"
              aria-label="Send message"
              onClick={handleSubmit}
              className="flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
            >
              <ArrowUp className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label={isListening ? 'Stop voice input' : 'Voice input'}
              onClick={isListening ? stopListening : startListening}
              className={`flex size-8 items-center justify-center rounded-full transition-opacity hover:opacity-80 ${
                isListening ? 'bg-red-500 text-white' : 'bg-foreground text-background'
              }`}
            >
              <Mic className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => fillSuggestion(s)}
            className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-transparent px-3.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {s}
          </button>
        ))}
        {/* Refresh */}
        <button
          type="button"
          aria-label="Refresh suggestions"
          disabled={isRefreshing}
          onClick={refreshSuggestions}
          className="flex size-8 items-center justify-center rounded-full border border-border bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}
