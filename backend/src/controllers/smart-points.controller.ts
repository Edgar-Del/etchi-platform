// src/controllers/smart-points.controller.ts
import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { SmartPointsService, SmartPointStatus } from '../services/smart-points.service';

export class SmartPointsController extends BaseController {
  private smartPointsService: SmartPointsService;

  constructor() {
    super();
    this.smartPointsService = new SmartPointsService();
  }

  createSmartPoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const {
        name,
        lng,
        lat,
        contactPhone,
        email,
        capacity,
        services,
        facilities,
        operatingHours,
      } = req.body;

      const location = {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)],
      };

      const createResult = await this.smartPointsService.createSmartPoint({
        name,
        location,
        managerId: currentUser.id,
        contactPhone: contactPhone || currentUser.phone || '000000000',
        email,
        capacity: capacity || 50,
        services,
        facilities,
        operatingHours,
      });

      this.successResponse(res, createResult.data, 'Ponto inteligente criado com sucesso', 201);
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getAllSmartPoints = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.smartPointsService.findAll();
      this.successResponse(res, result.data, 'Pontos inteligentes listados com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getNearbySmartPoints = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lng, lat, radius } = req.query;

      const result = await this.smartPointsService.findNearbyPoints(
        { lat: Number(lat), lng: Number(lng) },
        radius ? Number(radius) : 5000
      );

      this.successResponse(res, result.data, 'Pontos inteligentes próximos listados com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  updateSmartPointStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updateResult = await this.smartPointsService.updateStatus(id, status as SmartPointStatus);
      this.successResponse(res, updateResult.data, 'Status do ponto atualizado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}

