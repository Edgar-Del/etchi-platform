// src/models/DeliveryRequest.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserLocation } from './User.model';

/**
 * @typedef {Object} PackageDetails
 * @property {string} description - Descrição do item
 * @property {PackageSize} size - Tamanho do pacote
 * @property {number} weight - Peso em kg
 * @property {Dimensions} dimensions - Dimensões (L x A x C)
 * @property {number} declaredValue - Valor declarado em AOA
 * @property {string[]} images - URLs das imagens do pacote
 * @property {string} category - Categoria do item
 */
export interface PackageDetails {
  description: string;
  size: PackageSize;
  weight: number;
  dimensions?: Dimensions;
  declaredValue: number;
  images: string[];
  category: string;
}

/**
 * @typedef {Object} Dimensions
 * @property {number} length - Comprimento em cm
 * @property {number} width - Largura em cm
 * @property {number} height - Altura em cm
 */
export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

/**
 * @typedef {Object} DeliveryTimeline
 * @property {DeliveryStatus} status - Status da entrega
 * @property {string} description - Descrição do evento
 * @property {Date} timestamp - Data/hora do evento
 * @property {UserLocation} location - Localização no momento do evento
 */
export interface DeliveryTimeline {
  status: DeliveryStatus;
  description: string;
  timestamp: Date;
  location?: UserLocation;
}

/**
 * @typedef {Object} IDeliveryRequest
 * @property {string} trackingCode - Código único de rastreamento
 * @property {mongoose.Types.ObjectId} customerId - ID do cliente
 * @property {mongoose.Types.ObjectId} deliveryPartnerId - ID do entregador
 * @property {mongoose.Types.ObjectId} originAddressId - Endereço de origem
 * @property {mongoose.Types.ObjectId} destinationAddressId - Endereço de destino
 * @property {mongoose.Types.ObjectId} smartPointId - Ponto de retirada (opcional)
 * @property {PackageDetails} package - Detalhes do pacote
 * @property {DeliveryStatus} status - Status atual da entrega
 * @property {DeliveryType} deliveryType - Tipo de entrega
 * @property {PaymentMethod} paymentMethod - Método de pagamento
 * @property {Pricing} pricing - Informações de preço
 * @property {DeliveryRequirements} requirements - Requisitos especiais
 * @property {DeliveryTimeline[]} timeline - Histórico de status
 * @property {Date} pickupDeadline - Prazo para recolha
 * @property {Date} deliveryDeadline - Prazo para entrega
 * @property {Date} pickedUpAt - Data/hora de recolha
 * @property {Date} deliveredAt - Data/hora de entrega
 * @property {number} estimatedDistance - Distância estimada em km
 * @property {number} estimatedDuration - Duração estimada em minutos
 * @property {string} cancellationReason - Motivo do cancelamento
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data de atualização
 */
