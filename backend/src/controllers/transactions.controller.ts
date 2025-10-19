// src/controllers/transactions.controller.ts
import { Request, Response } from 'express';
import { TransactionsService } from '../services/transactions.service';
import { BaseController } from './base.controller';

export class TransactionsController extends BaseController {
  private transactionsService: TransactionsService;

  constructor() {
    super();
    this.transactionsService = new TransactionsService();
  }

  initiatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const paymentData = {
        ...req.body,
        userId: currentUser.id
      };
      
      const paymentResult = await this.transactionsService.initiatePayment(paymentData);
      this.successResponse(res, paymentResult.data, 'Pagamento iniciado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  paymentCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.transactionsService.handlePaymentCallback(req.body);
      this.successResponse(res, result.data, 'Callback processado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      
      const transactionResult = await this.transactionsService.findById(id);
      const transaction = transactionResult.data;
      
      // Verificar se o usuário tem acesso a esta transação
      if (currentUser.role !== 'ADMIN' && transaction.customerId.toString() !== currentUser.id) {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      this.successResponse(res, transaction, 'Transação obtida com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 404);
    }
  };

  getAllTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      
      if (currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      const transactionsResult = await this.transactionsService.findAll();
      this.successResponse(res, transactionsResult.data, 'Transações listadas com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getUserTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const currentUser = (req as any).user;
      
      // Verificar se o usuário está acessando suas próprias transações ou é admin
      if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }
      
      const transactionsResult = await this.transactionsService.findByUser(userId);
      this.successResponse(res, transactionsResult.data, 'Transações do utilizador listadas com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}