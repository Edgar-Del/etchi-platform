// src/models/AnalyticsLog.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * @typedef {Object} IAnalyticsLog
 * @property {AnalyticsEventType} eventType - Tipo de evento
 * @property {string} eventName - Nome específico do evento
 * @property {mongoose.Types.ObjectId} userId - ID do usuário relacionado
 * @property {mongoose.Types.ObjectId} entityId - ID da entidade relacionada
 * @property {string} entityType - Tipo da entidade relacionada
 * @property {object} eventData - Dados do evento
 * @property {object} sessionInfo - Informações da sessão
 * @property {object} deviceInfo - Informações do dispositivo
 * @property {object} locationInfo - Informações de localização
 * @property {string} ipAddress - Endereço IP
 * @property {string} userAgent - User Agent do navegador
 * @property {number} processingTime - Tempo de processamento em ms
 * @property {string} status - Status do evento (success, error, warning)
 * @property {string} errorMessage - Mensagem de erro (se aplicável)
 * @property {object} metadata - Metadados adicionais
 * @property {Date} createdAt - Data de criação
 */
export interface IAnalyticsLog extends Document {
  eventType: AnalyticsEventType;
  eventName: string;
  userId?: mongoose.Types.ObjectId;
  entityId?: mongoose.Types.ObjectId;
  entityType?: string;
  eventData: object;
  sessionInfo: SessionInfo;
  deviceInfo: DeviceInfo;
  locationInfo?: LocationInfo;
  ipAddress?: string;
  userAgent?: string;
  processingTime?: number;
  status: 'success' | 'error' | 'warning';
  errorMessage?: string;
  metadata?: object;
  createdAt: Date;
}

/**
 * Tipo de evento analítico
 * @enum {string}
 */
export enum AnalyticsEventType {
  DELIVERY = 'delivery',           // Eventos de entrega
  PAYMENT = 'payment',             // Eventos de pagamento
  USER_BEHAVIOR = 'user_behavior', // Comportamento do usuário
  APP_USAGE = 'app_usage',         // Uso da aplicação
  ERROR = 'error',                 // Erros do sistema
  PERFORMANCE = 'performance',     // Performance
  BUSINESS = 'business'            // Métricas de negócio
}

/**
 * @typedef {Object} SessionInfo
 * @property {string} sessionId - ID da sessão
 * @property {string} platform - Plataforma (web, android, ios)
 * @property {string} appVersion - Versão da aplicação
 * @property {string} source - Fonte do tráfego
 */
export interface SessionInfo {
  sessionId: string;
  platform: 'web' | 'android' | 'ios';
  appVersion: string;
  source?: string;
}

/**
 * @typedef {Object} DeviceInfo
 * @property {string} type - Tipo de dispositivo
 * @property {string} os - Sistema operacional
 * @property {string} browser - Navegador (se web)
 * @property {string} screenResolution - Resolução do ecrã
 */
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser?: string;
  screenResolution?: string;
}

/**
 * @typedef {Object} LocationInfo
 * @property {string} country - País
 * @property {string} region - Região/Província
 * @property {string} city - Cidade
 * @property {string} timezone - Fuso horário
 */
export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

const analyticsLogSchema = new Schema<IAnalyticsLog>({
  eventType: {
    type: String,
    enum: Object.values(AnalyticsEventType),
    required: true,
    index: true
  },
  eventName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  entityType: {
    type: String,
    enum: ['DeliveryRequest', 'Transaction', 'User', 'SmartPoint'],
    index: true
  },
  eventData: {
    type: Schema.Types.Mixed,
    required: true
  },
  sessionInfo: {
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    platform: {
      type: String,
      enum: ['web', 'android', 'ios'],
      required: true
    },
    appVersion: {
      type: String,
      required: true
    },
    source: String
  },
  deviceInfo: {
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop'],
      required: true
    },
    os: {
      type: String,
      required: true
    },
    browser: String,
    screenResolution: String
  },
  locationInfo: {
    country: String,
    region: String,
    city: String,
    timezone: String
  },
  ipAddress: {
    type: String,
    validate: {
      validator: function(ip: string): boolean {
        return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) || 
               /^([a-f0-9:]+:+)+[a-f0-9]+$/.test(ip); // IPv4 ou IPv6
      },
      message: 'Endereço IP inválido'
    }
  },
  userAgent: String,
  processingTime: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['success', 'error', 'warning'],
    default: 'success',
    index: true
  },
  errorMessage: {
    type: String,
    maxlength: 1000
  },
  metadata: Schema.Types.Mixed
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Índices compostos para análise temporal
analyticsLogSchema.index({ eventType: 1, createdAt: -1 });
analyticsLogSchema.index({ userId: 1, eventType: 1 });
analyticsLogSchema.index({ eventName: 1, status: 1 });
analyticsLogSchema.index({ 'sessionInfo.platform': 1, createdAt: -1 });
analyticsLogSchema.index({ createdAt: 1 }); // Para time-series analysis

// Índice TTL para auto-expiração (manter logs por 2 anos)
analyticsLogSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 2 * 365 * 24 * 60 * 60 // 2 anos
});

// Virtual para dados resumidos do evento
analyticsLogSchema.virtual('summary').get(function() {
  return {
    eventType: this.eventType,
    eventName: this.eventName,
    userId: this.userId,
    status: this.status,
    timestamp: this.createdAt,
    platform: this.sessionInfo.platform
  };
});

// Método estático para log de evento de entrega
analyticsLogSchema.statics.logDeliveryEvent = function(
  eventName: string,
  deliveryRequestId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  eventData: object,
  sessionInfo: SessionInfo,
  deviceInfo: DeviceInfo
): Promise<IAnalyticsLog> {
  return this.create({
    eventType: AnalyticsEventType.DELIVERY,
    eventName,
    userId,
    entityId: deliveryRequestId,
    entityType: 'DeliveryRequest',
    eventData,
    sessionInfo,
    deviceInfo,
    status: 'success'
  });
};

// Método estático para log de erro
analyticsLogSchema.statics.logError = function(
  eventName: string,
  error: Error,
  userId?: mongoose.Types.ObjectId,
  entityId?: mongoose.Types.ObjectId,
  sessionInfo?: SessionInfo
): Promise<IAnalyticsLog> {
  return this.create({
    eventType: AnalyticsEventType.ERROR,
    eventName,
    userId,
    entityId,
    eventData: {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack
    },
    sessionInfo: sessionInfo || {
      sessionId: 'unknown',
      platform: 'unknown',
      appVersion: 'unknown'
    },
    deviceInfo: {
      type: 'desktop',
      os: 'unknown'
    },
    status: 'error',
    errorMessage: error.message
  });
};

// Middleware para validação de dados do evento
analyticsLogSchema.pre('save', function(next) {
  // Limitar tamanho do eventData para evitar documentos muito grandes
  const eventDataSize = JSON.stringify(this.eventData).length;
  if (eventDataSize > 10000) { // 10KB max
    this.eventData = { 
      error: 'Event data too large',
      originalSize: eventDataSize
    };
  }
  next();
});

export const AnalyticsLog: Model<IAnalyticsLog> = mongoose.model<IAnalyticsLog>('AnalyticsLog', analyticsLogSchema);