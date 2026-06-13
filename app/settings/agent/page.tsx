// SPDX-License-Identifier: MIT

// app/settings/agent/page.tsx
/**
 * Purpose: Backend agent configuration (sin agent show/set), backend status,
 * and model tier mapping — moved here from the legacy /settings index page.
 */
import { SettingsView } from '@/components/settings-view'

export const metadata = { title: 'Agent — Settings — SIN-Code' }

export default function AgentSettingsPage() {
  return <SettingsView />
}
