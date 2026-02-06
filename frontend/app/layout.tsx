import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HN Career Hub',
  description: 'Discover opportunities from Hacker News',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
