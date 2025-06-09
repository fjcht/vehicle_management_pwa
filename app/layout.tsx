import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/app/components/theme-provider'
import { Toaster } from '@/app/components/ui/toaster'
import { SessionProvider } from 'next-auth/react' // Importar SessionProvider
// Eliminado: import { auth } from 'next-auth' // ¡ELIMINADO!

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIN Scanner PWA',
  description: 'Progressive Web App for VIN scanning and decoding',
  manifest: '/manifest.json', // Asegúrate de que tu manifest.json esté en la carpeta public
  icons: {
    apple: '/icon-192x192.png', // Asegúrate de que tus iconos estén en la carpeta public
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
          {/* Envuelve tu aplicación con SessionProvider */}
          {/* SessionProvider no necesita la prop 'session' aquí si no la obtienes en el layout */}
          <SessionProvider> 
            {children}
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}