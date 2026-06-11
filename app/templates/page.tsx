/**
 * Purpose: /templates — clickable tiles that start a new chat seeded with
 * the template name as the initial prompt.
 * Related issues: #21
 */
'use client'

import { ArrowUpRight, LayoutTemplate } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/components/chat-store'
import { PageShell } from '@/components/page-shell'

const templates = [
  {
    name: 'Next.js Starter',
    description: 'A minimal Next.js app with Tailwind CSS and TypeScript.',
  },
  {
    name: 'SaaS Landing Page',
    description: 'Marketing page with hero, pricing and waitlist form.',
  },
  {
    name: 'Dashboard',
    description: 'Admin dashboard with sidebar, charts and data tables.',
  },
  {
    name: 'AI Chatbot',
    description: 'Streaming chat interface powered by the AI SDK.',
  },
  {
    name: 'E-Commerce Storefront',
    description: 'Product grid, cart and checkout flow.',
  },
  {
    name: 'Blog',
    description: 'MDX-powered blog with dark mode and RSS.',
  },
]

export default function TemplatesPage() {
  const router = useRouter()
  const { addChat } = useChatStore()

  const useTemplate = (name: string) => {
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    addChat({ id, label: name })
    router.push(
      `/chat/${id}?q=${encodeURIComponent(`Start from the ${name} template`)}`,
    )
  }

  return (
    <PageShell title="Templates">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <button
            key={template.name}
            type="button"
            onClick={() => useTemplate(template.name)}
            className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 text-left hover:border-border"
          >
            <span className="flex aspect-video items-center justify-center rounded-lg bg-secondary">
              <LayoutTemplate className="size-6 text-muted-foreground" />
            </span>
            <span className="flex items-start gap-1">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {template.name}
                </span>
                <span className="text-pretty text-xs leading-relaxed text-muted-foreground">
                  {template.description}
                </span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        ))}
      </div>
    </PageShell>
  )
}
