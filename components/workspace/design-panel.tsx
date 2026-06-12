"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  ChevronRight,
  Box,
  LayoutPanelTop,
  Folder,
  Heading1,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  Move,
  Scan,
  Crosshair,
  Undo2,
  Redo2,
  RotateCcw,
  Eye,
  Layers,
  X,
} from "lucide-react"

interface DomNode {
  id: string
  tag: string
  classes: string
  text: string
  children: DomNode[]
}

interface InspectedNode {
  id: string
  tag: string
  classes: string
  text: string
  loc: string | null
  rect: { width: number; height: number }
  styles: Record<string, string>
}

const TAG_ICONS: Record<string, typeof Box> = {
  div: Box,
  main: Folder,
  section: LayoutPanelTop,
  header: LayoutPanelTop,
  footer: LayoutPanelTop,
  h1: Heading1,
  h2: Heading1,
  h3: Heading1,
  p: Type,
  span: Type,
  img: ImageIcon,
}

function LayerItem({
  node,
  depth,
  selectedId,
  onHover,
  onSelect,
}: {
  node: DomNode
  depth: number
  selectedId: string | null
  onHover: (id: string) => void
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(depth < 3)
  const Icon = TAG_ICONS[node.tag] ?? Box
  const hasChildren = node.children.length > 0
  const active = selectedId === node.id

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={`flex h-7 items-center gap-1 rounded-md pr-2 transition-colors ${
          active
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        }`}
        onMouseEnter={() => onHover(node.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Collapse" : "Expand"}
            className="flex size-4 items-center justify-center"
          >
            <ChevronRight
              className={`size-3 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="size-4" />
        )}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex flex-1 items-center gap-1.5 text-left text-[13px]"
        >
          <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{node.tag}</span>
        </button>
      </div>
      {open && hasChildren && (
        <div className="animate-accordion-down">
          {node.children.map((child) => (
            <LayerItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onHover={onHover}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function DesignPanel({ src }: { src: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [tree, setTree] = useState<DomNode | null>(null)
  const [inspected, setInspected] = useState<InspectedNode | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [layersOpen, setLayersOpen] = useState(true)
  const [editedClasses, setEditedClasses] = useState("")
  const [originalClasses, setOriginalClasses] = useState("")
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [moveHint, setMoveHint] = useState<string | null>(null)

  const post = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage({ source: "sin-webui", ...msg }, "*")
  }, [])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data
      if (!d || d.source !== "sin-design") return
      if (d.type === "ready") post({ type: "enable" })
      if (d.type === "tree") setTree(d.tree)
      if (d.type === "inspect") {
        setInspected(d.node)
        setSelectedId(d.node.id)
        setEditedClasses(d.node.classes)
        setOriginalClasses(d.node.classes)
        setApplyError(null)
        setMoveHint(null)
      }
      if (d.type === "moved") {
        const { x, y } = d.delta
        setMoveHint(
          `Element moved by ${x}px / ${y}px — suggest e.g. ${
            x !== 0 ? `ml-[${x}px] ` : ""
          }${y !== 0 ? `mt-[${y}px]` : ""}`.trim(),
        )
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [post])

  const dirty = editedClasses !== originalClasses

  function previewClasses(value: string) {
    setEditedClasses(value)
    if (selectedId) post({ type: "preview-classes", id: selectedId, classes: value })
  }

  function resetClasses() {
    previewClasses(originalClasses)
    setApplyError(null)
  }

  async function apply() {
    if (!inspected || !dirty) return
    setApplying(true)
    setApplyError(null)
    const res = await fetch("/api/workspace/design-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loc: inspected.loc,
        oldClasses: originalClasses,
        newClasses: editedClasses,
      }),
    })
    if (res.ok) {
      setOriginalClasses(editedClasses)
    } else {
      const json = await res.json().catch(() => null)
      setApplyError(json?.error ?? "Apply failed")
    }
    setApplying(false)
  }

  return (
    <div className="relative flex h-full">
      <div className="min-w-0 flex-1 bg-background">
        <iframe
          ref={iframeRef}
          src={src}
          title="Design mode preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
          className="h-full w-full border-0"
        />
      </div>

      {layersOpen ? (
        <div className="animate-fade-up absolute left-3 top-3 z-20 flex max-h-[70%] w-[300px] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
            <span className="text-[13px] font-medium">Layers</span>
            <button
              type="button"
              onClick={() => setLayersOpen(false)}
              aria-label="Close layers"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            {tree ? (
              <LayerItem
                node={tree}
                depth={0}
                selectedId={selectedId}
                onHover={(id) => post({ type: "highlight", id })}
                onSelect={(id) => {
                  setSelectedId(id)
                  post({ type: "select", id })
                }}
              />
            ) : (
              <p className="px-2 py-4 text-xs text-muted-foreground">
                Waiting for preview…
              </p>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setLayersOpen(true)}
          aria-label="Open layers"
          className="absolute left-3 top-3 z-20 flex size-8 items-center justify-center rounded-lg border border-border bg-popover text-muted-foreground shadow-lg transition-colors hover:text-foreground"
        >
          <Layers className="size-4" strokeWidth={1.75} />
        </button>
      )}

      <div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-background">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
          <span className="font-mono text-xs font-semibold text-muted-foreground">SIN</span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Pick element" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
              <Crosshair className="size-3.5" strokeWidth={1.75} />
            </button>
            <button type="button" aria-label="Toggle overlay" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
              <Eye className="size-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {inspected ? (
            <div className="flex flex-col gap-4 p-3">
              <div>
                <p className="font-mono text-[13px] font-medium">
                  {"<"}{inspected.tag}{">"}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {inspected.rect.width}×{inspected.rect.height}
                  </span>
                </p>
                {inspected.loc && (
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {inspected.loc}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Classes</p>
                <textarea
                  value={editedClasses}
                  onChange={(e) => previewClasses(e.target.value)}
                  rows={4}
                  aria-label="Tailwind classes"
                  className="w-full resize-y rounded-lg border border-border bg-transparent p-2.5 font-mono text-xs leading-relaxed outline-none focus:border-ring"
                />
                {applyError && (
                  <p className="mt-1.5 text-xs text-destructive">{applyError}</p>
                )}
              </div>

              {moveHint && (
                <div className="rounded-lg border border-border bg-secondary/50 p-2.5">
                  <p className="text-xs leading-relaxed text-muted-foreground">{moveHint}</p>
                </div>
              )}

              <div className="flex flex-col gap-1.5 rounded-lg border border-border p-2.5">
                {Object.entries(inspected.styles).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{key}</span>
                    <span className="truncate font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
              {[
                { icon: MousePointerClick, bold: "Click", rest: "to select element" },
                { icon: Move, bold: "Drag", rest: "to move element" },
                { icon: Scan, bold: "⌘/^ + Drag", rest: "to screenshot area" },
              ].map(({ icon: Icon, bold, rest }) => (
                <div key={bold} className="flex items-center gap-2.5">
                  <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
                  <p className="text-[13px] text-muted-foreground">
                    <span className="font-medium text-foreground">{bold}</span> {rest}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-3 py-2.5">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Undo" className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <Undo2 className="size-3.5" />
            </button>
            <button type="button" aria-label="Redo" className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <Redo2 className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={resetClasses}
              disabled={!dirty}
              className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
            >
              <RotateCcw className="size-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!dirty || applying}
              className="flex h-7 items-center rounded-md bg-[#0072f5] px-3 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {applying ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
