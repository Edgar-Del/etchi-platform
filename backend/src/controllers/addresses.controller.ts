// src/controllers/addresses.controller.ts
import { Request, Response } from 'express';
import { AddressesService } from '../services/addresses.service';
import { BaseController } from './base.controller';

export class AddressesController extends BaseController {
  private addressesService: AddressesService;

  constructor() {
    super();
    this.addressesService = new AddressesService();
  }

  createAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const addressData = {
        ...req.body,
        userId: currentUser.id
      };
      
      const address = await this.addressesService.create(addressData);
      this.successResponse(res, address, 'Endereço criado com sucesso', 201);
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getUserAddresses = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const addresses = await this.addressesService.findAllByUser(currentUser.id);
      this.successResponse(res, addresses, 'Endereços listados com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const addressResult = await this.addressesService.findById(id);
      const address = addressResult.data;
      
      // Verificar se o endereço pertence ao usuário
      if (address.userId.toString() !== currentUser.id && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      this.successResponse(res, address, 'Endereço obtido com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 404);
    }
  };

  updateAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const addressResult = await this.addressesService.findById(id);
      const address = addressResult.data;
      
      if (address.userId.toString() !== currentUser.id && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      const updatedAddress = await this.addressesService.update(id, req.body);
      this.successResponse(res, updatedAddress, 'Endereço atualizado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  deleteAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const addressResult = await this.addressesService.findById(id);
      const address = addressResult.data;
      
      if (address.userId.toString() !== currentUser.id && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      await this.addressesService.remove(id);
      this.successResponse(res, null, 'Endereço removido com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}