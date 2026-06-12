import { readPreferences, listFiles, readFileContent } from "@/lib/settings/store"

export async function buildAgentContext(userId: string = "global"): Promise<string> {
  const parts: string[] = []

  const prefs = await readPreferences(userId)
  if (prefs.customInstructions.trim()) {
    parts.push(`# User Custom Instructions\n\n${prefs.customInstructions.trim()}`)
  }

  for (const scope of ["user", "team"] as const) {
    const files = await listFiles(userId, "memories", scope)
    for (const name of files) {
      const content = await readFileContent(userId, "memories", scope, name)
      if (content?.trim()) {
        parts.push(`# Memory (${scope}/${name})\n\n${content.trim()}`)
      }
    }
  }

  return parts.length ? `\n\n${parts.join("\n\n---\n\n")}` : ""
}
