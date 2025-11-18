// src/controllers/analytics.controller.ts
import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController extends BaseController {
  private analyticsService: AnalyticsService;

  constructor() {
    super();
    this.analyticsService = new AnalyticsService();
  }

  getOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      
      // Se houver filtros de data, usar getDailyMetrics, senão usar getOverview
      const result = startDate || endDate
        ? await this.analyticsService.getDailyMetrics(startDate as string || new Date().toISOString().split('T')[0])
        : await this.analyticsService.getOverview();
      
      this.successResponse(res, result.data, result.message);
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getCouriersPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period, courierId } = req.query;
      
      // Se houver courierId, buscar performance de um entregador específico
      if (courierId) {
        const result = await this.analyticsService.getCourierPerformance(courierId as string);
        this.successResponse(res, result.data, result.message);
        return;
      }
      
      // Caso contrário, retornar overview geral (pode ser expandido para lista de todos)
      const result = await this.analyticsService.getOverview();
      this.successResponse(res, result.data, 'Desempenho geral obtido com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getDeliveryStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period } = req.query;
      const result = await this.analyticsService.getDeliveryStats(period as string);
      this.successResponse(res, result.data, result.message);
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getRevenueData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const result = await this.analyticsService.getRevenueData(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      this.successResponse(res, result.data, result.message);
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}

