// src/models/DeliveryAssignment.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { DeliveryStatus } from './DeliveryRequest.model';
import { UserLocation } from './User.model';

/**
 * @typedef {Object} AssignmentLocation
 * @property {UserLocation} pickup - Localização de recolha
 * @property {UserLocation} destination - Localização de entrega
 * @property {UserLocation} current - Localização atual do entregador
 */
export interface AssignmentLocation {
  pickup: UserLocation;
  destination: UserLocation;
  current?: UserLocation;
}

/**
 * @typedef {Object} AssignmentMetrics
 * @property {number} distance - Distância total em km
 * @property {number} estimatedDuration - Duração estimada em minutos
 * @property {number} actualDuration - Duração real em minutos
 * @property {number} averageSpeed - Velocidade média em km/h
 */
export interface AssignmentMetrics {
  distance: number;
  estimatedDuration: number;
  actualDuration?: number;
  averageSpeed?: number;
}

/**
 * @typedef {Object} IDeliveryAssignment
 * @property {mongoose.Types.ObjectId} deliveryRequestId - ID do pedido de entrega
 * @property {mongoose.Types.ObjectId} deliveryPartnerId - ID do entregador
 * @property {AssignmentStatus} status - Status da atribuição
 * @property {AssignmentLocation} locations - Localizações relevantes
 * @property {AssignmentMetrics} metrics - Métricas da entrega
 * @property {number} offeredAmount - Valor oferecido ao entregador
 * @property {number} acceptedAmount - Valor aceite pelo entregador
 * @property {Date} assignedAt - Data/hora de atribuição
 * @property {Date} acceptedAt - Data/hora de aceitação
 * @property {Date} startedAt - Data/hora de início
 * @property {Date} completedAt - Data/hora de conclusão
 * @property {Date} cancelledAt - Data/hora de cancelamento
 * @property {string} cancellationReason - Motivo do cancelamento
 * @property {string} failureReason - Motivo da falha
 * @property {number} ratingToCustomer - Avaliação para o cliente (1-5)
 * @property {number} ratingToPartner - Avaliação para o entregador (1-5)
 * @property {string} customerComment - Comentário do cliente
 * @property {string} partnerComment - Comentário do entregador
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data de atualização
 */
export interface IDeliveryAssignment extends Document {
  deliveryRequestId: mongoose.Types.ObjectId;
  deliveryPartnerId: mongoose.Types.ObjectId;
  status: AssignmentStatus;
  locations: AssignmentLocation;
  metrics: AssignmentMetrics;
  offeredAmount: number;
  acceptedAmount: number;
  assignedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  failureReason?: string;
  ratingToCustomer?: number;
  ratingToPartner?: number;
  customerComment?: string;
  partnerComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status da atribuição de entrega
 * @enum {string}
 */
export enum AssignmentStatus {
  ASSIGNED = 'assigned',         // Atribuído ao entregador
  ACCEPTED = 'accepted',         // Aceite pelo entregador
  DECLINED = 'declined',         // Recusado pelo entregador
  IN_PROGRESS = 'in_progress',   // Em andamento
  COMPLETED = 'completed',       // Concluído com sucesso
  CANCELLED = 'cancelled',       // Cancelado
  FAILED = 'failed'              // Falhou
}

const deliveryAssignmentSchema = new Schema<IDeliveryAssignment>({
  deliveryRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'DeliveryRequest',
    required: true,
    unique: true, // Uma atribuição por pedido
    index: true
  },
  deliveryPartnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(AssignmentStatus),
    default: AssignmentStatus.ASSIGNED,
    index: true
  },
  locations: {
    pickup: {
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
    destination: {
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
    current: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    }
  },
  metrics: {
    distance: {
      type: Number,
      required: true,
      min: 0
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 0
    },
    actualDuration: {
      type: Number,
      min: 0
    },
    averageSpeed: {
      type: Number,
      min: 0
    }
  },
  offeredAmount: {
    type: Number,
    required: true,
    min: 0
  },
  acceptedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: {
    type: String,
    maxlength: 500
  },
  failureReason: {
    type: String,
    maxlength: 500
  },
  ratingToCustomer: {
    type: Number,
    min: 1,
    max: 5
  },
  ratingToPartner: {
    type: Number,
    min: 1,
    max: 5
  },
  customerComment: {
    type: String,
    maxlength: 1000
  },
  partnerComment: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Índices compostos para consultas eficientes
deliveryAssignmentSchema.index({ deliveryPartnerId: 1, status: 1 });
deliveryAssignmentSchema.index({ status: 1, assignedAt: 1 });
deliveryAssignmentSchema.index({ 'locations.pickup': '2dsphere' });
deliveryAssignmentSchema.index({ 'locations.destination': '2dsphere' });
deliveryAssignmentSchema.index({ assignedAt: -1 });

// Virtual para calcular eficiência da entrega
deliveryAssignmentSchema.virtual('efficiencyScore').get(function() {
  if (!this.metrics.actualDuration || !this.metrics.estimatedDuration) {
    return null;
  }
  return (this.metrics.estimatedDuration / this.metrics.actualDuration) * 100;
});

// Virtual para verificar se a entrega foi pontual
deliveryAssignmentSchema.virtual('wasOnTime').get(function() {
  if (!this.completedAt || !this.metrics.estimatedDuration) {
    return null;
  }
  const expectedCompletion = new Date(this.assignedAt.getTime() + this.metrics.estimatedDuration * 60000);
  return this.completedAt <= expectedCompletion;
});

// Middleware para atualizar status do pedido relacionado
deliveryAssignmentSchema.post('save', async function() {
  const DeliveryRequest = mongoose.model('DeliveryRequest');
  const statusMap = {
    [AssignmentStatus.ASSIGNED]: DeliveryStatus.SEARCHING,
    [AssignmentStatus.ACCEPTED]: DeliveryStatus.ACCEPTED,
    [AssignmentStatus.DECLINED]: DeliveryStatus.CANCELLED,
    [AssignmentStatus.IN_PROGRESS]: DeliveryStatus.IN_TRANSIT,
    [AssignmentStatus.COMPLETED]: DeliveryStatus.DELIVERED,
    [AssignmentStatus.CANCELLED]: DeliveryStatus.CANCELLED,
    [AssignmentStatus.FAILED]: DeliveryStatus.FAILED
  };

  if (statusMap[this.status]) {
    await DeliveryRequest.findByIdAndUpdate(
      this.deliveryRequestId,
      { status: statusMap[this.status] }
    );
  }
});

export const DeliveryAssignment: Model<IDeliveryAssignment> = mongoose.model<IDeliveryAssignment>('DeliveryAssignment', deliveryAssignmentSchema);