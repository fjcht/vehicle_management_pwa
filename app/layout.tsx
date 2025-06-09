import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/app/components/theme-provider'
import { Toaster } from '@/app/components/ui/toaster'
// Eliminado: import { SessionProvider } from 'next-auth/react' // ¡ELIMINADO!
// Eliminado: import { auth } from 'next-auth' // ¡ELIMINADO!

import { AuthProvider } from '@/app/components/auth-provider'; // ¡IMPORTA TU NUEVO CLIENT COMPONENT!

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIN Scanner PWA',
  description: 'Progressive Web App for VIN scanning and decoding',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon-192x192.png',
  },
  themeColor: '#0000',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Eliminado: const session = await auth(); // ¡ELIMINADO!

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Envuelve tu aplicación con tu AuthProvider */}
          <AuthProvider> {/* ¡USA TU NUEVO AUTHPROVIDER AQUÍ! */}
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}