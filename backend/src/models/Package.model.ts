import mongoose, { Document, Schema } from 'mongoose';

export enum PackageStatus {
  PENDING = 'pending',           // Aguardando traveler
  ACCEPTED = 'accepted',         // Traveler aceitou
  PICKED_UP = 'picked_up',       // Pacote recolhido
  IN_TRANSIT = 'in_transit',     // A caminho
  DELIVERED = 'delivered',       // Entregue
  CANCELLED = 'cancelled'       // Cancelado
}

export enum PackageSize {
  SMALL = 'small',      // Até 2kg
  MEDIUM = 'medium',    // 2-10kg
  LARGE = 'large',      // 10-20kg
  EXTRA_LARGE = 'extra_large' // 20kg+
}

export interface IPackage extends Document {
  senderId: mongoose.Types.ObjectId;
  travelerId?: mongoose.Types.ObjectId;
  
  // Informações do pacote
  itemName: string;
  description?: string;
  size: PackageSize;
  weight: number; // kg
  value: number; // Valor declarado em KZ
  images: string[];
  
  // Endereços
  pickupAddress: {
    addressId: mongoose.Types.ObjectId;
    contactName: string;
    contactPhone: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  
  deliveryAddress: {
    addressId: mongoose.Types.ObjectId;
    contactName: string;
    contactPhone: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  
  // Informações de entrega
  status: PackageStatus;
  estimatedDistance: number; // km
  estimatedDuration: number; // minutos
  
  // Preços
  deliveryFee: number; // KZ
  platformFee: number; // KZ
  totalAmount: number; // KZ
  
  // Propostas de travelers
  offers: Array<{
    travelerId: mongoose.Types.ObjectId;
    amount: number;
    message?: string;
    estimatedArrival: number; // minutos
    createdAt: Date;
  }>;
  
  // Timeline
  timeline: Array<{
    status: PackageStatus;
    timestamp: Date;
    description: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }>;
  
  // Avaliação
  rating?: {
    stars: number;
    comment?: string;
    createdAt: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const packageSchema = new Schema<IPackage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  travelerId: { type: Schema.Types.ObjectId, ref: 'User' },
  
  itemName: { type: String, required: true },
  description: String,
  size: { type: String, enum: Object.values(PackageSize), required: true },
  weight: { type: Number, required: true },
  value: { type: Number, required: true },
  images: [String],
  
  pickupAddress: {
    addressId: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    fullAddress: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    instructions: String
  },
  
  deliveryAddress: {
    addressId: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    fullAddress: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    instructions: String
  },
  
  status: { type: String, enum: Object.values(PackageStatus), default: PackageStatus.PENDING },
  estimatedDistance: Number,
  estimatedDuration: Number,
  
  deliveryFee: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  
  offers: [{
    travelerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    message: String,
    estimatedArrival: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  timeline: [{
    status: { type: String, enum: Object.values(PackageStatus), required: true },
    timestamp: { type: Date, default: Date.now },
    description: { type: String, required: true },
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  
  rating: {
    stars: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Indexes para performance
packageSchema.index({ senderId: 1, status: 1 });
packageSchema.index({ travelerId: 1, status: 1 });
packageSchema.index({ status: 1, createdAt: 1 });
packageSchema.index({ 'pickupAddress.latitude': 1, 'pickupAddress.longitude': 1 });
packageSchema.index({ 'deliveryAddress.latitude': 1, 'deliveryAddress.longitude': 1 });

export const Package = mongoose.model<IPackage>('Package', packageSchema);