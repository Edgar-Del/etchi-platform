// src/models/User.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * @typedef {Object} UserLocation
 * @property {string} type - Tipo de coordenada (sempre 'Point')
 * @property {number[]} coordinates - [longitude, latitude]
 */
export interface UserLocation {
  type: string;
  coordinates: [number, number]; // [lng, lat] para GeoJSON
}

/**
 * @typedef {Object} VehicleInfo
 * @property {string} type - Tipo de veículo
 * @property {string} plate - Matrícula do veículo
 * @property {string} color - Cor do veículo
 * @property {number} capacity - Capacidade em kg
 */
export interface VehicleInfo {
  type: 'motorcycle' | 'car' | 'bicycle' | 'walking' | 'van';
  plate?: string;
  color?: string;
  capacity: number;
}

/**
 * @typedef {Object} UserPreferences
 * @property {boolean} pushNotifications - Permitir notificações push
 * @property {boolean} emailNotifications - Permitir notificações por email
 * @property {string} language - Idioma preferido
 * @property {string} currency - Moeda preferida (AOA, USD, EUR)
 */
export interface UserPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  language: 'pt' | 'en' | 'fr';
  currency: 'AOA' | 'USD' | 'EUR';
}

/**
 * @typedef {Object} IUser
 * @property {string} name - Nome completo do usuário
 * @property {string} email - Email único
 * @property {string} phone - Telefone único no formato angolano
 * @property {string} password - Hash da senha
 * @property {UserType} userType - Tipo de usuário
 * @property {UserLocation} location - Localização atual (GeoJSON)
 * @property {string} photo - URL da foto de perfil
 * @property {number} rating - Rating médio (1-5)
 * @property {VerificationStatus} verificationStatus - Status de verificação
 * @property {boolean} isActive - Usuário ativo/inativo
 * @property {VehicleInfo} vehicleInfo - Informações do veículo (apenas entregadores)
 * @property {UserPreferences} preferences - Preferências do usuário
 * @property {number} totalDeliveries - Total de entregas realizadas
 * @property {number} totalSpent - Total gasto na plataforma
 * @property {Date} lastActive - Última atividade
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data de atualização
 */
export interface IUser extends Document {
  travelerProfile: any;
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: UserType;
  location?: UserLocation;
  photo?: string;
  rating: number;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  vehicleInfo?: VehicleInfo;
  preferences: UserPreferences;
  totalDeliveries: number;
  totalSpent: number;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): PublicUserProfile;
}

/**
 * Tipos de usuário do sistema
 * @enum {string}
 */
export enum UserType {
  CUSTOMER = 'customer',
  DELIVERY_PARTNER = 'delivery_partner',
  SMART_POINT_MANAGER = 'smart_point_manager',
  ADMIN = 'admin'
}

/**
 * Status de verificação do usuário
 * @enum {string}
 */
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review'
}

/**
 * Perfil público do usuário (sem informações sensíveis)
 */
export interface PublicUserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  location?: UserLocation;
  photo?: string;
  rating: number;
  verificationStatus: VerificationStatus;
  vehicleInfo?: VehicleInfo;
  totalDeliveries: number;
  lastActive: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  phone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    unique: true,
    trim: true,
    match: [/^\+244[9][1-9][0-9]{7}$/, 'Formato de telefone angolano inválido']
  },
  password: {
    type: String,
    required: [true, 'Password é obrigatória'],
    minlength: [6, 'Password deve ter pelo menos 6 caracteres'],
    select: false
  },
  userType: {
    type: String,
    enum: Object.values(UserType),
    required: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [13.2344, -8.8368] // Luanda coordinates
    }
  },
  photo: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating não pode ser menor que 0'],
    max: [5, 'Rating não pode ser maior que 5']
  },
  verificationStatus: {
    type: String,
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING
  },
  isActive: {
    type: Boolean,
    default: true
  },
  vehicleInfo: {
    type: {
      type: String,
      enum: ['motorcycle', 'car', 'bicycle', 'walking', 'van']
    },
    plate: String,
    color: String,
    capacity: {
      type: Number,
      min: 0
    }
  },
  preferences: {
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    language: { type: String, enum: ['pt', 'en', 'fr'], default: 'pt' },
    currency: { type: String, enum: ['AOA', 'USD', 'EUR'], default: 'AOA' }
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: { [key: string]: any }) {
      delete ret.password;
      return ret;
    }
  }
});

// Índices para otimização de consultas
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ userType: 1 });
userSchema.index({ location: '2dsphere' });
userSchema.index({ rating: -1 });
userSchema.index({ isActive: 1, verificationStatus: 1 });
userSchema.index({ lastActive: -1 });

// Método para comparar password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para obter perfil público
userSchema.methods.getPublicProfile = function(): PublicUserProfile {
  const { _id, name, email, phone, userType, location, photo, rating, verificationStatus, vehicleInfo, totalDeliveries, lastActive } = this;
  return { _id, name, email, phone, userType, location, photo, rating, verificationStatus, vehicleInfo, totalDeliveries, lastActive };
};

// Middleware para hash da password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Virtual para nome completo (caso precise dividir nome e sobrenome no futuro)
userSchema.virtual('firstName').get(function() {
  return this.name.split(' ')[0];
});

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);