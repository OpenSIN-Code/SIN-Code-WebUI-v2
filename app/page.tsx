/**
 * Purpose: Homepage — v0-style hero with PromptBox (restored from 3f94740)
 * plus the SIN-Code backend status tile.
 */
import { AppSidebar } from '@/components/app-sidebar'
import { PromptBox } from '@/components/prompt-box'
import { SinStatusTile } from '@/components/sin-status-tile'

export default function Page() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex flex-1 flex-col items-center px-4 pt-[14vh] md:px-8">
        <SinStatusTile />
        <h1 className="mb-5 text-balance text-center text-[1.5rem] font-semibold tracking-[-0.01em] text-foreground">
          What do you want to create?
        </h1>
        <PromptBox />
      </main>
    </div>
  )
}
