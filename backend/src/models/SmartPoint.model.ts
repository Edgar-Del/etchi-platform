// src/models/SmartPoint.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserLocation } from './User.model';

/**
 * @typedef {Object} OperatingHours
 * @property {string} monday - Horário de segunda
 * @property {string} tuesday - Horário de terça
 * @property {string} wednesday - Horário de quarta
 * @property {string} thursday - Horário de quinta
 * @property {string} friday - Horário de sexta
 * @property {string} saturday - Horário de sábado
 * @property {string} sunday - Horário de domingo
 */
export interface OperatingHours {
  monday: string;    // "09:00-18:00"
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

/**
 * @typedef {Object} CapacityInfo
 * @property {number} total - Capacidade total em pacotes
 * @property {number} available - Capacidade disponível
 * @property {number} reserved - Capacidade reservada
 */
export interface CapacityInfo {
  total: number;
  available: number;
  reserved: number;
}

/**
 * @typedef {Object} ISmartPoint
 * @property {string} name - Nome do ponto inteligente
 * @property {string} code - Código único do ponto
 * @property {UserLocation} location - Localização geográfica
 * @property {mongoose.Types.ObjectId} managerId - ID do gestor responsável
 * @property {string} contactPhone - Telefone de contacto
 * @property {string} email - Email de contacto
 * @property {OperatingHours} operatingHours - Horário de funcionamento
 * @property {CapacityInfo} capacity - Informações de capacidade
 * @property {SmartPointStatus} status - Status do ponto
 * @property {string[]} services - Serviços oferecidos
 * @property {object} facilities - Instalações disponíveis
 * @property {number} averageRating - Rating médio (1-5)
 * @property {number} totalPackages - Total de pacotes processados
 * @property {Date} lastMaintenance - Última manutenção
 * @property {Date} nextMaintenance - Próxima manutenção
 * @property {string} maintenanceNotes - Notas de manutenção
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data de atualização
 */
export interface ISmartPoint extends Document {
  name: string;
  code: string;
  location: UserLocation;
  managerId: mongoose.Types.ObjectId;
  contactPhone: string;
  email?: string;
  operatingHours: OperatingHours;
  capacity: CapacityInfo;
  status: SmartPointStatus;
  services: string[];
  facilities: object;
  averageRating: number;
  totalPackages: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  maintenanceNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status do ponto inteligente
 * @enum {string}
 */
export enum SmartPointStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
  COMING_SOON = 'coming_soon'
}

const smartPointSchema = new Schema<ISmartPoint>({
  name: {
    type: String,
    required: [true, 'Nome do ponto é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode exceder 100 caracteres']
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^SP[0-9]{4}$/, 'Formato de código inválido (ex: SP0001)']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  managerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contactPhone: {
    type: String,
    required: true,
    match: [/^\+244[9][1-9][0-9]{7}$/, 'Formato de telefone angolano inválido']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  operatingHours: {
    monday: { type: String, default: '09:00-18:00' },
    tuesday: { type: String, default: '09:00-18:00' },
    wednesday: { type: String, default: '09:00-18:00' },
    thursday: { type: String, default: '09:00-18:00' },
    friday: { type: String, default: '09:00-18:00' },
    saturday: { type: String, default: '10:00-16:00' },
    sunday: { type: String, default: 'Fechado' }
  },
  capacity: {
    total: {
      type: Number,
      required: true,
      min: [1, 'Capacidade total deve ser pelo menos 1']
    },
    available: {
      type: Number,
      required: true,
      min: 0
    },
    reserved: {
      type: Number,
      required: true,
      min: 0
    }
  },
  status: {
    type: String,
    enum: Object.values(SmartPointStatus),
    default: SmartPointStatus.ACTIVE,
    index: true
  },
  services: [{
    type: String,
    enum: [
      'package_dropoff',
      'package_pickup', 
      'cold_storage',
      'fragile_handling',
      'value_services',
      'notifications'
    ]
  }],
  facilities: {
    hasSecurity: { type: Boolean, default: false },
    hasCameras: { type: Boolean, default: false },
    hasRefrigeration: { type: Boolean, default: false },
    parkingSpaces: { type: Number, default: 0 },
    accessibility: { type: Boolean, default: false }
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalPackages: {
    type: Number,
    default: 0
  },
  lastMaintenance: Date,
  nextMaintenance: Date,
  maintenanceNotes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Índices geoespaciais e de busca
smartPointSchema.index({ location: '2dsphere' });
smartPointSchema.index({ code: 1 }, { unique: true });
smartPointSchema.index({ status: 1, 'capacity.available': 1 });
smartPointSchema.index({ managerId: 1 });
smartPointSchema.index({ averageRating: -1 });

// Virtual para verificar se está aberto
smartPointSchema.virtual('isOpen').get(function() {
  if (this.status !== SmartPointStatus.ACTIVE) return false;
  
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  
  const hours = this.operatingHours[day as keyof OperatingHours];
  if (!hours || hours === 'Fechado') return false;
  
  const [open, close] = hours.split('-');
  return currentTime >= open && currentTime <= close;
});

// Virtual para capacidade utilizada
smartPointSchema.virtual('utilizationRate').get(function() {
  return ((this.capacity.total - this.capacity.available) / this.capacity.total) * 100;
});

// Middleware para inicializar capacidade
smartPointSchema.pre('save', function(next) {
  if (this.isNew) {
    this.capacity.available = this.capacity.total;
    this.capacity.reserved = 0;
  }
  next();
});

export const SmartPoint: Model<ISmartPoint> = mongoose.model<ISmartPoint>('SmartPoint', smartPointSchema);