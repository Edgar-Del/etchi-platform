// src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import { BaseController } from './base.controller';

export class UsersController extends BaseController {
  private usersService: UsersService;

  constructor() {
    super();
    this.usersService = new UsersService();
  }

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.usersService.findAll();
      this.successResponse(res, result.data, 'Utilizadores listados com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userResult = await this.usersService.findById(id);
      this.successResponse(res, userResult.data, 'Utilizador obtido com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 404);
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      // Verificar se o usuário está atualizando seu próprio perfil ou é admin
      const currentUser = (req as any).user;
      if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      const userResult = await this.usersService.updateProfile(id, userData);
      this.successResponse(res, userResult.data, 'Perfil atualizado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  deactivateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Verificar se o usuário está desativando sua própria conta ou é admin
      const currentUser = (req as any).user;
      if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      await this.usersService.deactivateUser(id);
      this.successResponse(res, null, 'Conta desativada com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  updateLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const locationData = req.body;
      
      // Verificar se o usuário está atualizando sua própria localização
      const currentUser = (req as any).user;
      if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      const userResult = await this.usersService.updateLocation(id, locationData);
      this.successResponse(res, userResult.data, 'Localização atualizada com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getNearbyCouriers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lng, lat, radius } = req.query;
      
      const couriersResult = await this.usersService.findNearbyCouriers(
        { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
        radius ? parseInt(radius as string) : 5000
      );
      
      this.successResponse(res, couriersResult.data, 'Entregadores próximos listados com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}