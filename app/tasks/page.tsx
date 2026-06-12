import { AppSidebar } from '@/components/app-sidebar'
import { TasksView } from '@/components/tasks-view'

export const metadata = { title: 'Tasks — SIN-Code' }

export default function TasksPage() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <TasksView />
      </main>
    </div>
  )
}
