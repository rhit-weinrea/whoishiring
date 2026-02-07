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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('hn_theme');if(t==='dark')document.documentElement.classList.add('dark');})();`
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
