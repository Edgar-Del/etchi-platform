'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { deliveriesService } from '@/lib/api'
import type { Delivery } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Plus, MapPin, Clock } from 'lucide-react'

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeliveries()
  }, [])

  const loadDeliveries = async () => {
    try {
      const response = await deliveriesService.getMine()
      setDeliveries(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar entregas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'in_transit':
        return 'bg-blue-100 text-blue-800'
      case 'picked_up':
        return 'bg-purple-100 text-purple-800'
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      assigned: 'Atribuída',
      picked_up: 'Recolhida',
      in_transit: 'Em Trânsito',
      delivered: 'Entregue',
      cancelled: 'Cancelada',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Entregas</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas entregas</p>
        </div>
        <Link href="/deliveries/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Entrega
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {deliveries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">Nenhuma entrega</h3>
              <p className="mt-1 text-sm text-muted-foreground">Comece criando uma nova entrega.</p>
              <div className="mt-6">
                <Link href="/deliveries/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Entrega
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{delivery.packageDescription}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {delivery.deliveryAddress}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                      {getStatusLabel(delivery.status)}
                    </span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(delivery.price)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Código: {delivery.trackingCode}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

