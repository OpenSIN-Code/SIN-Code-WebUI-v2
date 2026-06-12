import { AppSidebar } from '@/components/app-sidebar'
import { AgentsView } from '@/components/agents-view'

export const metadata = { title: 'Agents — SIN-Code' }

export default function AgentsPage() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <AgentsView />
      </main>
    </div>
  )
}
