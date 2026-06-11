import type { Metadata } from 'next'
import {
  DesignSystemsList,
  NewDesignSystemButton,
} from '@/components/design-systems-list'
import { PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Design Systems - SIN-Code WebUI v2',
}

export default function DesignSystemsPage() {
  return (
    <PageShell title="Design Systems" action={<NewDesignSystemButton />}>
      <DesignSystemsList />
    </PageShell>
  )
}
