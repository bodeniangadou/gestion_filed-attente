import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProvider } from "@/lib/app-context"
import { Toaster } from "@/components/ui/sonner"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Rang+ | Hôpital du Mali',
  description: 'Application de gestion de file d\'attente hospitalière',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',  
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="bg-background">
      <body className="font-sans antialiased">
        <AppProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}