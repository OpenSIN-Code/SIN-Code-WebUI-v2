// SPDX-License-Identifier: MIT

"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CodeBlock } from "@/components/chat/code-block"

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="text-sm leading-relaxed">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="mt-2 text-lg font-semibold text-balance">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-2 text-base font-semibold text-balance">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-1 text-sm font-semibold">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm leading-relaxed">
              {children}
            </ol>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-2 transition-colors hover:text-muted-foreground"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-secondary/50 px-3 py-2 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 last:border-b-0">
              {children}
            </td>
          ),
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className ?? "")
            const code = String(children).replace(/\n$/, "")
            if (match || code.includes("\n")) {
              return <CodeBlock language={match?.[1]} code={code} />
            }
            return (
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[13px]">
                {code}
              </code>
            )
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
