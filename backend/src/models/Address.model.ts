import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  label: string; // Casa, Trabalho, etc.
  contactName: string;
  contactPhone: string;
  
  // Localização Angola
  province: string;
  municipality: string;
  neighborhood: string;
  street: string;
  number?: string;
  referencePoint?: string;
  
  // Coordenadas
  latitude: number;
  longitude: number;
  
  isDefault: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  
  province: { type: String, required: true },
  municipality: { type: String, required: true },
  neighborhood: { type: String, required: true },
  street: { type: String, required: true },
  number: String,
  referencePoint: String,
  
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Garantir apenas um endereço padrão por usuário
addressSchema.index({ userId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

export const Address = mongoose.model<IAddress>('Address', addressSchema);