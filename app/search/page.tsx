import { Search, SquarePen } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Search - SIN-Code WebUI v2',
}

export default function SearchPage() {
  return (
    <PageShell title="Search">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <div className="flex h-10 items-center gap-2.5 rounded-lg border border-input bg-card px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats, projects and templates..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="flex h-5 shrink-0 items-center rounded border border-border px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="flex flex-col gap-1">
          <p className="px-2 text-xs font-medium text-muted-foreground">Recent</p>
          <Link
            href="/chat/repo-review"
            className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent"
          >
            <SquarePen className="size-3.5 shrink-0 text-muted-foreground" />
            Repo review
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
