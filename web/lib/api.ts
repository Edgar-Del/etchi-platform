import axios from 'axios'
import type { LoginCredentials, RegisterData, User, Delivery, Address, ApiResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Interceptor para tratar erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ access_token: string; user: User }>> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },
  register: async (data: RegisterData): Promise<ApiResponse<{ access_token: string; user: User }>> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  },
}

export const deliveriesService = {
  getAll: async (): Promise<ApiResponse<Delivery[]>> => {
    const response = await apiClient.get('/deliveries')
    return response.data
  },
  getMine: async (): Promise<ApiResponse<Delivery[]>> => {
    const response = await apiClient.get('/deliveries/mine')
    return response.data
  },
  getById: async (id: string): Promise<ApiResponse<Delivery>> => {
    const response = await apiClient.get(`/deliveries/${id}`)
    return response.data
  },
  create: async (data: Partial<Delivery>): Promise<ApiResponse<Delivery>> => {
    const response = await apiClient.post('/deliveries', data)
    return response.data
  },
  track: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.get(`/deliveries/${id}/track`)
    return response.data
  },
}

export const addressesService = {
  getAll: async (): Promise<ApiResponse<Address[]>> => {
    const response = await apiClient.get('/addresses')
    return response.data
  },
  create: async (data: Partial<Address>): Promise<ApiResponse<Address>> => {
    const response = await apiClient.post('/addresses', data)
    return response.data
  },
}

export const usersService = {
  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },
  getWalletBalance: async (id: string): Promise<ApiResponse<{ balance: number }>> => {
    const response = await apiClient.get(`/users/${id}/wallet/balance`)
    return response.data
  },
}

