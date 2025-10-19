// src/controllers/assignments.controller.ts
import { Request, Response } from 'express';
import { AssignmentsService } from '../services/assignments.service';
import { BaseController } from './base.controller';

export class AssignmentsController extends BaseController {
  private assignmentsService: AssignmentsService;

  constructor() {
    super();
    this.assignmentsService = new AssignmentsService();
  }

  assignDelivery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deliveryId } = req.params;
      const currentUser = (req as any).user;
      
      if (currentUser.role !== 'SYSTEM' && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      const assignment = await this.assignmentsService.assignToNearestCourier(deliveryId);
      this.successResponse(res, assignment, 'Entrega atribuída com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  updateAssignmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      if (currentUser.role !== 'COURIER' && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Apenas estafetas podem atualizar status', 403);
        return;
      }
      
      const assignment = await this.assignmentsService.updateStatus(id, req.body);
      this.successResponse(res, assignment, 'Status atualizado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getCourierAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courierId } = req.params;
      const assignments = await this.assignmentsService.findByCourier(courierId);
      this.successResponse(res, assignments, 'Entregas do estafeta listadas com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getDeliveryAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deliveryId } = req.params;
      const assignment = await this.assignmentsService.findByDelivery(deliveryId);
      this.successResponse(res, assignment, 'Atribuição obtida com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}