// src/models/SupportTicket.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * @typedef {Object} TicketMessage
 * @property {mongoose.Types.ObjectId} senderId - ID do remetente
 * @property {string} message - Conteúdo da mensagem
 * @property {string[]} attachments - URLs dos anexos
 * @property {boolean} isInternal - Se é mensagem interna da equipa
 * @property {Date} sentAt - Data/hora de envio
 */
export interface TicketMessage {
  senderId: mongoose.Types.ObjectId;
  message: string;
  attachments: string[];
  isInternal: boolean;
  sentAt: Date;
}

/**
 * @typedef {Object} ISupportTicket
 * @property {string} ticketNumber - Número único do ticket
 * @property {mongoose.Types.ObjectId} userId - ID do usuário que criou
 * @property {mongoose.Types.ObjectId} assignedAgentId - ID do agente atribuído
 * @property {string} subject - Assunto do ticket
 * @property {string} description - Descrição detalhada
 * @property {SupportCategory} category - Categoria do ticket
 * @property {TicketPriority} priority - Prioridade do ticket
 * @property {TicketStatus} status - Status atual
 * @property {TicketMessage[]} messages - Histórico de mensagens
 * @property {mongoose.Types.ObjectId} relatedEntityId - ID da entidade relacionada
 * @property {string} relatedEntityType - Tipo da entidade relacionada
 * @property {number} satisfactionRating - Avaliação de satisfação (1-5)
 * @property {string} satisfactionComment - Comentário da avaliação
 * @property {Date} firstResponseAt - Data/hora da primeira resposta
 * @property {Date} resolvedAt - Data/hora de resolução
 * @property {Date} closedAt - Data/hora de fecho
 * @property {string} resolutionSummary - Resumo da resolução
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data de atualização
 */
export interface ISupportTicket extends Document {
  ticketNumber: string;
  userId: mongoose.Types.ObjectId;
  assignedAgentId?: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  category: SupportCategory;
  priority: TicketPriority;
  status: TicketStatus;
  messages: TicketMessage[];
  relatedEntityId?: mongoose.Types.ObjectId;
  relatedEntityType?: string;
  satisfactionRating?: number;
  satisfactionComment?: string;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  resolutionSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Categoria de suporte
 * @enum {string}
 */
export enum SupportCategory {
  DELIVERY_ISSUE = 'delivery_issue',
  PAYMENT_PROBLEM = 'payment_problem',
  TECHNICAL_ISSUE = 'technical_issue',
  ACCOUNT_ISSUE = 'account_issue',
  SUGGESTION = 'suggestion',
  COMPLAINT = 'complaint',
  OTHER = 'other'
}

/**
 * Prioridade do ticket
 * @enum {string}
 */
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Status do ticket
 * @enum {string}
 */
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  AWAITING_RESPONSE = 'awaiting_response',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

const supportTicketSchema = new Schema<ISupportTicket>({
  ticketNumber: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^TKT[0-9]{8}$/, 'Formato de número de ticket inválido']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAgentId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  subject: {
    type: String,
    required: [true, 'Assunto é obrigatório'],
    trim: true,
    maxlength: [200, 'Assunto não pode exceder 200 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    maxlength: [2000, 'Descrição não pode exceder 2000 caracteres']
  },
  category: {
    type: String,
    enum: Object.values(SupportCategory),
    required: true
  },
  priority: {
    type: String,
    enum: Object.values(TicketPriority),
    default: TicketPriority.MEDIUM
  },
  status: {
    type: String,
    enum: Object.values(TicketStatus),
    default: TicketStatus.OPEN
  },
  messages: [{
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [5000, 'Mensagem não pode exceder 5000 caracteres']
    },
    attachments: [{
      type: String,
      validate: {
        validator: function(url: string): boolean {
          return /^https?:\/\/.+\..+/.test(url);
        },
        message: 'URL de anexo inválida'
      }
    }],
    isInternal: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  relatedEntityId: {
    type: Schema.Types.ObjectId
  },
  relatedEntityType: {
    type: String,
    enum: ['DeliveryRequest', 'Transaction', 'User']
  },
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  satisfactionComment: {
    type: String,
    maxlength: 1000
  },
  firstResponseAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  resolutionSummary: {
    type: String,
    maxlength: 2000
  }
}, {
  timestamps: true
});

// Índices para gestão de tickets
supportTicketSchema.index({ ticketNumber: 1 }, { unique: true });
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ assignedAgentId: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: -1 });
supportTicketSchema.index({ category: 1, createdAt: -1 });

// Virtual para tempo de primeira resposta
supportTicketSchema.virtual('firstResponseTime').get(function() {
  if (!this.firstResponseAt) return null;
  return this.firstResponseAt.getTime() - this.createdAt.getTime();
});

// Virtual para tempo total de resolução
supportTicketSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedAt) return null;
  return this.resolvedAt.getTime() - this.createdAt.getTime();
});

// Virtual para contagem de mensagens
supportTicketSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual para contagem de mensagens do cliente
supportTicketSchema.virtual('customerMessageCount').get(function() {
  return this.messages.filter(msg => !msg.isInternal && msg.senderId.equals(this.userId)).length;
});

// Método para adicionar mensagem
supportTicketSchema.methods.addMessage = function(
  senderId: mongoose.Types.ObjectId,
  message: string,
  attachments: string[] = [],
  isInternal: boolean = false
): Promise<ISupportTicket> {
  this.messages.push({
    senderId,
    message,
    attachments,
    isInternal,
    sentAt: new Date()
  });

  // Atualizar primeiro resposta se for a primeira resposta da equipa
  if (!this.firstResponseAt && !isInternal && !senderId.equals(this.userId)) {
    this.firstResponseAt = new Date();
  }

  return this.save();
};

// Método para atribuir agente
supportTicketSchema.methods.assignAgent = function(agentId: mongoose.Types.ObjectId): Promise<ISupportTicket> {
  this.assignedAgentId = agentId;
  this.status = TicketStatus.IN_PROGRESS;
  return this.save();
};

// Método estático para gerar número de ticket
supportTicketSchema.statics.generateTicketNumber = function(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TKT${timestamp}${random}`;
};

// Middleware para gerar número de ticket
supportTicketSchema.pre('save', function(next) {
  if (this.isNew && !this.ticketNumber) {
    this.ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  }
  next();
});

export const SupportTicket: Model<ISupportTicket> = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);