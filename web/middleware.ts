import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar token no localStorage não é possível no middleware
  // O middleware só pode acessar cookies ou headers
  // A verificação de autenticação será feita no cliente
  const { pathname } = request.nextUrl

  // Rotas públicas
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Por enquanto, permitir todas as rotas
  // A proteção será feita no lado do cliente via AuthProvider
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