export interface IDeliveryRequest extends Document {
  trackingCode: string;
  customerId: mongoose.Types.ObjectId;
  deliveryPartnerId?: mongoose.Types.ObjectId;
  originAddressId: mongoose.Types.ObjectId;
  destinationAddressId: mongoose.Types.ObjectId;
  smartPointId?: mongoose.Types.ObjectId;
  package: PackageDetails;
  status: DeliveryStatus;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  pricing: Pricing;
  requirements: DeliveryRequirements;
  timeline: DeliveryTimeline[];
  pickupDeadline: Date;
  deliveryDeadline: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  estimatedDistance: number;
  estimatedDuration: number;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status do pedido de entrega
 * @enum {string}
 */
export enum DeliveryStatus {
  PENDING = 'pending',           // Aguardando aceitação
  SEARCHING = 'searching',       // Procurando entregador
  ACCEPTED = 'accepted',         // Aceite pelo entregador
  PICKUP_ARRIVED = 'pickup_arrived', // Entregador chegou para recolha
  PICKED_UP = 'picked_up',       // Pacote recolhido
  IN_TRANSIT = 'in_transit',     // Em transporte
  DELIVERY_ARRIVED = 'delivery_arrived', // Entregador chegou para entrega
  DELIVERED = 'delivered',       // Entregue com sucesso
  CANCELLED = 'cancelled',       // Cancelado
  FAILED = 'failed',              // Falhou
  ASSIGNED = "ASSIGNED"
}

/**
 * Tipo de entrega
 * @enum {string}
 */
export enum DeliveryType {
  EXPRESS = 'express',           // Entrega rápida (até 2h)
  STANDARD = 'standard',         // Padrão (até 24h)
  SCHEDULED = 'scheduled',       // Agendada
  SMART_POINT = 'smart_point'    // Retirada em ponto
}

/**
 * Método de pagamento
 * @enum {string}
 */
export enum PaymentMethod {
  MULTICAIXA_EXPRESS = 'multicaixa_express',
  PAYPAL = 'paypal',
  CASH = 'cash',
  WALLET = 'wallet'
}

/**
 * @typedef {Object} Pricing
 * @property {number} baseFee - Taxa base
 * @property {number} distanceFee - Taxa por distância
 * @property {number} sizeFee - Taxa por tamanho
 * @property {number} urgencyFee - Taxa por urgência
 * @property {number} platformFee - Taxa da plataforma
 * @property {number} insuranceFee - Taxa de seguro
 * @property {number} totalAmount - Valor total
 */
export interface Pricing {
  baseFee: number;
  distanceFee: number;
  sizeFee: number;
  urgencyFee: number;
  platformFee: number;
  insuranceFee: number;
  totalAmount: number;
}

/**
 * @typedef {Object} DeliveryRequirements
 * @property {boolean} signatureRequired - Requer assinatura
 * @property {boolean} idVerification - Verificação de ID
 * @property {boolean} fragile - Item frágil
 * @property {boolean} perishable - Item perecível
 * @property {string} specialInstructions - Instruções especiais
 */
export interface DeliveryRequirements {
  signatureRequired: boolean;
  idVerification: boolean;
  fragile: boolean;
  perishable: boolean;
  specialInstructions?: string;
}

/**
 * @enum {string}
 */
export enum PackageSize {
  SMALL = 'small',       // Até 2kg, 30cm
  MEDIUM = 'medium',     // 2-10kg, 60cm
  LARGE = 'large',       // 10-25kg, 120cm
  EXTRA_LARGE = 'extra_large' // 25kg+, 150cm
}

const deliveryRequestSchema = new Schema<IDeliveryRequest>({
  trackingCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^ETC[0-9]{10}$/, 'Formato de código de rastreamento inválido']
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deliveryPartnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  originAddressId: {
    type: Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  destinationAddressId: {
    type: Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  smartPointId: {
    type: Schema.Types.ObjectId,
    ref: 'SmartPoint'
  },
  package: {
    description: {
      type: String,
      required: [true, 'Descrição do item é obrigatória'],
      maxlength: [500, 'Descrição não pode exceder 500 caracteres']
    },
    size: {
      type: String,
      enum: Object.values(PackageSize),
      required: true
    },
    weight: {
      type: Number,
      required: true,
      min: [0.1, 'Peso deve ser pelo menos 0.1kg'],
      max: [50, 'Peso não pode exceder 50kg']
    },
    dimensions: {
      length: { type: Number, min: 1 },
      width: { type: Number, min: 1 },
      height: { type: Number, min: 1 }
    },
    declaredValue: {
      type: Number,
      required: true,
      min: [0, 'Valor declarado não pode ser negativo']
    },
    images: [{
      type: String,
      validate: {
        validator: function(url: string): boolean {
          return /^https?:\/\/.+\..+/.test(url);
        },
        message: 'URL de imagem inválida'
      }
    }],
    category: {
      type: String,
      required: true,
      enum: ['documents', 'electronics', 'clothing', 'food', 'medicine', 'other']
    }
  },
  status: {
    type: String,
    enum: Object.values(DeliveryStatus),
    default: DeliveryStatus.PENDING,
    index: true
  },
  deliveryType: {
    type: String,
    enum: Object.values(DeliveryType),
    required: true
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true
  },
  pricing: {
    baseFee: { type: Number, required: true, min: 0 },
    distanceFee: { type: Number, required: true, min: 0 },
    sizeFee: { type: Number, required: true, min: 0 },
    urgencyFee: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    insuranceFee: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 }
  },
  requirements: {
    signatureRequired: { type: Boolean, default: false },
    idVerification: { type: Boolean, default: false },
    fragile: { type: Boolean, default: false },
    perishable: { type: Boolean, default: false },
    specialInstructions: { type: String, maxlength: 1000 }
  },
  timeline: [{
    status: { type: String, enum: Object.values(DeliveryStatus), required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number]
    }
  }],
  pickupDeadline: {
    type: Date,
    required: true,
    validate: {
      validator: function(date: Date): boolean {
        return date > new Date();
      },
      message: 'Prazo de recolha deve ser no futuro'
    }
  },
  deliveryDeadline: {
    type: Date,
    required: true,
    validate: {
      validator: function(date: Date): boolean {
        return date > this.pickupDeadline;
      },
      message: 'Prazo de entrega deve ser após o prazo de recolha'
    }
  },
  pickedUpAt: Date,
  deliveredAt: Date,
  estimatedDistance: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 0
  },
  cancellationReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Índices compostos para otimização
deliveryRequestSchema.index({ customerId: 1, status: 1 });
deliveryRequestSchema.index({ deliveryPartnerId: 1, status: 1 });
deliveryRequestSchema.index({ status: 1, createdAt: 1 });
deliveryRequestSchema.index({ trackingCode: 1 }, { unique: true });
deliveryRequestSchema.index({ deliveryDeadline: 1 });
deliveryRequestSchema.index({ 'package.category': 1 });

// Middleware para adicionar evento inicial ao timeline
deliveryRequestSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({
      status: DeliveryStatus.PENDING,
      description: 'Pedido criado e aguardando processamento',
      timestamp: new Date()
    });
  }
  next();
});

// Virtual para tempo estimado de entrega
deliveryRequestSchema.virtual('estimatedDeliveryTime').get(function() {
  return this.estimatedDuration;
});

// Virtual para verificar se está atrasado
deliveryRequestSchema.virtual('isOverdue').get(function() {
  if ([DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED, DeliveryStatus.FAILED].includes(this.status)) {
    return false;
  }
  return new Date() > this.deliveryDeadline;
});

// Método estático para gerar código de rastreamento
deliveryRequestSchema.statics.generateTrackingCode = function(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ETC${timestamp}${random}`;
};

export const DeliveryRequest: Model<IDeliveryRequest> = mongoose.model<IDeliveryRequest>('DeliveryRequest', deliveryRequestSchema);