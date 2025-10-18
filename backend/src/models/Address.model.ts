// src/models/Address.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserLocation } from './User.model';

/**
 * @typedef {Object} IAddress
 * @property {mongoose.Types.ObjectId} userId - ID do usuário dono do endereço
 * @property {string} label - Rótulo do endereço (Casa, Trabalho, etc.)
 * @property {string} contactName - Nome do contacto no endereço
 * @property {string} contactPhone - Telefone do contacto
 * @property {AddressType} addressType - Tipo de endereço
 * @property {string} street - Rua/Avenida
 * @property {string} number - Número
 * @property {string} neighborhood - Bairro
 * @property {string} municipality - Município
 * @property {string} province - Província
 * @property {string} country - País (sempre Angola)
 * @property {string} postalCode - Código postal
 * @property {string} referencePoint - Ponto de referência
 * @property {UserLocation} location - Coordenadas geográficas (GeoJSON)
 * @property {boolean} isDefault - Endereço padrão do usuário
 * @property {boolean} isActive - Endereço ativo
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data de atualização
 */
export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  label: string;
  contactName: string;
  contactPhone: string;
  addressType: AddressType;
  street: string;
  number?: string;
  neighborhood: string;
  municipality: string;
  province: string;
  country: string;
  postalCode?: string;
  referencePoint?: string;
  location: UserLocation;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipos de endereço
 * @enum {string}
 */
export enum AddressType {
  ORIGIN = 'origin',
  DESTINATION = 'destination',
  SMART_POINT = 'smart_point',
  PERSONAL = 'personal'
}

const addressSchema = new Schema<IAddress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  label: {
    type: String,
    required: [true, 'Rótulo do endereço é obrigatório'],
    trim: true,
    maxlength: [50, 'Rótulo não pode exceder 50 caracteres']
  },
  contactName: {
    type: String,
    required: [true, 'Nome do contacto é obrigatório'],
    trim: true
  },
  contactPhone: {
    type: String,
    required: [true, 'Telefone do contacto é obrigatório'],
    match: [/^\+244[9][1-9][0-9]{7}$/, 'Formato de telefone angolano inválido']
  },
  addressType: {
    type: String,
    enum: Object.values(AddressType),
    required: true
  },
  street: {
    type: String,
    required: [true, 'Rua é obrigatória'],
    trim: true
  },
  number: {
    type: String,
    trim: true
  },
  neighborhood: {
    type: String,
    required: [true, 'Bairro é obrigatório'],
    trim: true
  },
  municipality: {
    type: String,
    required: [true, 'Município é obrigatório'],
    trim: true
  },
  province: {
    type: String,
    required: [true, 'Província é obrigatória'],
    enum: [
      'Luanda', 'Benguela', 'Huíla', 'Huambo', 'Cabinda', 'Cunene', 
      'Zaire', 'Uíge', 'Malanje', 'Lunda Norte', 'Lunda Sul', 'Bié',
      'Moxico','Moxico Leste','Icolo e Bengo', 'Cuando','Cubango', 'Namibe', 'Cuanza Norte', 'Cuanza Sul'
    ]
  },
  country: {
    type: String,
    default: 'Angola',
    required: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  referencePoint: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords: number[]): boolean {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && 
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Coordenadas inválidas'
      }
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ location: '2dsphere' });
addressSchema.index({ province: 1, municipality: 1 });
addressSchema.index({ addressType: 1 });
addressSchema.index({ isActive: 1 });

// Garantir apenas um endereço padrão por usuário
addressSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.model('Address').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Virtual para endereço completo formatado
addressSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.street,
    this.number,
    this.neighborhood,
    this.municipality,
    this.province,
    this.country
  ].filter(part => part);
  return parts.join(', ');
});

export const Address: Model<IAddress> = mongoose.model<IAddress>('Address', addressSchema);