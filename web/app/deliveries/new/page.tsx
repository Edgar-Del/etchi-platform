'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deliveriesService } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export default function CreateDeliveryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    packageDescription: '',
    packageSize: 'medium' as 'small' | 'medium' | 'large',
    urgency: 'standard' as 'standard' | 'express' | 'urgent',
    instructions: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await deliveriesService.create(formData)
      router.push('/deliveries')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar entrega')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <Link
          href="/deliveries"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
        <h1 className="text-3xl font-bold">Nova Entrega</h1>
        <p className="text-muted-foreground mt-2">Crie uma nova solicitação de entrega</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Entrega</CardTitle>
          <CardDescription>Preencha os dados da sua entrega</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="pickupAddress" className="text-sm font-medium">
                Endereço de Origem
              </label>
              <Input
                id="pickupAddress"
                type="text"
                placeholder="Rua, número, bairro"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="deliveryAddress" className="text-sm font-medium">
                Endereço de Destino
              </label>
              <Input
                id="deliveryAddress"
                type="text"
                placeholder="Rua, número, bairro"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="packageDescription" className="text-sm font-medium">
                Descrição do Pacote
              </label>
              <textarea
                id="packageDescription"
                rows={3}
                value={formData.packageDescription}
                onChange={(e) => setFormData({ ...formData, packageDescription: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Descreva o que será entregue"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="packageSize" className="text-sm font-medium">
                  Tamanho
                </label>
                <select
                  id="packageSize"
                  value={formData.packageSize}
                  onChange={(e) => setFormData({ ...formData, packageSize: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="small">Pequeno</option>
                  <option value="medium">Médio</option>
                  <option value="large">Grande</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="urgency" className="text-sm font-medium">
                  Urgência
                </label>
                <select
                  id="urgency"
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="standard">Padrão</option>
                  <option value="express">Express</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="instructions" className="text-sm font-medium">
                Instruções Especiais (Opcional)
              </label>
              <textarea
                id="instructions"
                rows={2}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Instruções adicionais para o entregador"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/deliveries">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Entrega'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

