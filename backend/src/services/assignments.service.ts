// src/services/assignments.service.ts
import mongoose from 'mongoose';
import { DeliveryAssignment, IDeliveryAssignment, AssignmentStatus } from '../models/DeliveryAssignment.model';
import { DeliveriesService } from './deliveries.service';
import { UsersService } from './users.service';
import { NotificationsService } from './notifications.service';

export interface CreateAssignmentDto {
  deliveryRequestId: string;
  deliveryPartnerId: string;
}

export interface UpdateAssignmentStatusDto {
  status: AssignmentStatus;
  location?: { lat: number; lng: number };
  notes?: string;
}

export class AssignmentsService {
  private deliveriesService: DeliveriesService;
  private usersService: UsersService;
  private notificationsService: NotificationsService;

  constructor() {
    this.deliveriesService = new DeliveriesService();
    this.usersService = new UsersService();
    this.notificationsService = new NotificationsService();
  }

  /**
   * Cria uma nova atribuição de entrega
   */
  async createAssignment(createAssignmentDto: CreateAssignmentDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryAssignment 
  }> {
    try {
      const { deliveryRequestId, deliveryPartnerId } = createAssignmentDto;

      // Verificar se a entrega existe
      const deliveryResult = await this.deliveriesService.trackDelivery(deliveryRequestId);
      const delivery = deliveryResult.data.delivery;

      if (!delivery) {
        throw new Error('Entrega não encontrada');
      }

      // Verificar se o entregador existe e está disponível
      const courierResult = await this.usersService.findById(deliveryPartnerId);
      const courier = courierResult.data;

      if (!courier || !courier._id) {
        throw new Error('Entregador não encontrado');
      }

      if (courier.userType !== 'delivery_partner') {
        throw new Error('Usuário não é um entregador');
      }

      if (!courier.travelerProfile?.isAvailable) {
        throw new Error('Entregador não está disponível');
      }

      // Verificar se já existe atribuição para esta entrega
      const existingAssignment = await DeliveryAssignment.findOne({
        deliveryRequestId: delivery._id,
      });

      if (existingAssignment) {
        throw new Error('Esta entrega já foi atribuída');
      }

      // Calcular métricas
      const metrics = await this.calculateAssignmentMetrics(delivery, courier);

      const assignmentData: Partial<IDeliveryAssignment> = {
        deliveryRequestId: delivery._id,
        deliveryPartnerId: new mongoose.Types.ObjectId(courier._id.toString()),
        status: AssignmentStatus.ASSIGNED,
        locations: {
          pickup: {
            type: 'Point',
            coordinates: [delivery.pickupAddress.longitude, delivery.pickupAddress.latitude],
          },
          destination: {
            type: 'Point',
            coordinates: [delivery.deliveryAddress.longitude, delivery.deliveryAddress.latitude],
          },
        },
        metrics,
        offeredAmount: delivery.pricing.totalAmount * 0.7, // 70% para o entregador
        acceptedAmount: delivery.pricing.totalAmount * 0.7,
        assignedAt: new Date(),
      };

      const assignment = await DeliveryAssignment.create(assignmentData);

      // Atualizar status da entrega
      await this.deliveriesService.updateStatus(
        delivery._id.toString(),
        { status: 'assigned' as any }
      );

      // Atualizar disponibilidade do entregador
      await this.usersService.updateCourierAvailability(
        deliveryPartnerId,
        false
      );

      // Notificar cliente e entregador
      await Promise.all([
        this.notificationsService.sendNotification(
          delivery.customerId.toString(),
          'Entregador a caminho',
          `Seu pedido foi aceite por ${courier.name}`
        ),
        this.notificationsService.sendNotification(
          deliveryPartnerId,
          'Entrega atribuída',
          `Você foi atribuído à entrega ${delivery.trackingCode}`
        ),
      ]);

      console.log(`Atribuição criada para entrega: ${deliveryRequestId}`);

      return {
        success: true,
        message: 'Atribuição criada com sucesso',
        data: assignment
      };
    } catch (error: any) {
      console.error(`Erro ao criar atribuição: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atribui uma entrega ao entregador mais próximo
   */
  async assignToNearestCourier(deliveryId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryAssignment 
  }> {
    try {
      // Usar o método assignCourier do DeliveriesService
      const deliveryResult = await this.deliveriesService.assignCourier(deliveryId);
      const delivery = deliveryResult.data;

      // Criar atribuição
      const assignmentData = {
        deliveryRequestId: deliveryId,
        deliveryPartnerId: delivery.deliveryPartnerId?.toString() || '',
      };

      const assignmentResult = await this.createAssignment(assignmentData);
      
      return {
        success: true,
        message: 'Entrega atribuída ao entregador mais próximo',
        data: assignmentResult.data
      };
    } catch (error: any) {
      console.error(`Erro ao atribuir entrega ${deliveryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma atribuição
   */
  async updateStatus(id: string, updateStatusDto: UpdateAssignmentStatusDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryAssignment 
  }> {
    return this.updateAssignmentStatus(id, updateStatusDto);
  }

  /**
   * Encontra atribuições por entregador
   */
  async findByCourier(courierId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryAssignment[] 
  }> {
    return this.getAssignmentsByCourier(courierId);
  }

  /**
   * Encontra atribuição por entrega
   */
  async findByDelivery(deliveryId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryAssignment | null 
  }> {
    try {
      const assignment = await DeliveryAssignment.findOne({ deliveryRequestId: deliveryId })
        .populate('deliveryRequestId')
        .populate('deliveryPartnerId');

      return {
        success: true,
        message: assignment ? 'Atribuição encontrada' : 'Nenhuma atribuição encontrada',
        data: assignment
      };
    } catch (error: any) {
      console.error(`Erro ao buscar atribuição da entrega ${deliveryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma atribuição
   */
  async updateAssignmentStatus(
    id: string, 
    updateStatusDto: UpdateAssignmentStatusDto
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryAssignment 
  }> {
    try {
      const { status, location, notes } = updateStatusDto;

      const assignment = await DeliveryAssignment.findById(id)
        .populate('deliveryRequestId')
        .populate('deliveryPartnerId');
      
      if (!assignment) {
        throw new Error('Atribuição não encontrada');
      }

      // Validar transição de status
      this.validateAssignmentStatusTransition(assignment.status, status);

      // Atualizar status
      assignment.status = status;

      // Atualizar timestamps específicos
      switch (status) {
        case AssignmentStatus.ACCEPTED:
          assignment.acceptedAt = new Date();
          break;
        case AssignmentStatus.IN_PROGRESS:
          assignment.startedAt = new Date();
          break;
        case AssignmentStatus.COMPLETED:
          assignment.completedAt = new Date();
          // Calcular duração real
          if (assignment.startedAt) {
            assignment.metrics.actualDuration = Math.round(
              (assignment.completedAt.getTime() - assignment.startedAt.getTime()) / 60000
            );
          }
          break;
        case AssignmentStatus.CANCELLED:
          assignment.cancelledAt = new Date();
          assignment.cancellationReason = notes;
          break;
        case AssignmentStatus.FAILED:
          assignment.failureReason = notes;
          break;
      }

      // Atualizar localização atual se fornecida
      if (location) {
        assignment.locations.current = {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        };
      }

      const updatedAssignment = await assignment.save();

      // Sincronizar com status da entrega
      await this.syncWithDeliveryStatus(updatedAssignment);

      // Notificar sobre mudança de status
      await this.notifyStatusUpdate(updatedAssignment);

      console.log(`Status da atribuição ${id} atualizado para: ${status}`);

      return {
        success: true,
        message: 'Status da atribuição atualizado com sucesso',
        data: updatedAssignment
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar status da atribuição ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém todas as atribuições de um entregador
   */
  async getAssignmentsByCourier(
    courierId: string, 
    filters?: { status?: AssignmentStatus; date?: string }
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryAssignment[] 
  }> {
    try {
      const query: any = { deliveryPartnerId: courierId };

      if (filters?.status) {
        query.status = filters.status;
      }

      if (filters?.date) {
        const startDate = new Date(filters.date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        query.assignedAt = {
          $gte: startDate,
          $lt: endDate,
        };
      }

      const assignments = await DeliveryAssignment.find(query)
        .populate('deliveryRequestId')
        .sort({ assignedAt: -1 })
        .exec();

      return {
        success: true,
        message: 'Atribuições encontradas com sucesso',
        data: assignments
      };
    } catch (error: any) {
      console.error(`Erro ao buscar atribuições do entregador ${courierId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de desempenho do entregador
   */
  async getCourierPerformance(courierId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      const stats = await DeliveryAssignment.aggregate([
        {
          $match: {
            deliveryPartnerId: courierId as any,
            status: AssignmentStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: null,
            totalAssignments: { $sum: 1 },
            totalEarnings: { $sum: '$acceptedAmount' },
            averageRating: { $avg: '$ratingToPartner' },
            averageDuration: { $avg: '$metrics.actualDuration' },
            onTimeDeliveries: {
              $sum: {
                $cond: [
                  { $lte: ['$completedAt', '$metrics.estimatedDuration'] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const performance = stats[0] || {
        totalAssignments: 0,
        totalEarnings: 0,
        averageRating: 0,
        averageDuration: 0,
        onTimeDeliveries: 0,
      };

      performance.onTimeRate = performance.totalAssignments > 0 
        ? (performance.onTimeDeliveries / performance.totalAssignments) * 100 
        : 0;

      return {
        success: true,
        message: 'Estatísticas de desempenho obtidas com sucesso',
        data: performance
      };
    } catch (error: any) {
      console.error(`Erro ao buscar desempenho do entregador ${courierId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula métricas para a atribuição
   */
  private async calculateAssignmentMetrics(delivery: any, courier: any): Promise<any> {
    // Usar distância e duração da entrega como base
    return {
      distance: delivery.estimatedDistance,
      estimatedDuration: delivery.estimatedDuration,
    };
  }

  /**
   * Valida transição de status da atribuição
   */
  private validateAssignmentStatusTransition(currentStatus: AssignmentStatus, newStatus: AssignmentStatus): void {
    const validTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
      [AssignmentStatus.ASSIGNED]: [AssignmentStatus.ACCEPTED, AssignmentStatus.DECLINED],
      [AssignmentStatus.ACCEPTED]: [AssignmentStatus.IN_PROGRESS, AssignmentStatus.CANCELLED],
      [AssignmentStatus.IN_PROGRESS]: [AssignmentStatus.COMPLETED, AssignmentStatus.FAILED],
      [AssignmentStatus.COMPLETED]: [],
      [AssignmentStatus.DECLINED]: [],
      [AssignmentStatus.CANCELLED]: [],
      [AssignmentStatus.FAILED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Transição de status inválida: ${currentStatus} -> ${newStatus}`);
    }
  }

  /**
   * Sincroniza status da atribuição com status da entrega
   */
  private async syncWithDeliveryStatus(assignment: IDeliveryAssignment): Promise<void> {
    const statusMap: Record<AssignmentStatus, string | undefined> = {
      [AssignmentStatus.ASSIGNED]: 'assigned',
      [AssignmentStatus.ACCEPTED]: 'accepted',
      [AssignmentStatus.IN_PROGRESS]: 'in_transit',
      [AssignmentStatus.COMPLETED]: 'delivered',
      [AssignmentStatus.CANCELLED]: 'cancelled',
      [AssignmentStatus.FAILED]: 'failed',
      [AssignmentStatus.DECLINED]: 'declined'
    };

    if (statusMap[assignment.status]) {
      await this.deliveriesService.updateStatus(
        assignment.deliveryRequestId.toString(),
        { status: statusMap[assignment.status] as any }
      );
    }

    // Liberar entregador se cancelado ou falhado
    if ([AssignmentStatus.CANCELLED, AssignmentStatus.FAILED].includes(assignment.status)) {
      await this.usersService.updateCourierAvailability(
        assignment.deliveryPartnerId.toString(),
        true
      );
    }
  }

  /**
   * Notifica sobre mudança de status
   */
  private async notifyStatusUpdate(assignment: IDeliveryAssignment): Promise<void> {
    const statusMessages: Record<AssignmentStatus, string> = {
      [AssignmentStatus.ASSIGNED]: 'foi atribuído à entrega',
      [AssignmentStatus.ACCEPTED]: 'aceitou a entrega',
      [AssignmentStatus.IN_PROGRESS]: 'está a caminho da recolha',
      [AssignmentStatus.COMPLETED]: 'concluiu a entrega',
      [AssignmentStatus.CANCELLED]: 'cancelou a entrega',
      [AssignmentStatus.FAILED]: 'teve uma falha na entrega',
      [AssignmentStatus.DECLINED]: 'recusou a entrega'
    };

    if (statusMessages[assignment.status]) {
      await this.notificationsService.sendNotification(
        (assignment.deliveryRequestId as any).customerId.toString(),
        'Atualização da entrega',
        `O entregador ${statusMessages[assignment.status]}`
      );
    }
  }
}