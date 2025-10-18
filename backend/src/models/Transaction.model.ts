// src/models/Transaction.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { PaymentMethod } from './DeliveryRequest.model';

/**
 * @typedef {Object} PaymentDetails
 * @property {string} transactionId - ID da transação no provedor
 * @property {string} authorizationCode - Código de autorização
 * @property {string} paymentGateway - Gateway de pagamento usado
 * @property {object} metadata - Metadados adicionais do pagamento
 */
export interface PaymentDetails {
  transactionId?: string;
  authorizationCode?: string;
  paymentGateway: string;
  metadata?: object;
}

/**
 * @typedef {Object} ITransaction
 * @property {string} reference - Referência única da transação
 * @property {mongoose.Types.ObjectId} deliveryRequestId - ID do pedido relacionado
 * @property {mongoose.Types.ObjectId} customerId - ID do cliente
 * @property {mongoose.Types.ObjectId} deliveryPartnerId - ID do entregador
 * @property {TransactionType} type - Tipo de transação
 * @property {PaymentMethod} paymentMethod - Método de pagamento
 * @property {TransactionStatus} status - Status da transação
 * @property {number} amount - Valor total em AOA
 * @property {number} platformFee - Taxa da plataforma
 * @property {number} partnerEarnings - Ganhos do entregador
 * @property {number} netAmount - Valor líquido (amount - fees)
 * @property {PaymentDetails} paymentDetails - Detalhes do pagamento
 * @property {Date} processedAt - Data/hora do processamento
 * @property {Date} completedAt - Data/hora da conclusão
 * @property {string} failureReason - Motivo da falha
 * @property {string} refundReason - Motivo do reembolso
 * @property {Date} refundedAt - Data/hora do reembolso
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data de atualização
 */
export interface ITransaction extends Document {
  reference: string;
  deliveryRequestId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  deliveryPartnerId: mongoose.Types.ObjectId;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  amount: number;
  platformFee: number;
  partnerEarnings: number;
  netAmount: number;
  paymentDetails: PaymentDetails;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  refundReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipo de transação
 * @enum {string}
 */
export enum TransactionType {
  DELIVERY_PAYMENT = 'delivery_payment',     // Pagamento de entrega
  PLATFORM_FEE = 'platform_fee',             // Taxa da plataforma
  PARTNER_PAYOUT = 'partner_payout',         // Pagamento ao entregador
  REFUND = 'refund',                         // Reembolso
  WALLET_TOPUP = 'wallet_topup'              // Recarga de carteira
}

/**
 * Status da transação
 * @enum {string}
 */
export enum TransactionStatus {
  PENDING = 'pending',           // Aguardando processamento
  PROCESSING = 'processing',     // Em processamento
  COMPLETED = 'completed',       // Concluída com sucesso
  FAILED = 'failed',             // Falhou
  REFUNDED = 'refunded',         // Reembolsada
  CANCELLED = 'cancelled'        // Cancelada
}

const transactionSchema = new Schema<ITransaction>({
  reference: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^TXN[0-9]{12}$/, 'Formato de referência inválido']
  },
  deliveryRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'DeliveryRequest',
    required: true,
    index: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deliveryPartnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: true,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    set: (v: number) => Math.round(v * 100) / 100 // 2 casas decimais
  },
  platformFee: {
    type: Number,
    required: true,
    min: 0,
    set: (v: number) => Math.round(v * 100) / 100
  },
  partnerEarnings: {
    type: Number,
    required: true,
    min: 0,
    set: (v: number) => Math.round(v * 100) / 100
  },
  netAmount: {
    type: Number,
    required: true,
    set: (v: number) => Math.round(v * 100) / 100
  },
  paymentDetails: {
    transactionId: String,
    authorizationCode: String,
    paymentGateway: {
      type: String,
      required: true,
      enum: ['multicaixa_express', 'paypal', 'stripe', 'flutterwave']
    },
    metadata: Schema.Types.Mixed
  },
  processedAt: Date,
  completedAt: Date,
  failureReason: {
    type: String,
    maxlength: 500
  },
  refundReason: {
    type: String,
    maxlength: 500
  },
  refundedAt: Date
}, {
  timestamps: true
});

// Índices para consultas financeiras
transactionSchema.index({ customerId: 1, createdAt: -1 });
transactionSchema.index({ deliveryPartnerId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ createdAt: 1, amount: 1 });

// Virtual para verificar se é reembolsável
transactionSchema.virtual('isRefundable').get(function() {
  const refundableStatuses = [TransactionStatus.COMPLETED, TransactionStatus.PROCESSING];
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias
  
  return refundableStatuses.includes(this.status) && 
         this.createdAt > cutoffDate &&
         this.type !== TransactionType.REFUND;
});

// Método estático para gerar referência
transactionSchema.statics.generateReference = function(): string {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TXN${timestamp}${random}`;
};

// Middleware para calcular valores líquidos
transactionSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('platformFee') || this.isModified('partnerEarnings')) {
    this.netAmount = this.amount - this.platformFee;
  }
  
  if (this.isNew && !this.reference) {
    this.reference = `TXN${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  }
  
  next();
});

export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>('Transaction', transactionSchema);