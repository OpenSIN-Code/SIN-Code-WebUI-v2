/**
 * Purpose: /search route — wraps the SearchPanel (client component).
 */
import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { SearchPanel } from '@/components/search-panel'

export const metadata: Metadata = {
  title: 'Search - SIN-Code WebUI v2',
}

export default function SearchPage() {
  return (
    <PageShell title="Search">
      <SearchPanel />
    </PageShell>
  )
}
