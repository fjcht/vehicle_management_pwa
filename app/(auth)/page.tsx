// app/page.tsx (Nueva página de inicio)
'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Car, Shield, Users, Wrench } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'

export default function PaginaInicio() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (session) {
    return null // Se redirigirá al dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">VehículoPro</span>
          </div>
          <Button onClick={() => signIn()} className="bg-blue-600 hover:bg-blue-700">
            Iniciar Sesión
          </Button>
        </nav>
      </header>

      {/* Sección Principal */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              Gestión de Vehículos
              <span className="block text-blue-600">Hecha Simple</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Optimiza tu negocio automotriz con nuestro sistema integral de gestión de vehículos. 
              Rastrea reparaciones, gestiona clientes y haz crecer tu negocio.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              onClick={() => signIn()} 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              Comenzar
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3"
            >
              Saber Más
            </Button>
          </motion.div>
        </div>

        {/* Características */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle>Seguimiento de Vehículos</CardTitle>
              <CardDescription>
                Mantén registro de todos los vehículos en tu sistema con información detallada e historial
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle>Gestión de Reparaciones</CardTitle>
              <CardDescription>
                Administra órdenes de reparación desde la recepción hasta la entrega con seguimiento de estado
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle>Gestión de Clientes</CardTitle>
              <CardDescription>
                Mantén registros detallados de clientes e historial de comunicación
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}