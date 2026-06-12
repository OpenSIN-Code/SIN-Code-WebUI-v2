"use client"

import { useState, useEffect } from "react"
import { codeToHtml } from "shiki"

const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  css: "css",
  md: "markdown",
  mjs: "javascript",
  yml: "yaml",
  yaml: "yaml",
  html: "html",
  sh: "bash",
}

export function HighlightedCode({ code, path }: { code: string; path: string }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const ext = path.split(".").pop() ?? ""
    const lang = EXT_TO_LANG[ext] ?? "text"

    codeToHtml(code, {
      lang,
      themes: { light: "github-light", dark: "github-dark-default" },
      defaultColor: false,
    })
      .then((result: string) => {
        if (!cancelled) setHtml(result)
      })
      .catch(() => {
        if (!cancelled) setHtml(null)
      })

    return () => {
      cancelled = true
    }
  }, [code, path])

  if (!html) {
    return (
      <pre className="flex-1 overflow-auto p-4">
        <code className="font-mono text-[13px] leading-relaxed">{code}</code>
      </pre>
    )
  }

  return (
    <div
      className="flex-1 overflow-auto p-4 text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_code]:font-mono"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
