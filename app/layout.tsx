import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from 'next-auth/react' // Importar SessionProvider
import { auth } from './lib/auth' // ¡CORRECCIÓN AQUÍ: RUTA ACTUALIZADA!
// Eliminado: import Navbar from '@/components/navbar' // ¡CORRECCIÓN AQUÍ: ELIMINADO!

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIN Scanner PWA',
  description: 'Progressive Web App for VIN scanning and decoding',
  manifest: '/manifest.json', // Asegúrate de que tu manifest.json esté en la carpeta public
  icons: {
    apple: '/icon-192x192.png', // Asegúrate de que tus iconos estén en la carpeta public
  },
  themeColor: '#000000',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth(); // Obtener la sesión en el servidor

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Envuelve tu aplicación con SessionProvider */}
          <SessionProvider session={session}>
            {/* Eliminado: <Navbar /> */} {/* ¡CORRECCIÓN AQUÍ: ELIMINADO! */}
            {children}
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}