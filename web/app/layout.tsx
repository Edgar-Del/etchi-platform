import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Etchi - Entregas Colaborativas',
  description: 'Plataforma de entregas colaborativas em Angola',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/assets/icons/etchi_icon.png',
    apple: '/assets/icons/etchi_icon.png',
  },
  openGraph: {
    title: 'Etchi - Entregas Colaborativas',
    description: 'Plataforma de entregas colaborativas em Angola',
    images: ['/assets/logos/etchi_logo_noBG.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

