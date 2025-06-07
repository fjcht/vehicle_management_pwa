
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Wrench, Car, Users, Calendar, BarChart3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const features = [
  {
    icon: Car,
    title: 'Vehicle Management',
    description: 'Complete vehicle tracking with VIN scanning and NHTSA integration'
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Manage customer information and vehicle ownership records'
  },
  {
    icon: Wrench,
    title: 'Repair Tracking',
    description: '6-stage repair workflow from reception to delivery'
  },
  {
    icon: Calendar,
    title: 'Appointment System',
    description: 'Schedule and manage customer appointments efficiently'
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into your workshop performance'
  }
]

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <Wrench className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
                Workshop
                <span className="text-blue-600"> Management</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Complete workshop management system with multi-company support, 
                real-time tracking, and powerful analytics. Streamline your automotive 
                repair business with our comprehensive PWA solution.
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Your Workshop
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900">
              Everything You Need to Manage Your Workshop
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From vehicle intake to delivery, our comprehensive system handles 
              every aspect of your automotive repair business.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                    <CardHeader className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icon className="w-8 h-8 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center text-gray-600">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold text-white">
              Ready to Transform Your Workshop?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join hundreds of workshops already using our platform to streamline 
              their operations and improve customer satisfaction.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-center">
        <div className="container mx-auto">
          <p className="text-gray-400">
            © 2025 Workshop Management PWA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
