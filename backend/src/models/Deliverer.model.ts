import mongoose, { Schema, Document } from 'mongoose';

export enum VehicleType {
  MOTO = 'MOTO',
  CARRO = 'CARRO',
  CAMINHAO = 'CAMINHAO'
}

export enum DelivererStatus {
  PENDING = 'PENDING', // Aguardando aprovação
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED'
}

export interface IVehicle {
  type: VehicleType;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  photo?: string;
  insuranceDocument?: string;
}

export interface IDocuments {
  bi: string; // Bilhete de Identidade
  drivingLicense: string; // Carta de Condução
  transportLicense?: string; // Licença de Transporte
  criminalRecord?: string; // Certificado de Antecedentes Criminais
}

export interface IReputation {
  averageRating: number;
  totalRatings: number;
  completionRate: number;
  punctualityRate: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  cancelledDeliveries: number;
}

export interface IAvailability {
  isOnline: boolean;
  currentLocation?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  lastLocationUpdate?: Date;
}

export interface IDeliverer extends Document {
  userId: mongoose.Types.ObjectId;
  vehicle: IVehicle;
  documents: IDocuments;
  status: DelivererStatus;
  reputation: IReputation;
  availability: IAvailability;
  earnings: {
    total: number;
    pending: number;
    paid: number;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    iban?: string;
  };
  verifiedAt?: Date;
  suspendedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DelivererSchema = new Schema<IDeliverer>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  vehicle: {
    type: {
      type: String,
      enum: Object.values(VehicleType),
      required: true
    },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    plate: { type: String, required: true, unique: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    photo: String,
    insuranceDocument: String
  },
  documents: {
    bi: { type: String, required: true },
    drivingLicense: { type: String, required: true },
    transportLicense: String,
    criminalRecord: String
  },
  status: {
    type: String,
    enum: Object.values(DelivererStatus),
    default: DelivererStatus.PENDING
  },
  reputation: {
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    punctualityRate: { type: Number, default: 0, min: 0, max: 100 },
    totalDeliveries: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    cancelledDeliveries: { type: Number, default: 0 }
  },
  availability: {
    isOnline: { type: Boolean, default: false },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    lastLocationUpdate: Date
  },
  earnings: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    paid: { type: Number, default: 0 }
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    iban: String
  },
  verifiedAt: Date,
  suspendedReason: String
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: Record<string, any>) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Índices
DelivererSchema.index({ userId: 1 });
DelivererSchema.index({ status: 1 });
DelivererSchema.index({ 'availability.isOnline': 1 });
DelivererSchema.index({ 'availability.currentLocation': '2dsphere' });
DelivererSchema.index({ 'reputation.averageRating': -1 });

export const Deliverer = mongoose.model<IDeliverer>('Deliverer', DelivererSchema);