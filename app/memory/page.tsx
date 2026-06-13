// SPDX-License-Identifier: MIT

import { AppSidebar } from '@/components/app-sidebar'
import { MemoryView } from '@/components/memory-view'

export const metadata = { title: 'Memory — SIN-Code' }

export default function MemoryPage() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <MemoryView />
      </main>
    </div>
  )
}
