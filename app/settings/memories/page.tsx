// SPDX-License-Identifier: MIT

import { FileWorkspace } from "@/components/settings/file-workspace"

export default function MemoriesPage() {
  return (
    <FileWorkspace
      kind="memories"
      title="Files"
      defaultFileName="MEMORY.md"
      emptyLabel="No memory files yet"
      createLabel="Create MEMORY.md"
    />
  )
}
