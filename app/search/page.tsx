// SPDX-License-Identifier: MIT

import { AppSidebar } from '@/components/app-sidebar'
import { SearchView } from '@/components/search-view'

export const metadata = { title: 'Search — SIN-Code' }

export default function SearchPage() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <SearchView />
      </main>
    </div>
  )
}
