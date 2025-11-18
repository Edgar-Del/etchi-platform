// src/controllers/support.controller.ts
import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { SupportService } from '../services/support.service';
import { SupportCategory, TicketPriority, TicketStatus, SupportTicket } from '../models/SupportTicket.model';

export class SupportController extends BaseController {
  private supportService: SupportService;

  constructor() {
    super();
    this.supportService = new SupportService();
  }

  createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const { subject, description, category, priority, relatedEntityId, relatedEntityType, attachments } = req.body;

      const result = await this.supportService.createTicket({
        userId: currentUser.id,
        subject,
        description,
        category: category as SupportCategory,
        priority: priority as TicketPriority,
        relatedEntityId,
        relatedEntityType,
        attachments,
      });

      this.successResponse(res, result.data, 'Ticket criado com sucesso', 201);
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  addMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const { id } = req.params;
      const { message, attachments, isInternal } = req.body;

      const result = await this.supportService.addMessage(id, {
        senderId: currentUser.id,
        message,
        attachments,
        isInternal,
      });

      this.successResponse(res, result.data, 'Mensagem adicionada com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, agentId, resolutionSummary } = req.body;

      const result = await this.supportService.updateStatus(id, {
        status: status as TicketStatus,
        agentId,
        resolutionSummary,
      });

      this.successResponse(res, result.data, 'Status do ticket atualizado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getMyTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;
      const { status, category, limit } = req.query;

      const result = await this.supportService.getTicketsByUser(currentUser.id, {
        status: status as TicketStatus,
        category: category as SupportCategory,
        limit: limit ? Number(limit) : undefined,
      });

      this.successResponse(res, result.data, 'Tickets obtidos com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getTicketById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      // Buscar ticket
      const ticket = await SupportTicket.findById(id).populate('userId', 'name email').populate('assignedAgentId', 'name email');

      if (!ticket) {
        this.errorResponse(res, 'Ticket não encontrado', 404);
        return;
      }

      // Verificar permissão: usuário pode ver seu próprio ticket ou admin/support pode ver qualquer ticket
      const isAdminOrSupport = currentUser.userType === 'admin' || currentUser.userType === 'support';
      const isOwner = ticket.userId._id.toString() === currentUser.id;

      if (!isAdminOrSupport && !isOwner) {
        this.errorResponse(res, 'Não autorizado', 403);
        return;
      }

      this.successResponse(res, ticket, 'Ticket obtido com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getAllTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, category, priority, assignedAgentId, dateFrom, dateTo, page, limit } = req.query;

      const result = await this.supportService.getAllTickets({
        status: status as TicketStatus,
        category: category as SupportCategory,
        priority: priority as TicketPriority,
        assignedAgentId: assignedAgentId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      this.successResponse(res, result.data, 'Tickets do suporte obtidos com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  assignTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { agentId } = req.body;

      const result = await this.supportService.assignTicket(id, agentId);
      this.successResponse(res, result.data, 'Ticket atribuído com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  addSatisfactionRating = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      const result = await this.supportService.addSatisfactionRating(id, rating, comment);
      this.successResponse(res, result.data, 'Avaliação registrada com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  getTicketStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.supportService.getTicketStats();
      this.successResponse(res, result.data, 'Estatísticas obtidas com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}

