import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  MULTICAIXA = 'multicaixa',
  MPESA = 'mpesa',
  UNITEL = 'unitel',
  MOVICEL = 'movicel'
}

export interface IPayment extends Document {
  packageId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  travelerId: mongoose.Types.ObjectId;
  
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  
  // Informações da transação
  transactionId?: string;
  providerReference?: string;
  
  // Timestamps
  paidAt?: Date;
  confirmedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  travelerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
  status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
  
  transactionId: String,
  providerReference: String,
  
  paidAt: Date,
  confirmedAt: Date
}, {
  timestamps: true
});

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);