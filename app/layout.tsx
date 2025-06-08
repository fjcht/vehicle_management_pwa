import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/app/lib/auth' // ¡RUTA CORREGIDA!
// Eliminado: import Navbar from '@/components/navbar' // Ya no se importa si no existe

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIN Scanner PWA',
  description: 'Progressive Web App for VIN scanning and decoding',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon-192x192.png',
  },
  themeColor: '#000000',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider session={session}>
            {/* Eliminado: <Navbar /> */}
            {children}
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}