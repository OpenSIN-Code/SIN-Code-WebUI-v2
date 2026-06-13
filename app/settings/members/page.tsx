/**
 * Purpose: Workspace members management — uses the fully built MembersPanel
 * (was orphaned; previously showed only a placeholder).
 */
// SPDX-License-Identifier: MIT

import { MembersPanel } from '@/components/settings/members-panel'

export const metadata = { title: 'Members — Settings' }

export default function MembersPage() {
  return <MembersPanel />
}
