/**
 * Purpose: Homepage with sidebar, SIN-Code backend status tile, and chat UI.
 * Related issues: #4, #5
 */

import { AppSidebar } from '@/components/app-sidebar'
import { SinChat } from '@/components/sin-chat'
import { SinStatusTile } from '@/components/sin-status-tile'

export default function Page() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex flex-1 flex-col items-center px-4 pt-[12vh] md:px-8">
        <SinStatusTile />
        <h1 className="mb-5 text-balance text-center text-[1.5rem] font-semibold tracking-[-0.01em] text-foreground">
          What do you want to create?
        </h1>
        <SinChat />
      </main>
    </div>
  )
}
