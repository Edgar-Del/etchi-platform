// src/models/Notification.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * @typedef {Object} NotificationAction
 * @property {string} label - Rótulo da ação
 * @property {string} url - URL ou rota da ação
 * @property {string} method - Método HTTP (GET, POST, etc.)
 * @property {object} data - Dados adicionais para a ação
 */
export interface NotificationAction {
  label: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: object;
}

/**
 * @typedef {Object} INotification
 * @property {mongoose.Types.ObjectId} userId - ID do usuário destinatário
 * @property {string} title - Título da notificação
 * @property {string} message - Mensagem da notificação
 * @property {NotificationType} type - Tipo de notificação
 * @property {NotificationPriority} priority - Prioridade da notificação
 * @property {boolean} isRead - Se foi lida
 * @property {NotificationAction[]} actions - Ações disponíveis
 * @property {mongoose.Types.ObjectId} relatedEntityId - ID da entidade relacionada
 * @property {string} relatedEntityType - Tipo da entidade relacionada
 * @property {object} metadata - Metadados adicionais
 * @property {Date} sentAt - Data/hora de envio
 * @property {Date} readAt - Data/hora de leitura
 * @property {Date} expiresAt - Data/hora de expiração
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data de atualização
 */
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  actions: NotificationAction[];
  relatedEntityId?: mongoose.Types.ObjectId;
  relatedEntityType?: string;
  metadata?: object;
  sentAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipo de notificação
 * @enum {string}
 */
export enum NotificationType {
  DELIVERY_UPDATE = 'delivery_update',     // Atualização de entrega
  PAYMENT_CONFIRMATION = 'payment_confirmation', // Confirmação de pagamento
  SECURITY_ALERT = 'security_alert',       // Alerta de segurança
  PROMOTIONAL = 'promotional',             // Promocional
  SYSTEM_ANNOUNCEMENT = 'system_announcement', // Anúncio do sistema
  SUPPORT_RESPONSE = 'support_response',   // Resposta de suporte
  RATING_REMINDER = 'rating_reminder'      // Lembrete de avaliação
}

/**
 * Prioridade da notificação
 * @enum {string}
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    maxlength: [100, 'Título não pode exceder 100 caracteres']
  },
  message: {
    type: String,
    required: [true, 'Mensagem é obrigatória'],
    trim: true,
    maxlength: [500, 'Mensagem não pode exceder 500 caracteres']
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.MEDIUM,
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  actions: [{
    label: {
      type: String,
      required: true,
      maxlength: 50
    },
    url: {
      type: String,
      required: true
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    data: Schema.Types.Mixed
  }],
  relatedEntityId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  relatedEntityType: {
    type: String,
    enum: ['DeliveryRequest', 'Transaction', 'SupportTicket', 'User'],
    index: true
  },
  metadata: Schema.Types.Mixed,
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  readAt: Date,
  expiresAt: {
    type: Date,
    index: true,
    validate: {
      validator: function(date: Date): boolean {
        return !date || date > new Date();
      },
      message: 'Data de expiração deve ser no futuro'
    }
  }
}, {
  timestamps: true
});

// Índices compostos para consultas eficientes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, sentAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual para verificar se está expirada
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual para tempo desde o envio
notificationSchema.virtual('timeSinceSent').get(function() {
  return Date.now() - this.sentAt.getTime();
});

// Método para marcar como lida
notificationSchema.methods.markAsRead = function(): Promise<INotification> {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Método estático para criar notificação de entrega
notificationSchema.statics.createDeliveryNotification = function(
  userId: mongoose.Types.ObjectId,
  deliveryRequestId: mongoose.Types.ObjectId,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.MEDIUM
): Promise<INotification> {
  return this.create({
    userId,
    title,
    message,
    type: NotificationType.DELIVERY_UPDATE,
    priority,
    relatedEntityId: deliveryRequestId,
    relatedEntityType: 'DeliveryRequest',
    actions: [{
      label: 'Ver Entrega',
      url: `/deliveries/${deliveryRequestId}`,
      method: 'GET'
    }]
  });
};

// Middleware para validação de ações
notificationSchema.pre('save', function(next) {
  if (this.actions && this.actions.length > 3) {
    next(new Error('Máximo de 3 ações por notificação'));
  }
  next();
});

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);