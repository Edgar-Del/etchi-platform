// src/models/Review.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * @typedef {Object} IReview
 * @property {mongoose.Types.ObjectId} deliveryRequestId - ID do pedido avaliado
 * @property {mongoose.Types.ObjectId} customerId - ID do cliente que avaliou
 * @property {mongoose.Types.ObjectId} deliveryPartnerId - ID do entregador avaliado
 * @property {ReviewType} reviewType - Tipo de avaliação
 * @property {number} rating - Rating (1-5)
 * @property {string} comment - Comentário da avaliação
 * @property {string[]} tags - Tags da avaliação
 * @property {object} aspectRatings - Ratings por aspecto específico
 * @property {boolean} isVerified - Se a avaliação é verificada (cliente real)
 * @property {boolean} isPublic - Se a avaliação é pública
 * @property {mongoose.Types.ObjectId} responseId - ID da resposta à avaliação
 * @property {Date} respondedAt - Data/hora da resposta
 * @property {string} responseComment - Comentário da resposta
 * @property {boolean} isEdited - Se foi editada
 * @property {Date} editedAt - Data/hora da edição
 * @property {string} editReason - Motivo da edição
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data de atualização
 */
export interface IReview extends Document {
  deliveryRequestId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  deliveryPartnerId: mongoose.Types.ObjectId;
  reviewType: ReviewType;
  rating: number;
  comment?: string;
  tags: string[];
  aspectRatings: AspectRatings;
  isVerified: boolean;
  isPublic: boolean;
  responseId?: mongoose.Types.ObjectId;
  respondedAt?: Date;
  responseComment?: string;
  isEdited: boolean;
  editedAt?: Date;
  editReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipo de avaliação
 * @enum {string}
 */
export enum ReviewType {
  CUSTOMER_TO_PARTNER = 'customer_to_partner', // Cliente → Entregador
  PARTNER_TO_CUSTOMER = 'partner_to_customer'  // Entregador → Cliente
}

/**
 * Ratings por aspecto específico
 * @typedef {Object} AspectRatings
 * @property {number} punctuality - Pontualidade (1-5)
 * @property {number} communication - Comunicação (1-5)
 * @property {number} care - Cuidado com a encomenda (1-5)
 * @property {number} professionalism - Profissionalismo (1-5)
 */
export interface AspectRatings {
  punctuality?: number;
  communication?: number;
  care?: number;
  professionalism?: number;
}

const reviewSchema = new Schema<IReview>({
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
  reviewType: {
    type: String,
    enum: Object.values(ReviewType),
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating deve ser um número inteiro'
    }
  },
  comment: {
    type: String,
    maxlength: [1000, 'Comentário não pode exceder 1000 caracteres'],
    trim: true
  },
  tags: [{
    type: String,
    enum: [
      'punctual',
      'friendly',
      'professional',
      'careful',
      'communicative',
      'fast',
      'problem_solver',
      'going_extra_mile'
    ]
  }],
  aspectRatings: {
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating de pontualidade deve ser inteiro'
      }
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating de comunicação deve ser inteiro'
      }
    },
    care: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating de cuidado deve ser inteiro'
      }
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating de profissionalismo deve ser inteiro'
      }
    }
  },
  isVerified: {
    type: Boolean,
    default: true // Assumindo que vem de entregas reais
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  responseId: {
    type: Schema.Types.ObjectId,
    ref: 'Review'
  },
  respondedAt: Date,
  responseComment: {
    type: String,
    maxlength: 1000
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editReason: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Índices únicos para evitar avaliações duplicadas
reviewSchema.index({ 
  deliveryRequestId: 1, 
  reviewType: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    reviewType: { $in: ['customer_to_partner', 'partner_to_customer'] } 
  }
});

// Índices para consultas de rating
reviewSchema.index({ deliveryPartnerId: 1, rating: -1 });
reviewSchema.index({ customerId: 1, createdAt: -1 });
reviewSchema.index({ reviewType: 1, isPublic: 1 });
reviewSchema.index({ rating: 1, createdAt: -1 });

// Virtual para rating médio dos aspectos
reviewSchema.virtual('averageAspectRating').get(function() {
  const ratings = Object.values(this.aspectRatings).filter(r => r !== undefined);
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Virtual para verificar se tem resposta
reviewSchema.virtual('hasResponse').get(function() {
  return !!this.responseId;
});

// Método para adicionar resposta
reviewSchema.methods.addResponse = function(
  responderId: mongoose.Types.ObjectId,
  comment: string
): Promise<IReview> {
  // Criar nova review como resposta
  const ResponseReview = mongoose.model('Review');
  
  return ResponseReview.create({
    deliveryRequestId: this.deliveryRequestId,
    customerId: responderId,
    deliveryPartnerId: this.deliveryPartnerId,
    reviewType: this.reviewType === ReviewType.CUSTOMER_TO_PARTNER 
      ? ReviewType.PARTNER_TO_CUSTOMER 
      : ReviewType.CUSTOMER_TO_PARTNER,
    rating: 0, // Respostas não têm rating
    comment,
    isPublic: true,
    isVerified: true
  }).then(responseReview => {
    this.responseId = responseReview._id;
    this.respondedAt = new Date();
    this.responseComment = comment;
    return this.save();
  });
};

// Método estático para calcular rating médio
reviewSchema.statics.calculateAverageRating = function(
  userId: mongoose.Types.ObjectId,
  reviewType: ReviewType
): Promise<{ average: number; count: number }> {
  return this.aggregate([
    {
      $match: {
        $or: [
          { deliveryPartnerId: userId, reviewType: ReviewType.CUSTOMER_TO_PARTNER },
          { customerId: userId, reviewType: ReviewType.PARTNER_TO_CUSTOMER }
        ],
        isPublic: true,
        rating: { $gte: 1, $lte: 5 }
      }
    },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]).then(result => {
    return result[0] ? { 
      average: Math.round(result[0].average * 100) / 100, 
      count: result[0].count 
    } : { average: 0, count: 0 };
  });
};

// Middleware para validação de aspect ratings
reviewSchema.pre('save', function(next) {
  if (this.aspectRatings) {
    const invalidAspects = Object.entries(this.aspectRatings)
      .filter(([_, rating]) => rating && (rating < 1 || rating > 5 || !Number.isInteger(rating)))
      .map(([aspect, _]) => aspect);
    
    if (invalidAspects.length > 0) {
      return next(new Error(`Aspect ratings inválidos: ${invalidAspects.join(', ')}`));
    }
  }
  next();
});

export const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);