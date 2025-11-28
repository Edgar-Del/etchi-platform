'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/lib/api'
import type { User, LoginCredentials, RegisterData } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      authService.getProfile()
        .then((response) => {
          setUser(response.data)
        })
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials)
    const accessToken = response.data.data?.access_token || response.data.access_token
    setToken(accessToken)
    setUser(response.data.data?.user || response.data.user)
    if (accessToken) {
      localStorage.setItem('token', accessToken)
    }
  }

  const register = async (data: RegisterData) => {
    const response = await authService.register(data)
    const accessToken = response.data.data?.data?.access_token || response.data.data?.access_token
    setToken(accessToken)
    setUser(response.data.data?.data?.user || response.data.data?.user)
    if (accessToken) {
      localStorage.setItem('token', accessToken)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

