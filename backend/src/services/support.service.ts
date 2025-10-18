// src/services/support.service.ts
import { SupportTicket, ISupportTicket, SupportCategory, TicketPriority, TicketStatus } from '../models/SupportTicket.model';
import { UserType } from '../models/User.model';
import { NotificationType } from '../models/Notification.model';
import { UsersService } from './users.service';
import { NotificationsService } from './notifications.service';

export interface CreateTicketDto {
  userId: string;
  subject: string;
  description: string;
  category?: SupportCategory;
  priority?: TicketPriority;
  relatedEntityId?: string;
  relatedEntityType?: string;
  attachments?: string[];
}

export interface AddMessageDto {
  senderId: string;
  message: string;
  attachments?: string[];
  isInternal?: boolean;
}

export interface UpdateTicketStatusDto {
  status: TicketStatus;
  agentId?: string;
  resolutionSummary?: string;
}

export class SupportService {
  private usersService: UsersService;
  private notificationsService: NotificationsService;

  constructor() {
    this.usersService = new UsersService();
    this.notificationsService = new NotificationsService();
  }

  /**
   * Cria um novo ticket de suporte
   */
  async createTicket(createTicketDto: CreateTicketDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISupportTicket 
  }> {
    try {
      const { userId, subject, description, category, priority, relatedEntityId, relatedEntityType } = createTicketDto;

      // Verificar se o usuário existe
      await this.usersService.findById(userId);

      // Gerar número único do ticket
      const ticketNumber = await this.generateTicketNumber();

      const ticketData: Partial<ISupportTicket> = {
        ticketNumber,
        userId: userId as any,
        subject,
        description,
        category: category || SupportCategory.OTHER,
        priority: priority || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
        messages: [{
          senderId: userId as any,
          message: description,
          sentAt: new Date(),
          isInternal: false,
          attachments: createTicketDto.attachments || [],
        }],
        relatedEntityId: relatedEntityId as any,
        relatedEntityType,
      };

      const ticket = await SupportTicket.create(ticketData);

      // Notificar equipe de suporte sobre novo ticket
      await this.notifySupportTeam(ticket);

      console.log(`Novo ticket criado: ${ticketNumber} por usuário: ${userId}`);

      return {
        success: true,
        message: 'Ticket criado com sucesso',
        data: ticket
      };
    } catch (error: any) {
      console.error(`Erro ao criar ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona mensagem a um ticket
   */
  async addMessage(ticketId: string, addMessageDto: AddMessageDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISupportTicket 
  }> {
    try {
      const { senderId, message, attachments, isInternal } = addMessageDto;

      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      // Verificar se o remetente tem permissão
      if (!isInternal && !ticket.userId.equals(senderId)) {
        throw new Error('Usuário não autorizado para este ticket');
      }

      // Adicionar mensagem
      ticket.messages.push({
        senderId: senderId as any,
        message,
        attachments: attachments || [],
        isInternal: isInternal || false,
        sentAt: new Date(),
      });

      // Atualizar primeiro tempo de resposta se for a primeira resposta da equipe
      if (!isInternal && !ticket.firstResponseAt) {
        const isSupportTeam = await this.isSupportTeamMember(senderId);
        if (isSupportTeam) {
          ticket.firstResponseAt = new Date();
        }
      }

      // Atualizar status se necessário
      if (ticket.status === TicketStatus.AWAITING_RESPONSE) {
        ticket.status = TicketStatus.IN_PROGRESS;
      } else if (isInternal && ticket.status === TicketStatus.OPEN) {
        ticket.status = TicketStatus.IN_PROGRESS;
      }

      const updatedTicket = await ticket.save();

      // Notificar usuário sobre nova resposta
      if (!isInternal) {
        await this.notifyUserAboutResponse(updatedTicket, message);
      }

      console.log(`Mensagem adicionada ao ticket ${ticketId} por ${senderId}`);

      return {
        success: true,
        message: 'Mensagem adicionada com sucesso',
        data: updatedTicket
      };
    } catch (error: any) {
      console.error(`Erro ao adicionar mensagem ao ticket ${ticketId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza status do ticket
   */
  async updateStatus(ticketId: string, updateStatusDto: UpdateTicketStatusDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISupportTicket 
  }> {
    try {
      const { status, agentId, resolutionSummary } = updateStatusDto;

      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      // Validar transição de status
      this.validateTicketStatusTransition(ticket.status, status);

      // Atualizar status
      ticket.status = status;

      if (agentId) {
        ticket.assignedAgentId = agentId as any;
      }

      if (status === TicketStatus.RESOLVED && resolutionSummary) {
        ticket.resolutionSummary = resolutionSummary;
        ticket.resolvedAt = new Date();
      } else if (status === TicketStatus.CLOSED) {
        ticket.closedAt = new Date();
      }

      const updatedTicket = await ticket.save();

      // Notificar usuário sobre mudança de status
      await this.notifyUserAboutStatusChange(updatedTicket);

      console.log(`Status do ticket ${ticketId} atualizado para: ${status}`);

      return {
        success: true,
        message: 'Status do ticket atualizado com sucesso',
        data: updatedTicket
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar status do ticket ${ticketId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém tickets de um usuário
   */
  async getTicketsByUser(
    userId: string,
    filters?: { 
      status?: TicketStatus; 
      category?: SupportCategory;
      limit?: number;
    }
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISupportTicket[] 
  }> {
    try {
      const query: any = { userId };
      
      if (filters?.status) {
        query.status = filters.status;
      }
      
      if (filters?.category) {
        query.category = filters.category;
      }

      const limit = filters?.limit || 50;

      const tickets = await SupportTicket.find(query)
        .populate('assignedAgentId', 'name email')
        .populate('relatedEntityId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return {
        success: true,
        message: 'Tickets encontrados com sucesso',
        data: tickets
      };
    } catch (error: any) {
      console.error(`Erro ao buscar tickets do usuário ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém todos os tickets (para equipe de suporte)
   */
  async getAllTickets(filters?: {
    status?: TicketStatus;
    category?: SupportCategory;
    priority?: TicketPriority;
    assignedAgentId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ 
    success: boolean; 
    message: string; 
    data: { tickets: ISupportTicket[]; total: number; stats: any } 
  }> {
    try {
      const query: any = {};
      
      if (filters?.status) query.status = filters.status;
      if (filters?.category) query.category = filters.category;
      if (filters?.priority) query.priority = filters.priority;
      if (filters?.assignedAgentId) {
        query.assignedAgentId = filters.assignedAgentId as any;
      }
      
      if (filters?.dateFrom || filters?.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
        if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const [tickets, total, stats] = await Promise.all([
        SupportTicket.find(query)
          .populate('userId', 'name email phone')
          .populate('assignedAgentId', 'name email')
          .populate('relatedEntityId')
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        SupportTicket.countDocuments(query),
        this.getTicketStats(),
      ]);

      return {
        success: true,
        message: 'Tickets encontrados com sucesso',
        data: { tickets, total, stats }
      };
    } catch (error: any) {
      console.error(`Erro ao buscar todos os tickets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atribui ticket a um agente
   */
  async assignTicket(ticketId: string, agentId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISupportTicket 
  }> {
    try {
      const ticket = await SupportTicket.findByIdAndUpdate(
        ticketId,
        { 
          assignedAgentId: agentId as any,
          status: TicketStatus.IN_PROGRESS,
          updatedAt: new Date(),
        },
        { new: true }
      )
      .populate('userId', 'name email')
      .populate('assignedAgentId', 'name email')
      .exec();

      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      // Notificar agente sobre nova atribuição
      await this.notificationsService.sendNotification(
        agentId,
        'Ticket Atribuído',
        `Você foi atribuído ao ticket: ${ticket.ticketNumber} - ${ticket.subject}`
      );

      console.log(`Ticket ${ticketId} atribuído ao agente ${agentId}`);

      return {
        success: true,
        message: 'Ticket atribuído com sucesso',
        data: ticket
      };
    } catch (error: any) {
      console.error(`Erro ao atribuir ticket ${ticketId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona avaliação de satisfação ao ticket
   */
  async addSatisfactionRating(
    ticketId: string,
    rating: number,
    comment?: string
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISupportTicket 
  }> {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Avaliação deve ser entre 1 e 5');
      }

      const ticket = await SupportTicket.findByIdAndUpdate(
        ticketId,
        { 
          satisfactionRating: rating,
          satisfactionComment: comment,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();

      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      console.log(`Avaliação adicionada ao ticket ${ticketId}: ${rating} estrelas`);

      return {
        success: true,
        message: 'Avaliação registada com sucesso',
        data: ticket
      };
    } catch (error: any) {
      console.error(`Erro ao adicionar avaliação ao ticket ${ticketId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera número único do ticket
   */
  private async generateTicketNumber(): Promise<string> {
    const count = await SupportTicket.countDocuments();
    const number = (count + 1).toString().padStart(6, '0');
    return `TKT${number}`;
  }

  /**
   * Verifica se o usuário é membro da equipe de suporte
   */
  private async isSupportTeamMember(userId: string): Promise<boolean> {
    try {
      const userResult = await this.usersService.findById(userId);
      const user = userResult.data;
      // Implementar lógica para verificar se é suporte/admin
      return user.userType === UserType.ADMIN;
    } catch {
      return false;
    }
  }

  /**
   * Valida transição de status do ticket
   */
  private validateTicketStatusTransition(currentStatus: TicketStatus, newStatus: TicketStatus): void {
    const validTransitions: any = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.AWAITING_RESPONSE, TicketStatus.CLOSED],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.AWAITING_RESPONSE, TicketStatus.RESOLVED, TicketStatus.CLOSED],
      [TicketStatus.AWAITING_RESPONSE]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
      [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
      [TicketStatus.CLOSED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Transição de status inválida: ${currentStatus} -> ${newStatus}`);
    }
  }

  /**
   * Obtém estatísticas de tickets
   */
  private async getTicketStats(): Promise<any> {
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgFirstResponseTime: {
            $avg: {
              $cond: [
                { $ne: ['$firstResponseAt', null] },
                { $subtract: ['$firstResponseAt', '$createdAt'] },
                null,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          byStatus: {
            $push: {
              status: '$_id',
              count: '$count',
              avgFirstResponseTime: '$avgFirstResponseTime',
            },
          },
          total: { $sum: '$count' },
        },
      },
    ]);

    return stats[0] || { byStatus: [], total: 0 };
  }

  /**
   * Notifica equipe de suporte sobre novo ticket
   */
  private async notifySupportTeam(ticket: ISupportTicket): Promise<void> {
    // Implementar notificação para equipe de suporte
    console.log(`Notificar equipe sobre novo ticket: ${ticket.ticketNumber}`);
  }

  /**
   * Notifica usuário sobre nova resposta
   */
  private async notifyUserAboutResponse(ticket: ISupportTicket, message: string): Promise<void> {
    await this.notificationsService.sendNotification(
      ticket.userId.toString(),
      'Nova Resposta no Ticket',
      `Seu ticket ${ticket.ticketNumber} recebeu uma nova resposta`,
      {
        type: NotificationType.SUPPORT_RESPONSE,
        relatedEntityId: (ticket._id as any).toString(),
        relatedEntityType: 'SupportTicket',
      }
    );
  }

  /**
   * Notifica usuário sobre mudança de status
   */
  private async notifyUserAboutStatusChange(ticket: ISupportTicket): Promise<void> {
    const statusMessages: any = {
      [TicketStatus.RESOLVED]: 'foi resolvido',
      [TicketStatus.CLOSED]: 'foi fechado',
      [TicketStatus.IN_PROGRESS]: 'está em progresso',
    };

    if (statusMessages[ticket.status]) {
      await this.notificationsService.sendNotification(
        ticket.userId.toString(),
        'Status do Ticket Atualizado',
        `Seu ticket ${ticket.ticketNumber} ${statusMessages[ticket.status]}`,
        {
          type: NotificationType.SUPPORT_RESPONSE,
          relatedEntityId: (ticket._id as any).toString(),
          relatedEntityType: 'SupportTicket',
        }
      );
    }
  }
}