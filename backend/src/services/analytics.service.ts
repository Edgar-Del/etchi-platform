// src/services/analytics.service.ts
import NodeCache from 'node-cache';
import { AnalyticsLog, IAnalyticsLog, AnalyticsEventType } from '../models/AnalyticsLog.model';
import { DeliveryRequest, DeliveryStatus } from '../models/DeliveryRequest.model';
import { User, UserType } from '../models/User.model';
import { Transaction, TransactionStatus, TransactionType } from '../models/Transaction.model';
import { Review } from '../models/Review.model';

export class AnalyticsService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutos cache
  }

  /**
   * Obtém visão geral das métricas do sistema
   */
  async getOverview(): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      const cacheKey = 'analytics:overview';
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return {
          success: true,
          message: 'Dados de visão geral obtidos do cache',
          data: cached
        };
      }

      const [
        deliveryStats,
        userStats,
        revenueStats,
        performanceStats,
      ] = await Promise.all([
        this.getDeliveryStatsInternal(),
        this.getUserStats(),
        this.getRevenueStats(),
        this.getPerformanceStats(),
      ]);

      const overview = {
        deliveries: deliveryStats,
        users: userStats,
        revenue: revenueStats,
        performance: performanceStats,
        timestamp: new Date(),
      };

      this.cache.set(cacheKey, overview);

      return {
        success: true,
        message: 'Visão geral analítica obtida com sucesso',
        data: overview
      };
    } catch (error: any) {
      console.error(`Erro ao obter visão geral: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém métricas diárias
   */
  async getDailyMetrics(date: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const cacheKey = `analytics:daily:${date}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return {
          success: true,
          message: 'Métricas diárias obtidas do cache',
          data: cached
        };
      }

      const [
        deliveries,
        newUsers,
        transactions,
        deliveryTimes,
      ] = await Promise.all([
        // Entregas do dia
        DeliveryRequest.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lt: endDate },
            },
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),

        // Novos usuários
        User.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate },
        }),

        // Transações do dia
        Transaction.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lt: endDate },
              status: TransactionStatus.COMPLETED,
            },
          },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
            },
          },
        ]),

        // Tempos médios de entrega
        this.getAverageDeliveryTimes(startDate, endDate),
      ]);

      const metrics = {
        date,
        deliveries: this.formatDeliveryStats(deliveries),
        newUsers,
        transactions: this.formatTransactionStats(transactions),
        deliveryTimes,
        totalRevenue: transactions.reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0),
      };

      this.cache.set(cacheKey, metrics, 3600); // 1 hora cache

      return {
        success: true,
        message: 'Métricas diárias obtidas com sucesso',
        data: metrics
      };
    } catch (error: any) {
      console.error(`Erro ao obter métricas diárias para ${date}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém desempenho de um entregador
   */
  async getCourierPerformance(courierId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      const cacheKey = `analytics:courier:${courierId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return {
          success: true,
          message: 'Desempenho do entregador obtido do cache',
          data: cached
        };
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        deliveryStats,
        ratingStats,
        earningsStats,
        timelineStats,
      ] = await Promise.all([
        // Estatísticas de entregas
        DeliveryRequest.aggregate([
          {
            $match: {
              deliveryPartnerId: courierId as any,
              createdAt: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              avgDistance: { $avg: '$estimatedDistance' },
              avgDuration: { $avg: '$estimatedDuration' },
            },
          },
        ]),

        // Estatísticas de rating
        this.getCourierRatingStats(courierId),

        // Estatísticas de ganhos
        Transaction.aggregate([
          {
            $match: {
              deliveryPartnerId: courierId as any,
              status: TransactionStatus.COMPLETED,
              type: TransactionType.PARTNER_PAYOUT,
              createdAt: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
              dailyEarnings: { $sum: '$partnerEarnings' },
              deliveryCount: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]),

        // Estatísticas de timeline
        this.getCourierTimelineStats(courierId, thirtyDaysAgo),
      ]);

      const performance = {
        deliveryStats: this.formatCourierDeliveryStats(deliveryStats),
        ratingStats,
        earningsStats,
        timelineStats,
        overallScore: this.calculateOverallScore(deliveryStats, ratingStats),
      };

      this.cache.set(cacheKey, performance, 900); // 15 minutos cache

      return {
        success: true,
        message: 'Desempenho do entregador obtido com sucesso',
        data: performance
      };
    } catch (error: any) {
      console.error(`Erro ao obter desempenho do entregador ${courierId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra evento analítico
   */
  async trackEvent(
    eventType: AnalyticsEventType,
    eventName: string,
    eventData: any,
    sessionInfo: any
  ): Promise<void> {
    try {
      await AnalyticsLog.create({
        eventType,
        eventName,
        eventData,
        sessionInfo,
        deviceInfo: sessionInfo.deviceInfo || {},
        status: 'success',
        createdAt: new Date(),
      });
    } catch (error: any) {
      console.error(`Erro ao registrar evento analítico: ${error.message}`);
    }
  }

  /**
   * Registra registro de usuário
   */
  async trackUserRegistration(user: any): Promise<void> {
    await this.trackEvent(
      AnalyticsEventType.USER_BEHAVIOR,
      'user_registered',
      {
        userId: user._id,
        userType: user.userType,
        registrationSource: 'app',
      },
      {
        sessionId: `reg_${user._id}`,
        platform: 'app',
        appVersion: '1.0.0',
      }
    );
  }

  /**
   * Registra login de usuário
   */
  async trackUserLogin(user: any): Promise<void> {
    await this.trackEvent(
      AnalyticsEventType.USER_BEHAVIOR,
      'user_login',
      {
        userId: user._id,
        userType: user.userType,
      },
      {
        sessionId: `login_${user._id}_${Date.now()}`,
        platform: 'app',
        appVersion: '1.0.0',
      }
    );
  }

  /**
   * Registra criação de entrega
   */
  async trackDeliveryCreated(delivery: any): Promise<void> {
    await this.trackEvent(
      AnalyticsEventType.DELIVERY,
      'delivery_created',
      {
        deliveryId: delivery._id,
        trackingCode: delivery.trackingCode,
        customerId: delivery.customerId,
        deliveryType: delivery.deliveryType,
        packageSize: delivery.package.size,
        totalAmount: delivery.pricing.totalAmount,
      },
      {
        sessionId: `delivery_${delivery._id}`,
        platform: 'app',
        appVersion: '1.0.0',
      }
    );
  }

  /**
   * Registra processamento de pagamento
   */
  async trackPaymentProcessed(transaction: any): Promise<void> {
    await this.trackEvent(
      AnalyticsEventType.PAYMENT,
      'payment_processed',
      {
        transactionId: transaction._id,
        reference: transaction.reference,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
      },
      {
        sessionId: `payment_${transaction._id}`,
        platform: 'app',
        appVersion: '1.0.0',
      }
    );
  }

  /**
   * Obtém estatísticas de entregas (método público)
   */
  async getDeliveryStats(period?: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      const stats = await this.getDeliveryStatsInternal();
      return {
        success: true,
        message: 'Estatísticas de entregas obtidas com sucesso',
        data: stats
      };
    } catch (error: any) {
      console.error(`Erro ao obter estatísticas de entregas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de entregas (método privado)
   */
  private async getDeliveryStatsInternal(): Promise<any> {
    const stats = await DeliveryRequest.aggregate([
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          dailyDeliveries: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $limit: 7 },
          ],
          averageMetrics: [
            {
              $match: {
                status: DeliveryStatus.DELIVERED,
              },
            },
            {
              $group: {
                _id: null,
                avgDistance: { $avg: '$estimatedDistance' },
                avgDuration: { $avg: '$estimatedDuration' },
                avgCost: { $avg: '$pricing.totalAmount' },
              },
            },
          ],
        },
      },
    ]);

    return this.formatDeliveryAggregateStats(stats[0]);
  }

  /**
   * Obtém estatísticas de usuários
   */
  private async getUserStats(): Promise<any> {
    const stats = await User.aggregate([
      {
        $facet: {
          userTypes: [
            {
              $group: {
                _id: '$userType',
                count: { $sum: 1 },
              },
            },
          ],
          newUsers: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $limit: 30 },
          ],
          activeUsers: [
            {
              $match: {
                lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              },
            },
            {
              $group: {
                _id: '$userType',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    return this.formatUserAggregateStats(stats[0]);
  }

  /**
   * Obtém dados de receita (método público)
   */
  async getRevenueData(startDate?: Date, endDate?: Date): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      const stats = await this.getRevenueStats();
      return {
        success: true,
        message: 'Dados de receita obtidos com sucesso',
        data: stats
      };
    } catch (error: any) {
      console.error(`Erro ao obter dados de receita: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de receita (método privado)
   */
  private async getRevenueStats(): Promise<any> {
    const stats = await Transaction.aggregate([
      {
        $match: {
          status: TransactionStatus.COMPLETED,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $facet: {
          dailyRevenue: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' },
                },
                revenue: { $sum: '$amount' },
                platformFees: { $sum: '$platformFee' },
                partnerPayouts: { $sum: '$partnerEarnings' },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $limit: 30 },
          ],
          revenueByType: [
            {
              $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    return this.formatRevenueAggregateStats(stats[0]);
  }

  /**
   * Obtém estatísticas de performance
   */
  private async getPerformanceStats(): Promise<any> {
    const deliveryTimes = await this.getAverageDeliveryTimes(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      new Date()
    );

    const completionRate = await DeliveryRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', DeliveryStatus.DELIVERED] }, 1, 0],
            },
          },
        },
      },
    ]);

    const rate = completionRate[0] 
      ? (completionRate[0].completed / completionRate[0].total) * 100 
      : 0;

    return {
      averageDeliveryTimes: deliveryTimes,
      completionRate: Math.round(rate * 100) / 100,
    };
  }

  /**
   * Métodos auxiliares para formatação de dados
   */
  private formatDeliveryStats(deliveries: any[]): any {
    const stats: any = {};
    deliveries.forEach((item: any) => {
      stats[item._id] = item.count;
    });
    return stats;
  }

  private formatTransactionStats(transactions: any[]): any {
    const stats: any = {};
    transactions.forEach((item: any) => {
      stats[item._id] = {
        count: item.count,
        total: item.totalAmount,
      };
    });
    return stats;
  }

  private formatDeliveryAggregateStats(stats: any): any {
    return stats;
  }

  private formatUserAggregateStats(stats: any): any {
    return stats;
  }

  private formatRevenueAggregateStats(stats: any): any {
    return stats;
  }

  private formatCourierDeliveryStats(stats: any[]): any {
    return stats;
  }

  /**
   * Obtém tempos médios de entrega
   */
  private async getAverageDeliveryTimes(startDate: Date, endDate: Date): Promise<any> {
    const result = await DeliveryRequest.aggregate([
      {
        $match: {
          status: DeliveryStatus.DELIVERED,
          deliveredAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $project: {
          deliveryTime: {
            $divide: [
              { $subtract: ['$deliveredAt', '$pickedUpAt'] },
              60000,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$deliveryTime' },
          minTime: { $min: '$deliveryTime' },
          maxTime: { $max: '$deliveryTime' },
        },
      },
    ]);

    return result[0] || { averageTime: 0, minTime: 0, maxTime: 0 };
  }

  /**
   * Obtém estatísticas de rating do entregador
   */
  private async getCourierRatingStats(courierId: string): Promise<any> {
    const result = await Review.aggregate([
      {
        $match: {
          deliveryPartnerId: courierId as any,
          reviewType: 'customer_to_partner',
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating',
          },
        },
      },
    ]);

    return result[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: [] };
  }

  /**
   * Obtém estatísticas de timeline do entregador
   */
  private async getCourierTimelineStats(courierId: string, startDate: Date): Promise<any> {
    const result = await DeliveryRequest.aggregate([
      {
        $match: {
          deliveryPartnerId: courierId as any,
          status: DeliveryStatus.DELIVERED,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result;
  }

  /**
   * Calcula score geral do entregador
   */
  private calculateOverallScore(deliveryStats: any[], ratingStats: any): number {
    const completedDeliveries = deliveryStats.find((s: any) => s._id === DeliveryStatus.DELIVERED)?.count || 0;
    const totalDeliveries = deliveryStats.reduce((sum: number, s: any) => sum + s.count, 0);
    
    const completionRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;
    const ratingScore = (ratingStats.averageRating || 0) * 20;

    return Math.round((completionRate * 0.6) + (ratingScore * 0.4));
  }
}