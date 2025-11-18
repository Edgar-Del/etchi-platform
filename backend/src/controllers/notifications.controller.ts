import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { NotificationsService } from '../services/notifications.service';
import { NotificationPriority, NotificationType } from '../models/Notification.model';

export class NotificationsController extends BaseController {
  private notificationsService: NotificationsService;

  constructor() {
    super();
    this.notificationsService = new NotificationsService();
  }

  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const { read, type, limit, page } = req.query;

      const result = await this.notificationsService.getNotifications(currentUser.id, {
        isRead: read !== undefined ? read === 'true' : undefined,
        type: type as NotificationType,
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined,
      });

      this.successResponse(res, result.data, 'Notificações obtidas com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  sendNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, title, message, type, priority, relatedEntityId, relatedEntityType, actions, data } = req.body;

      const result = await this.notificationsService.sendNotification(
        userId,
        title,
        message,
        {
          type: type as NotificationType,
          priority: priority ? (priority as NotificationPriority) : undefined,
          relatedEntityId,
          relatedEntityType,
          actions,
          data,
        }
      );

      this.successResponse(res, result.data, 'Notificação enviada com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.notificationsService.markAsRead(id);
      this.successResponse(res, result.data, 'Notificação marcada como lida');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.notificationsService.removeNotification(id);
      this.successResponse(res, null, 'Notificação removida com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}

