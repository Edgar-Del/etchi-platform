import mongoose, { Schema, Document } from 'mongoose';

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  DELIVERER = 'DELIVERER',
  ADMIN = 'ADMIN'
}

export interface IUser extends Document {
  email: string;
  phone: string;
  password: string;
  name: string;
  userType: UserType;
  isActive: boolean;
  isVerified: boolean;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  phone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    select: false,
    minlength: [6, 'Senha deve ter no mínimo 6 caracteres']
  },
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [3, 'Nome deve ter no mínimo 3 caracteres']
  },
  userType: {
    type: String,
    enum: Object.values(UserType),
    default: UserType.CUSTOMER
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  profilePhoto: String
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: { _id: any; __v: any; password: any; id?: string }) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// Índices para performance
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ userType: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);