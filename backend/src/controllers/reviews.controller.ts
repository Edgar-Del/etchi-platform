// src/controllers/reviews.controller.ts
import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { ReviewsService, CreateReviewDto } from '../services/reviews.service';
import { ReviewType } from '../models/Review.model';
import { DeliveriesService } from '../services/deliveries.service';

export class ReviewsController extends BaseController {
  private reviewsService: ReviewsService;
  private deliveriesService: DeliveriesService;

  constructor() {
    super();
    this.reviewsService = new ReviewsService();
    this.deliveriesService = new DeliveriesService();
  }

  createReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const { deliveryId, rating, comment } = req.body;

      // Buscar a entrega para obter o deliveryPartnerId
      const deliveryResult = await this.deliveriesService.findById(deliveryId);
      const delivery = deliveryResult.data;

      if (!delivery) {
        this.errorResponse(res, 'Entrega não encontrada', 404);
        return;
      }

      // Verificar se o usuário é o cliente da entrega
      if (delivery.customerId.toString() !== currentUser.id) {
        this.errorResponse(res, 'Apenas o cliente pode avaliar esta entrega', 403);
        return;
      }

      // Verificar se há um entregador atribuído
      if (!delivery.deliveryPartnerId) {
        this.errorResponse(res, 'Entrega não tem entregador atribuído', 400);
        return;
      }

      // Obter o ID do entregador (pode ser um objeto populado ou um ObjectId)
      const courierId = typeof delivery.deliveryPartnerId === 'object' && delivery.deliveryPartnerId._id
        ? delivery.deliveryPartnerId._id.toString()
        : delivery.deliveryPartnerId.toString();

      const createReviewDto: CreateReviewDto = {
        deliveryRequestId: deliveryId,
        reviewerId: currentUser.id,
        revieweeId: courierId,
        reviewType: ReviewType.CUSTOMER_TO_PARTNER,
        rating,
        comment,
      };

      const result = await this.reviewsService.createReview(createReviewDto);
      this.successResponse(res, result.data, 'Avaliação criada com sucesso', 201);
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getCourierReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { minRating, withComments, limit, page } = req.query;

      const result = await this.reviewsService.getReviewsByCourier(id, {
        minRating: minRating ? Number(minRating) : undefined,
        withComments: withComments === 'true',
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined,
      });

      this.successResponse(res, result.data, 'Avaliações obtidas com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getAverageRating = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const averageRating = await this.reviewsService.getAverageRating(id);
      
      this.successResponse(res, { 
        courierId: id, 
        averageRating 
      }, 'Média de classificação obtida com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}

