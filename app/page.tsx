import { AppSidebar } from '@/components/app-sidebar'
import { PromptBox } from '@/components/prompt-box'
import { SinStatusTile } from '@/components/sin-status-tile'

export default function Page() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex flex-1 flex-col items-center px-8" style={{ paddingTop: '22vh' }}>
        <SinStatusTile />
        <h1 className="mb-5 text-balance text-center text-[1.5rem] font-semibold tracking-[-0.01em] text-foreground">
          What do you want to create?
        </h1>
        <PromptBox />
      </main>
    </div>
  )
}
