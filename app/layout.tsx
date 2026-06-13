// SPDX-License-Identifier: MIT

import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import { DesignSystemStoreProvider } from '@/components/design-system-store'
import { ProjectStoreProvider } from '@/components/project-store'
import { SidebarStoreProvider } from '@/components/sidebar-store'
import { ThemeProvider } from "@/components/settings/theme-provider"
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SIN-Code WebUI v2',
  description: 'SIN-Code WebUI v2 - Build full-stack apps with AI',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background font-sans text-foreground antialiased">
<ThemeProvider>
  <ProjectStoreProvider>
    <DesignSystemStoreProvider>
      <SidebarStoreProvider>
        {children}
      </SidebarStoreProvider>
    </DesignSystemStoreProvider>
  </ProjectStoreProvider>
</ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
