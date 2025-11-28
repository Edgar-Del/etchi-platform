'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, Wallet, Package } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Perfil</h1>
        <p className="text-muted-foreground mt-2">Suas informações pessoais</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription>
                {user.userType === 'customer' ? 'Cliente' : user.userType === 'delivery_partner' ? 'Entregador' : 'Administrador'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div className="text-base">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Telefone</div>
                <div className="text-base">{user.phone}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Saldo da Carteira</div>
                <div className="text-base font-semibold">
                  {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(user.walletBalance || 0)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total de Entregas</div>
                <div className="text-base font-semibold">{user.totalDeliveries || 0}</div>
              </div>
            </div>

            {user.rating > 0 && (
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="h-5 w-5 text-muted-foreground">⭐</div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Avaliação</div>
                  <div className="text-base font-semibold">{user.rating.toFixed(1)} ⭐</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

