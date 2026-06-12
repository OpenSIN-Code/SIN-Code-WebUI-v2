import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import { ChatStoreProvider } from '@/components/chat-store'
import { DesignSystemStoreProvider } from '@/components/design-system-store'
import { ProjectStoreProvider } from '@/components/project-store'
import { SidebarStoreProvider } from '@/components/sidebar-store'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
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
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ChatStoreProvider>
            <ProjectStoreProvider>
              <DesignSystemStoreProvider>
                <SidebarStoreProvider>
                {children}
              </SidebarStoreProvider>
              </DesignSystemStoreProvider>
            </ProjectStoreProvider>
          </ChatStoreProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
