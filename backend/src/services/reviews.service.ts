// src/services/reviews.service.ts
import { Review, IReview, ReviewType } from '../models/Review.model';
import { UsersService } from './users.service';
import { DeliveriesService } from './deliveries.service';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '../models/Notification.model';

export interface CreateReviewDto {
  deliveryRequestId: string;
  reviewerId: string;
  revieweeId: string;
  reviewType: ReviewType;
  rating: number;
  comment?: string;
  aspectRatings?: any;
}

export class ReviewsService {
  private usersService: UsersService;
  private deliveriesService: DeliveriesService;
  private notificationsService: NotificationsService;

  constructor() {
    this.usersService = new UsersService();
    this.deliveriesService = new DeliveriesService();
    this.notificationsService = new NotificationsService();
  }

  /**
   * Cria uma nova avaliação
   */
  async createReview(createReviewDto: CreateReviewDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: IReview 
  }> {
    try {
      const { deliveryRequestId, reviewerId, revieweeId, reviewType, rating, comment, aspectRatings } = createReviewDto;

      // Validar entrega
      const deliveryResult = await this.deliveriesService.trackDelivery(deliveryRequestId);
      const delivery = deliveryResult.data.delivery;

      if (!delivery) {
        throw new Error('Entrega não encontrada');
      }

      // Validar participantes
      await this.validateReviewParticipants(delivery, reviewerId, revieweeId, reviewType);

      // Verificar se já existe avaliação para esta entrega e tipo
      const existingReview = await Review.findOne({
        deliveryRequestId: delivery._id,
        reviewType,
      });

      if (existingReview) {
        throw new Error('Já existe uma avaliação para esta entrega');
      }

      // Validar rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating deve ser entre 1 e 5');
      }

      const reviewData: Partial<IReview> = {
        deliveryRequestId: delivery._id,
        customerId: reviewType === ReviewType.CUSTOMER_TO_PARTNER 
          ? reviewerId as any
          : revieweeId as any,
        deliveryPartnerId: reviewType === ReviewType.CUSTOMER_TO_PARTNER
          ? revieweeId as any
          : reviewerId as any,
        reviewType,
        rating,
        comment,
        aspectRatings: aspectRatings || {},
        tags: this.generateTagsFromRating(rating, comment),
        isVerified: true,
        isPublic: true,
      };

      const review = await Review.create(reviewData);

      // Atualizar rating médio do usuário avaliado
      await this.updateUserRating(revieweeId, reviewType);

      // Notificar usuário avaliado
      await this.notifyUserAboutReview(review);

      console.log(`Nova avaliação criada para entrega: ${deliveryRequestId}`);

      return {
        success: true,
        message: 'Avaliação criada com sucesso',
        data: review
      };
    } catch (error: any) {
      console.error(`Erro ao criar avaliação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém avaliações de um entregador
   */
  async getReviewsByCourier(
    courierId: string,
    filters?: { 
      minRating?: number;
      withComments?: boolean;
      limit?: number;
      page?: number;
    }
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: { reviews: IReview[]; total: number; averageRating: number } 
  }> {
    try {
      const query: any = { 
        deliveryPartnerId: courierId,
        reviewType: ReviewType.CUSTOMER_TO_PARTNER,
        isPublic: true,
      };

      if (filters?.minRating) {
        query.rating = { $gte: filters.minRating };
      }

      if (filters?.withComments) {
        query.comment = { $exists: true, $ne: '' };
      }

      const limit = filters?.limit || 10;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const [reviews, total, averageRating] = await Promise.all([
        Review.find(query)
          .populate('customerId', 'name profilePhoto')
          .populate('deliveryRequestId', 'trackingCode package')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        Review.countDocuments(query),
        this.getAverageRating(courierId),
      ]);

      return {
        success: true,
        message: 'Avaliações encontradas com sucesso',
        data: { reviews, total, averageRating }
      };
    } catch (error: any) {
      console.error(`Erro ao buscar avaliações do entregador ${courierId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula rating médio de um entregador
   */
  async getAverageRating(courierId: string): Promise<number> {
    try {
      const result = await Review.aggregate([
        {
          $match: {
            deliveryPartnerId: courierId as any,
            reviewType: ReviewType.CUSTOMER_TO_PARTNER,
            isPublic: true,
            rating: { $gte: 1, $lte: 5 },
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      if (result.length === 0) {
        return 0;
      }

      return Math.round(result[0].averageRating * 100) / 100;
    } catch (error: any) {
      console.error(`Erro ao calcular rating médio do entregador ${courierId}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Obtém estatísticas detalhadas de avaliações
   */
  async getRatingStats(courierId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      const stats = await Review.aggregate([
        {
          $match: {
            deliveryPartnerId: courierId as any,
            reviewType: ReviewType.CUSTOMER_TO_PARTNER,
            isPublic: true,
          },
        },
        {
          $facet: {
            ratingDistribution: [
              {
                $group: {
                  _id: '$rating',
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            aspectStats: [
              {
                $match: {
                  'aspectRatings.punctuality': { $exists: true },
                },
              },
              {
                $group: {
                  _id: null,
                  avgPunctuality: { $avg: '$aspectRatings.punctuality' },
                  avgCommunication: { $avg: '$aspectRatings.communication' },
                  avgCare: { $avg: '$aspectRatings.care' },
                  avgProfessionalism: { $avg: '$aspectRatings.professionalism' },
                },
              },
            ],
            tagStats: [
              { $unwind: '$tags' },
              {
                $group: {
                  _id: '$tags',
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            totalStats: [
              {
                $group: {
                  _id: null,
                  totalReviews: { $sum: 1 },
                  averageRating: { $avg: '$rating' },
                  withComments: {
                    $sum: {
                      $cond: [
                        { $and: [{ $ne: ['$comment', null] }, { $ne: ['$comment', ''] }] },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ]);

      const formattedStats = this.formatRatingStats(stats[0]);

      return {
        success: true,
        message: 'Estatísticas de avaliações obtidas',
        data: formattedStats
      };
    } catch (error: any) {
      console.error(`Erro ao obter estatísticas do entregador ${courierId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona resposta a uma avaliação
   */
  async addResponse(
    reviewId: string,
    responderId: string,
    comment: string
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: IReview 
  }> {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Avaliação não encontrada');
      }

      // Verificar se o respondente tem permissão
      const canRespond = await this.canUserRespondToReview(review, responderId);
      if (!canRespond) {
        throw new Error('Usuário não autorizado a responder esta avaliação');
      }

      // Verificar se já existe resposta
      if (review.responseId) {
        throw new Error('Esta avaliação já tem uma resposta');
      }

      // Criar resposta como nova review
      const responseReview = await Review.create({
        deliveryRequestId: review.deliveryRequestId,
        customerId: responderId as any,
        deliveryPartnerId: review.deliveryPartnerId,
        reviewType: review.reviewType === ReviewType.CUSTOMER_TO_PARTNER 
          ? ReviewType.PARTNER_TO_CUSTOMER 
          : ReviewType.CUSTOMER_TO_PARTNER,
        rating: 0,
        comment,
        isVerified: true,
        isPublic: true,
      });

      // Atualizar review original com referência à resposta
      review.responseId = responseReview._id;
      review.respondedAt = new Date();
      review.responseComment = comment;

      const updatedReview = await review.save();

      // Notificar autor original sobre a resposta
      await this.notifyAboutResponse(updatedReview, responseReview);

      console.log(`Resposta adicionada à avaliação ${reviewId}`);

      return {
        success: true,
        message: 'Resposta adicionada com sucesso',
        data: updatedReview
      };
    } catch (error: any) {
      console.error(`Erro ao adicionar resposta à avaliação ${reviewId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reporta uma avaliação inadequada
   */
  async reportReview(
    reviewId: string,
    reporterId: string,
    reason: string
  ): Promise<{ 
    success: boolean; 
    message: string; 
  }> {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Avaliação não encontrada');
      }

      // Marcar review para moderação
      review.isPublic = false;
      (review as any).metadata = {
        ...(review as any).metadata,
        reported: true,
        reporterId: reporterId as any,
        reportReason: reason,
        reportedAt: new Date(),
      };

      await review.save();

      // Notificar administradores sobre review reportada
      await this.notifyAdminsAboutReportedReview(review, reason);

      console.log(`Avaliação ${reviewId} reportada por ${reporterId}`);

      return {
        success: true,
        message: 'Avaliação reportada com sucesso e enviada para moderação'
      };
    } catch (error: any) {
      console.error(`Erro ao reportar avaliação ${reviewId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valida participantes da avaliação
   */
  private async validateReviewParticipants(
    delivery: any,
    reviewerId: string,
    revieweeId: string,
    reviewType: ReviewType
  ): Promise<void> {
    const isCustomerReview = reviewType === ReviewType.CUSTOMER_TO_PARTNER;
    
    const expectedReviewer = isCustomerReview ? delivery.customerId : delivery.deliveryPartnerId;
    const expectedReviewee = isCustomerReview ? delivery.deliveryPartnerId : delivery.customerId;

    if (!expectedReviewer || !expectedReviewee) {
      throw new Error('Entrega não tem ambos os participantes necessários para avaliação');
    }

    if (expectedReviewer.toString() !== reviewerId) {
      throw new Error('Usuário não autorizado a fazer esta avaliação');
    }

    if (expectedReviewee.toString() !== revieweeId) {
      throw new Error('Usuário alvo da avaliação não corresponde à entrega');
    }

    // Verificar se a entrega foi concluída
    if (delivery.status !== 'delivered') {
      throw new Error('Só é possível avaliar entregas concluídas');
    }
  }

  /**
   * Atualiza rating médio do usuário
   */
  private async updateUserRating(userId: string, reviewType: ReviewType): Promise<void> {
    try {
      if (reviewType === ReviewType.CUSTOMER_TO_PARTNER) {
        const averageRating = await this.getAverageRating(userId);
        
        // Atualizar rating no perfil do entregador
        await this.usersService.updateProfile(userId, {
          rating: averageRating,
        });
      }
    } catch (error: any) {
      console.error(`Erro ao atualizar rating do usuário ${userId}: ${error.message}`);
    }
  }

  /**
   * Gera tags baseadas no rating e comentário
   */
  private generateTagsFromRating(rating: number, comment?: string): string[] {
    const tags: string[] = [];

    // Tags baseadas no rating
    if (rating >= 4.5) {
      tags.push('excellent', 'highly_recommended');
    } else if (rating >= 4) {
      tags.push('very_good', 'recommended');
    } else if (rating >= 3) {
      tags.push('good', 'satisfactory');
    } else {
      tags.push('needs_improvement');
    }

    // Tags baseadas em palavras-chave no comentário
    if (comment) {
      const commentLower = comment.toLowerCase();
      
      if (commentLower.includes('pontual') || commentLower.includes('no tempo')) {
        tags.push('punctual');
      }
      if (commentLower.includes('educado') || commentLower.includes('simpático')) {
        tags.push('friendly');
      }
      if (commentLower.includes('cuidado') || commentLower.includes('cuidadoso')) {
        tags.push('careful');
      }
      if (commentLower.includes('profissional') || commentLower.includes('competente')) {
        tags.push('professional');
      }
      if (commentLower.includes('comunicação') || commentLower.includes('comunicativo')) {
        tags.push('communicative');
      }
    }

    return [...new Set(tags)];
  }

  /**
   * Formata estatísticas de rating
   */
  private formatRatingStats(stats: any): any {
    const ratingDistribution = Array(5).fill(0).map((_, index) => {
      const rating = index + 1;
      const distribution = stats.ratingDistribution.find((d: any) => d._id === rating);
      return {
        rating,
        count: distribution?.count || 0,
      };
    });

    const totalStats = stats.totalStats[0] || {
      totalReviews: 0,
      averageRating: 0,
      withComments: 0,
    };

    const aspectStats = stats.aspectStats[0] || {
      avgPunctuality: 0,
      avgCommunication: 0,
      avgCare: 0,
      avgProfessionalism: 0,
    };

    return {
      ...totalStats,
      ratingDistribution,
      aspectRatings: aspectStats,
      popularTags: stats.tagStats,
    };
  }

  /**
   * Verifica se usuário pode responder à avaliação
   */
  private async canUserRespondToReview(review: IReview, responderId: string): Promise<boolean> {
    if (review.reviewType === ReviewType.CUSTOMER_TO_PARTNER) {
      // Entregador respondendo à avaliação do cliente
      return review.deliveryPartnerId.toString() === responderId;
    } else {
      // Cliente respondendo à avaliação do entregador
      return review.customerId.toString() === responderId;
    }
  }

  /**
   * Notifica usuário sobre nova avaliação
   */
  private async notifyUserAboutReview(review: IReview): Promise<void> {
    const userId = review.reviewType === ReviewType.CUSTOMER_TO_PARTNER 
      ? review.deliveryPartnerId.toString()
      : review.customerId.toString();

    const message = review.reviewType === ReviewType.CUSTOMER_TO_PARTNER
      ? 'Você recebeu uma nova avaliação de um cliente'
      : 'Você recebeu uma nova avaliação de um entregador';

    await this.notificationsService.sendNotification(
      userId,
      'Nova Avaliação Recebida',
      message,
      {
        type: 'rating_reminder',
        relatedEntityId: review._id.toString(),
        relatedEntityType: 'Review',
      }
    );
  }

  /**
   * Notifica sobre resposta à avaliação
   */
  private async notifyAboutResponse(originalReview: IReview, responseReview: IReview): Promise<void> {
    const userId = originalReview.reviewType === ReviewType.CUSTOMER_TO_PARTNER
      ? originalReview.customerId.toString()
      : originalReview.deliveryPartnerId.toString();

    await this.notificationsService.sendNotification(
      userId,
      'Resposta à Sua Avaliação',
      'Sua avaliação recebeu uma resposta',
      {
        type: NotificationType.SUPPORT_RESPONSE,
        relatedEntityId: originalReview._id.toString(),
        relatedEntityType: 'Review',
      }
    );
  }

  /**
   * Notifica administradores sobre review reportada
   */
  private async notifyAdminsAboutReportedReview(review: IReview, reason: string): Promise<void> {
    console.log(`Review ${review._id} reportada: ${reason}`);
  }
}