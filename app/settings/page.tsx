// SPDX-License-Identifier: MIT

// app/settings/page.tsx
/**
 * Purpose: Settings index — redirects to the default settings section.
 * The legacy AppSidebar + SettingsView combo was replaced by the v0-style
 * settings layout (app/settings/layout.tsx) in commit 010735a. The old
 * backend/agent config now lives at /settings/agent.
 */
import { redirect } from 'next/navigation'

export default function SettingsPage() {
  redirect('/settings/preferences')
}
