// src/services/notifications.service.ts
import admin from 'firebase-admin';
import { Notification, INotification, NotificationType, NotificationPriority } from '../models/Notification.model';
import { EmailService } from './email.service';
import { UsersService } from './users.service';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actions?: Array<{ label: string; url: string; method?: 'GET' | 'POST' | 'PUT' | 'DELETE' }>;
  data?: any;
}

export class NotificationsService {
  private emailService: EmailService;
  private usersService: UsersService;
  private firebaseAdmin: admin.app.App | null = null;

  constructor() {
    this.emailService = new EmailService();
    this.usersService = new UsersService();
    this.initializeFirebase();
  }

  /**
   * Inicializa o Firebase Admin SDK
   */
  private initializeFirebase() {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        console.warn('Firebase Admin não configurado - variáveis de ambiente ausentes');
        return;
      }

      if (admin.apps.length === 0) {
        this.firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        console.log('Firebase Admin SDK inicializado com sucesso');
      }
    } catch (error: any) {
      console.error('Erro ao inicializar Firebase Admin SDK:', error);
    }
  }

  /**
   * Envia uma notificação para um usuário
   */
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    options?: {
      type?: NotificationType;
      priority?: NotificationPriority;
      relatedEntityId?: string;
      relatedEntityType?: string;
      actions?: Array<{ label: string; url: string; method?: 'GET' | 'POST' | 'PUT' | 'DELETE' }>;
      data?: any;
    }
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: { notification: INotification; pushSent: boolean; emailSent: boolean } 
  }> {
    try {
      // Buscar usuário para obter preferências
      const userResult = await this.usersService.findById(userId);
      const user = userResult.data;

      // Criar notificação no banco de dados
      const notificationData: Partial<INotification> = {
        userId: userId as any,
        title,
        message,
        type: options?.type || NotificationType.SYSTEM_ANNOUNCEMENT,
        priority: options?.priority || NotificationPriority.MEDIUM,
        isRead: false,
        sentAt: new Date(),
        actions: (options?.actions || []).map(action => ({ ...action, method: action.method || 'GET' })),
        relatedEntityId: options?.relatedEntityId as any,
        relatedEntityType: options?.relatedEntityType,
        metadata: options?.data,
      };

      const notification = await Notification.create(notificationData);

      // Enviar notificações baseado nas preferências do usuário
      let pushSent = false;
      let emailSent = false;

      if (user.preferences?.pushNotifications) {
        pushSent = await this.sendPushNotification(user, notification);
      }

      if (user.preferences?.emailNotifications && user.email) {
        emailSent = await this.sendEmailNotification(user, notification);
      }

      console.log(`Notificação enviada para usuário ${userId}: ${title}`);

      return {
        success: true,
        message: 'Notificação enviada com sucesso',
        data: { notification, pushSent, emailSent }
      };
    } catch (error: any) {
      console.error(`Erro ao enviar notificação para ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém notificações do usuário
   */
  async getNotifications(
    userId: string,
    filters?: { 
      isRead?: boolean; 
      type?: NotificationType;
      limit?: number;
      page?: number;
    }
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: { notifications: INotification[]; total: number; unreadCount: number } 
  }> {
    try {
      const query: any = { userId };
      
      if (filters?.isRead !== undefined) {
        query.isRead = filters.isRead;
      }
      
      if (filters?.type) {
        query.type = filters.type;
      }

      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ sentAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        Notification.countDocuments(query),
        Notification.countDocuments({ userId, isRead: false }),
      ]);

      return {
        success: true,
        message: 'Notificações obtidas com sucesso',
        data: { notifications, total, unreadCount }
      };
    } catch (error: any) {
      console.error(`Erro ao buscar notificações do usuário ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: INotification 
  }> {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { 
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).exec();

      if (!notification) {
        throw new Error('Notificação não encontrada');
      }

      return {
        success: true,
        message: 'Notificação marcada como lida',
        data: notification
      };
    } catch (error: any) {
      console.error(`Erro ao marcar notificação ${notificationId} como lida: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marca todas as notificações do usuário como lidas
   */
  async markAllAsRead(userId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: { updatedCount: number } 
  }> {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { 
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date()
        }
      ).exec();

      console.log(`Todas as notificações do usuário ${userId} marcadas como lidas`);

      return {
        success: true,
        message: 'Todas as notificações marcadas como lidas',
        data: { updatedCount: result.modifiedCount }
      };
    } catch (error: any) {
      console.error(`Erro ao marcar todas as notificações como lidas para ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove uma notificação
   */
  async removeNotification(notificationId: string): Promise<{ 
    success: boolean; 
    message: string; 
  }> {
    try {
      await Notification.findByIdAndDelete(notificationId);

      console.log(`Notificação ${notificationId} removida`);

      return {
        success: true,
        message: 'Notificação removida com sucesso'
      };
    } catch (error: any) {
      console.error(`Erro ao remover notificação ${notificationId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia notificação push via FCM
   */
  private async sendPushNotification(user: any, notification: INotification & { _id: any }): Promise<boolean> {
    try {
      if (!this.firebaseAdmin) {
        console.warn('Firebase Admin não inicializado - push notification não enviada');
        return false;
      }

      // Buscar tokens reais do usuário
      const fcmTokens = user.fcmTokens
        ?.filter((tokenData: any) => tokenData.token)
        .map((tokenData: any) => tokenData.token) || [];

      if (fcmTokens.length === 0) {
        console.warn(`Usuário ${user._id} não possui tokens FCM registrados`);
        return false;
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          notificationId: notification._id.toString(),
          type: notification.type.toString(),
          relatedEntityId: notification.relatedEntityId?.toString() || '',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        tokens: fcmTokens,
      };

      const response = await this.firebaseAdmin.messaging().sendEachForMulticast(message);

      if (response.failureCount > 0) {
        console.warn(`Falha no envio de ${response.failureCount} push notifications`);
      }

      return response.successCount > 0;
    } catch (error: any) {
      console.error(`Erro no envio de push notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Envia notificação por email
   */
  private async sendEmailNotification(user: any, notification: INotification): Promise<boolean> {
    try {
      const emailTemplate = this.getEmailTemplate(notification);
      
      await this.emailService.sendEmail({
        to: user.email,
        subject: notification.title,
        template: emailTemplate.template,
        context: {
          userName: user.name,
          message: notification.message,
          ...emailTemplate.context,
        },
      });

      return true;
    } catch (error: any) {
      console.error(`Erro no envio de email notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtém template de email baseado no tipo de notificação
   */
  private getEmailTemplate(notification: INotification): { template: string; context: any } {
    const templates: any = {
      [NotificationType.DELIVERY_UPDATE]: {
        template: 'delivery-update',
        context: {
          actionText: 'Ver Entrega',
          actionUrl: `${process.env.CLIENT_URL}/deliveries/${notification.relatedEntityId}`,
        },
      },
      [NotificationType.PAYMENT_CONFIRMATION]: {
        template: 'payment-confirmation',
        context: {
          actionText: 'Ver Transação',
          actionUrl: `${process.env.CLIENT_URL}/transactions/${notification.relatedEntityId}`,
        },
      },
      [NotificationType.SECURITY_ALERT]: {
        template: 'security-alert',
        context: {
          urgency: 'high',
        },
      },
      [NotificationType.PROMOTIONAL]: {
        template: 'promotional',
        context: {
          isPromotional: true,
        },
      },
      [NotificationType.SYSTEM_ANNOUNCEMENT]: {
        template: 'system-announcement',
        context: {
          isSystem: true,
        },
      },
      [NotificationType.SUPPORT_RESPONSE]: {
        template: 'support-response',
        context: {
          actionText: 'Ver Ticket',
          actionUrl: `${process.env.CLIENT_URL}/support/${notification.relatedEntityId}`,
        },
      },
      [NotificationType.RATING_REMINDER]: {
        template: 'rating-reminder',
        context: {
          actionText: 'Avaliar Entrega',
          actionUrl: `${process.env.CLIENT_URL}/deliveries/${notification.relatedEntityId}/review`,
        },
      },
    };

    return templates[notification.type] || {
      template: 'general',
      context: {},
    };
  }

  /**
   * Envia notificação em lote para múltiplos usuários
   */
  async sendBulkNotification(
    userIds: string[],
    title: string,
    message: string,
    options?: {
      type?: NotificationType;
      priority?: NotificationPriority;
    }
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: { sent: number; failed: number } 
  }> {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => 
          this.sendNotification(userId, title, message, options)
        )
      );

      const sent = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      console.log(`Notificação em lote enviada: ${sent} sucessos, ${failed} falhas`);

      return {
        success: failed === 0,
        message: `Notificação enviada para ${sent} usuários`,
        data: { sent, failed }
      };
    } catch (error: any) {
      console.error(`Erro no envio de notificação em lote: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpa notificações antigas
   */
  async cleanupOldNotifications(days: number = 30): Promise<{ 
    success: boolean; 
    message: string; 
    data: { deletedCount: number } 
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await Notification.deleteMany({
        sentAt: { $lt: cutoffDate },
        isRead: true,
      });

      console.log(`Notificações antigas limpas: ${result.deletedCount} removidas`);

      return {
        success: true,
        message: 'Notificações antigas limpas com sucesso',
        data: { deletedCount: result.deletedCount }
      };
    } catch (error: any) {
      console.error(`Erro ao limpar notificações antigas: ${error.message}`);
      throw error;
    }
  }
}