import { AppSidebar } from '@/components/app-sidebar'
import { SettingsView } from '@/components/settings-view'

export const metadata = { title: 'Settings — SIN-Code' }

export default function SettingsPage() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <SettingsView />
      </main>
    </div>
  )
}
