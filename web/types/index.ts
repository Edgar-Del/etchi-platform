export interface User {
  _id: string
  name: string
  email: string
  phone: string
  userType: 'customer' | 'delivery_partner' | 'admin'
  photo?: string
  rating: number
  walletBalance: number
  totalDeliveries: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  phone: string
  role: 'client' | 'courier'
}

export interface Delivery {
  _id: string
  clientId: string
  courierId?: string
  pickupAddress: string
  deliveryAddress: string
  packageDescription: string
  packageSize: 'small' | 'medium' | 'large'
  urgency: 'standard' | 'express' | 'urgent'
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
  price: number
  trackingCode: string
  createdAt: string
  updatedAt: string
}

export interface Address {
  _id: string
  userId: string
  label: string
  street: string
  city: string
  province: string
  postalCode: string
  coordinates: {
    latitude: number
    longitude: number
  }
  isDefault: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
}

