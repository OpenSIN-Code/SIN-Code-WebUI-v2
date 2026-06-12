import { FileWorkspace } from "@/components/settings/file-workspace"

export default function SkillsPage() {
  return (
    <FileWorkspace
      kind="skills"
      title="Skills"
      defaultFileName="SKILL.md"
      emptyLabel="No custom skills yet"
      createLabel="Create a skill"
    />
  )
}
