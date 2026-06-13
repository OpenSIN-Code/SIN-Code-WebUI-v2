// SPDX-License-Identifier: MIT

import { AppSidebar } from '@/components/app-sidebar'
import { FileViewer } from '@/components/file-viewer'

export const metadata = { title: 'Files — SIN-Code' }

export default function FilesPage() {
  return (
    <div className="flex h-svh bg-background">
      <AppSidebar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <FileViewer />
      </main>
    </div>
  )
}
