// src/controllers/deliveries.controller.ts
import { Request, Response } from 'express';
import { DeliveriesService } from '../services/deliveries.service';
import { BaseController } from './base.controller';

export class DeliveriesController extends BaseController {
  private deliveriesService: DeliveriesService;

  constructor() {
    super();
    this.deliveriesService = new DeliveriesService();
  }

  createDelivery = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      
      if (currentUser.role !== 'CLIENT') {
        this.errorResponse(res, 'Apenas clientes podem criar entregas', 403);
        return;
      }
      
      const deliveryData = {
        ...req.body,
        clientId: currentUser.id
      };
      
      const deliveryResult = await this.deliveriesService.create(deliveryData);
      this.successResponse(res, deliveryResult.data, 'Pedido de entrega criado com sucesso', 201);
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getDeliveries = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const query = { ...req.query };
      
      // Para não-admins, restringir acesso apenas às próprias entregas
      if (currentUser.role !== 'ADMIN') {
        if (currentUser.role === 'CLIENT') {
          query.clientId = currentUser.id;
        } else if (currentUser.role === 'COURIER') {
          query.courierId = currentUser.id;
        }
      }
      
      const deliveriesResult = await this.deliveriesService.findAll(query);
      this.successResponse(res, deliveriesResult.data, 'Entregas listadas com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getMyDeliveries = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const deliveriesResult = await this.deliveriesService.findByUser(currentUser.id, currentUser.role);
      this.successResponse(res, deliveriesResult.data, 'Minhas entregas listadas com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getDelivery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const deliveryResult = await this.deliveriesService.findById(id);
      const delivery = deliveryResult.data;
      
      // Verificar se o usuário tem acesso a esta entrega
      if (currentUser.role !== 'ADMIN' && 
          delivery.customerId.toString() !== currentUser.id && 
          delivery.deliveryPartnerId?.toString() !== currentUser.id) {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      this.successResponse(res, delivery, 'Entrega obtida com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 404);
    }
  };

  updateDeliveryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      if (currentUser.role !== 'COURIER' && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Apenas estafetas podem atualizar status', 403);
        return;
      }
      
      const deliveryResult = await this.deliveriesService.updateStatus(id, req.body);
      this.successResponse(res, deliveryResult.data, 'Status atualizado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  cancelDelivery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const deliveryResult = await this.deliveriesService.cancel(id, currentUser.id);
      this.successResponse(res, deliveryResult.data, 'Entrega cancelada com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  trackDelivery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const deliveryResult = await this.deliveriesService.findById(id);
      const delivery = deliveryResult.data;
      
      if (currentUser.role !== 'ADMIN' && 
          delivery.customerId.toString() !== currentUser.id && 
          delivery.deliveryPartnerId?.toString() !== currentUser.id) {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      const trackingResult = await this.deliveriesService.track(id);
      this.successResponse(res, trackingResult.data, 'Localização obtida com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  assignCourier = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const assignmentResult = await this.deliveriesService.assignCourier(id);
      this.successResponse(res, assignmentResult.data, 'Entregador atribuído com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}