// SPDX-License-Identifier: MIT

import { AppSidebar } from '@/components/app-sidebar'
import { WorkspacesView } from '@/components/workspaces-view'

export const metadata = {
  title: 'Workspaces — SIN-Code',
}

export default function WorkspacesPage() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <WorkspacesView />
      </main>
    </div>
  )
}
