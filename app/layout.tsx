import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AppShell } from '@/components/app-shell'
import { BRAND } from '@/lib/api'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: { default: `${BRAND} — Find your next feeling`, template: `%s · ${BRAND}` },
  description: 'A cloud-based music streaming experience with Smart Shuffle+ discovery queues.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#141824',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`sonora dark ${inter.variable}`}>
      <body className="font-sans antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>
        <AppShell>{children}</AppShell>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
