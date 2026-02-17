import type { Metadata } from 'next'
import './globals.css'
import FooterNav from '@/components/FooterNav'

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
      <body className="flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <FooterNav />
      </body>
    </html>
  )
}
