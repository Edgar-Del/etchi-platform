// src/services/transactions.service.ts
import axios from 'axios';
import { Transaction, ITransaction, TransactionType, TransactionStatus } from '../models/Transaction.model';
import { PaymentMethod } from '../models/DeliveryRequest.model';

// Interfaces for external API responses
interface MulticaixaPaymentResponse {
  status: 'success' | 'failed';
  transactionId?: string;
  authCode?: string;
  message?: string;
}

interface MulticaixaStatusResponse {
  status: 'completed' | 'failed' | 'pending';
}

interface PayPalPaymentResponse {
  id: string;
  state: string;
  links: Array<{
    rel: string;
    href: string;
  }>;
}

interface PayPalStatusResponse {
  state: 'approved' | 'pending' | 'failed';
}

interface MulticaixaPayoutResponse {
  status: 'success' | 'failed';
  message?: string;
}
import { UsersService } from './users.service';
import { DeliveriesService } from './deliveries.service';
import { AnalyticsService } from './analytics.service';

export interface PaymentDto {
  deliveryRequestId: string;
  customerId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  customerPhone?: string;
}

export interface WalletTopupDto {
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export class TransactionsService {
  private usersService: UsersService;
  private deliveriesService: DeliveriesService;
  private analyticsService: AnalyticsService;

  constructor() {
    this.usersService = new UsersService();
    this.deliveriesService = new DeliveriesService();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Inicia um processo de pagamento
   */
  async initiatePayment(paymentDto: PaymentDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: ITransaction 
  }> {
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
      const { deliveryRequestId, customerId, paymentMethod, amount } = paymentDto;

      // Validar entrega
      const deliveryResult = await this.deliveriesService.trackDelivery(deliveryRequestId);
      const delivery = deliveryResult.data.delivery;

      if (!delivery) {
        throw new Error('Entrega não encontrada');
      }

      if (delivery.customerId.toString() !== customerId) {
        throw new Error('Usuário não autorizado para esta entrega');
      }

      // Verificar se já existe transação para esta entrega
      const existingTransaction = await Transaction.findOne({
        deliveryRequestId: delivery._id,
        type: TransactionType.DELIVERY_PAYMENT,
      });

      if (existingTransaction) {
        throw new Error('Já existe um pagamento para esta entrega');
      }

      // Gerar referência única
      const reference = this.generateTransactionReference();

      // Criar transação
      const transactionData: Partial<ITransaction> = {
        reference,
        deliveryRequestId: delivery._id,
        customerId: customerId as any,
        deliveryPartnerId: delivery.deliveryPartnerId,
        type: TransactionType.DELIVERY_PAYMENT,
        paymentMethod,
        status: TransactionStatus.PENDING,
        amount,
        platformFee: this.calculatePlatformFee(amount),
        partnerEarnings: this.calculatePartnerEarnings(amount),
        netAmount: amount,
        paymentDetails: {
          authCode: null,
          paymentGateway: this.getPaymentGateway(paymentMethod),
        },
      };

      const transaction = await Transaction.create([transactionData], { session });

      // Processar pagamento baseado no método
      let paymentResult;
      switch (paymentMethod) {
        case PaymentMethod.MULTICAIXA_EXPRESS:
          paymentResult = await this.processMulticaixaPayment(transaction[0], paymentDto);
          break;
        case PaymentMethod.PAYPAL:
          paymentResult = await this.processPaypalPayment(transaction[0], paymentDto);
          break;
        case PaymentMethod.WALLET:
          paymentResult = await this.processWalletPayment(transaction[0], paymentDto, session);
          break;
        case PaymentMethod.CASH:
          paymentResult = await this.processCashPayment(transaction[0]);
          break;
        default:
          throw new Error('Método de pagamento não suportado');
      }

      // Atualizar transação com resultado do pagamento
      transaction[0].status = paymentResult.status;
      transaction[0].paymentDetails = {
        ...transaction[0].paymentDetails,
        ...paymentResult.details,
      };

      if (paymentResult.status === TransactionStatus.COMPLETED) {
        transaction[0].processedAt = new Date();
        transaction[0].completedAt = new Date();
      }

      await transaction[0].save({ session });

      // Confirmar transação
      await session.commitTransaction();

      // Log analytics
      await this.analyticsService.trackPaymentProcessed(transaction[0]);

      console.log(`Pagamento iniciado: ${reference} para entrega: ${deliveryRequestId}`);

      return {
        success: true,
        message: 'Pagamento iniciado com sucesso',
        data: transaction[0]
      };
    } catch (error: any) {
      await session.abortTransaction();
      console.error(`Erro ao iniciar pagamento: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Verifica o status de um pagamento
   */
  async verifyPaymentStatus(transactionId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: { status: string; transaction: ITransaction } 
  }> {
    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // Verificar status com o gateway de pagamento
      let updatedStatus = transaction.status;
      
      if (transaction.status === TransactionStatus.PENDING) {
        switch (transaction.paymentMethod) {
          case PaymentMethod.MULTICAIXA_EXPRESS:
            updatedStatus = await this.verifyMulticaixaStatus(transaction);
            break;
          case PaymentMethod.PAYPAL:
            updatedStatus = await this.verifyPaypalStatus(transaction);
            break;
        }

        if (updatedStatus !== transaction.status) {
          transaction.status = updatedStatus;
          if (updatedStatus === TransactionStatus.COMPLETED) {
            transaction.completedAt = new Date();
          }
          await transaction.save();
        }
      }

      return {
        success: true,
        message: 'Status do pagamento verificado',
        data: { status: updatedStatus, transaction }
      };
    } catch (error: any) {
      console.error(`Erro ao verificar status do pagamento ${transactionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona saldo à carteira do usuário
   */
  async creditWallet(userId: string, amount: number): Promise<{ 
    success: boolean; 
    message: string; 
    data: { newBalance: number } 
  }> {
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
      if (amount <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      const userResult = await this.usersService.findById(userId);
      const user = userResult.data;

      // Criar transação de recarga
      const reference = this.generateTransactionReference();
      
      const transaction = await Transaction.create([{
        reference,
        customerId: user._id,
        type: TransactionType.WALLET_TOPUP,
        paymentMethod: PaymentMethod.MULTICAIXA_EXPRESS,
        status: TransactionStatus.COMPLETED,
        amount,
        platformFee: 0,
        partnerEarnings: 0,
        netAmount: amount,
        processedAt: new Date(),
        completedAt: new Date(),
        paymentDetails: {
          paymentGateway: 'wallet_topup',
          transactionId: `WTOPUP-${reference}`,
        },
      }], { session });

      // Atualizar saldo do usuário
      user.walletBalance = (user.walletBalance || 0) + amount;
      await user.save({ session });

      await session.commitTransaction();

      console.log(`Carteira creditada: ${amount} AOA para usuário: ${userId}`);

      return {
        success: true,
        message: 'Carteira creditada com sucesso',
        data: { newBalance: amount }
      };
    } catch (error: any) {
      await session.abortTransaction();
      console.error(`Erro ao creditar carteira: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Processa saque da carteira
   */
  async withdraw(userId: string, amount: number): Promise<{ 
    success: boolean; 
    message: string; 
    data: { newBalance: number } 
  }> {
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
      if (amount <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      const userResult = await this.usersService.findById(userId);
      const user = userResult.data;

      // Verificar saldo suficiente
      if (!user.walletBalance || user.walletBalance < amount) {
        throw new Error('Saldo insuficiente');
      }

      // Criar transação de saque
      const reference = this.generateTransactionReference();
      
      const transaction = await Transaction.create([{
        reference,
        customerId: user._id,
        type: TransactionType.PARTNER_PAYOUT,
        paymentMethod: PaymentMethod.MULTICAIXA_EXPRESS,
        status: TransactionStatus.PENDING,
        amount: -amount,
        platformFee: 0,
        partnerEarnings: -amount,
        netAmount: -amount,
        paymentDetails: {
          paymentGateway: 'payout',
          transactionId: `WDRW-${reference}`,
        },
      }], { session });

      // Processar saque via Multicaixa
      const payoutResult = await this.processPayout(user, amount, reference);

      if (payoutResult.success) {
        transaction[0].status = TransactionStatus.COMPLETED;
        transaction[0].processedAt = new Date();
        transaction[0].completedAt = new Date();
        
        // Atualizar saldo do usuário
        user.walletBalance -= amount;
        await user.save({ session });
      } else {
        transaction[0].status = TransactionStatus.FAILED;
        transaction[0].failureReason = payoutResult.message;
      }

      await transaction[0].save({ session });
      await session.commitTransaction();

      console.log(`Saque processado: ${amount} AOA para usuário: ${userId}`);

      return {
        success: payoutResult.success,
        message: payoutResult.success ? 'Saque realizado com sucesso' : payoutResult.message,
        data: { newBalance: 0 }
      };
    } catch (error: any) {
      await session.abortTransaction();
      console.error(`Erro ao processar saque: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Obtém histórico de transações do usuário
   */
  async getTransactionsByUser(
    userId: string, 
    filters?: { type?: TransactionType; status?: TransactionStatus; limit?: number }
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: ITransaction[] 
  }> {
    try {
      const query: any = {
        $or: [
          { customerId: userId },
          { deliveryPartnerId: userId },
        ],
      };

      if (filters?.type) query.type = filters.type;
      if (filters?.status) query.status = filters.status;

      const limit = filters?.limit || 50;

      const transactions = await Transaction.find(query)
        .populate('deliveryRequestId', 'trackingCode package')
        .populate('deliveryPartnerId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return {
        success: true,
        message: 'Transações encontradas com sucesso',
        data: transactions
      };
    } catch (error: any) {
      console.error(`Erro ao buscar transações do usuário ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processa pagamento via Multicaixa Express
   */
  private async processMulticaixaPayment(transaction: ITransaction, paymentDto: PaymentDto): Promise<any> {
    try {
      // Integração com API Multicaixa Express
      const payload = {
        reference: transaction.reference,
        amount: transaction.amount,
        customerPhone: paymentDto.customerPhone,
        description: `Pagamento Etchi - Entrega ${transaction.deliveryRequestId}`,
      };

      const response = await axios.post<MulticaixaPaymentResponse>(
        process.env.MULTICAIXA_API_URL + '/payments',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MULTICAIXA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        return {
          status: TransactionStatus.PROCESSING,
          details: {
            transactionId: response.data.transactionId,
            authorizationCode: response.data.authCode,
          },
        };
      } else {
        return {
          status: TransactionStatus.FAILED,
          details: {
            failureReason: response.data.message || 'Falha no processamento Multicaixa',
          },
        };
      }
    } catch (error: any) {
      console.error(`Erro no processamento Multicaixa: ${error.message}`);
      return {
        status: TransactionStatus.FAILED,
        details: {
          failureReason: 'Erro de comunicação com Multicaixa',
        },
      };
    }
  }

  /**
   * Processa pagamento via PayPal
   */
  private async processPaypalPayment(transaction: ITransaction, paymentDto: PaymentDto): Promise<any> {
    try {
      // Integração com API PayPal
      const payload = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal',
        },
        transactions: [{
          amount: {
            total: transaction.amount,
            currency: 'USD',
          },
          description: `Pagamento Etchi - Entrega ${transaction.deliveryRequestId}`,
        }],
        redirect_urls: {
          return_url: `${process.env.CLIENT_URL}/payment/success`,
          cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
        },
      };

      const response = await axios.post<PayPalPaymentResponse>(
        process.env.PAYPAL_API_URL + '/v1/payments/payment',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        status: TransactionStatus.PENDING,
        details: {
          transactionId: response.data.id,
          approvalUrl: response.data.links.find((link) => link.rel === 'approval_url')?.href || '',
        },
      };
    } catch (error: any) {
      console.error(`Erro no processamento PayPal: ${error.message}`);
      return {
        status: TransactionStatus.FAILED,
        details: {
          failureReason: 'Erro de comunicação com PayPal',
        },
      };
    }
  }

  /**
   * Processa pagamento via carteira
   */
  private async processWalletPayment(transaction: ITransaction, paymentDto: PaymentDto, session: any): Promise<any> {
    try {
      // Verificar saldo do usuário
      const userResult = await this.usersService.findById(transaction.customerId.toString());
      const user = userResult.data;

      if (!user.walletBalance || user.walletBalance < transaction.amount) {
        return {
          status: TransactionStatus.FAILED,
          details: { failureReason: 'Saldo insuficiente' },
        };
      }

      // Debitar da carteira
      user.walletBalance -= transaction.amount;
      await user.save({ session });

      return {
        status: TransactionStatus.COMPLETED,
        details: {
          transactionId: `WALLET-${transaction.reference}`,
        },
      };
    } catch (error: any) {
      console.error(`Erro no processamento via carteira: ${error.message}`);
      return {
        status: TransactionStatus.FAILED,
        details: {
          failureReason: 'Erro no processamento via carteira',
        },
      };
    }
  }

  /**
   * Processa pagamento em dinheiro
   */
  private async processCashPayment(transaction: ITransaction): Promise<any> {
    return {
      status: TransactionStatus.PENDING,
      details: {
        transactionId: `CASH-${transaction.reference}`,
      },
    };
  }

  /**
   * Processa saque para entregador
   */
  private async processPayout(user: any, amount: number, reference: string): Promise<{ success: boolean; message: string }> {
    try {
      // Integração com API de saques Multicaixa
      const payload = {
        reference,
        amount,
        recipientPhone: user.phone,
        recipientName: user.name,
      };

      const response = await axios.post<MulticaixaPayoutResponse>(
        process.env.MULTICAIXA_API_URL + '/payouts',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MULTICAIXA_API_KEY}`,
          },
        }
      );

      return {
        success: response.data.status === 'success',
        message: response.data.message || 'Saque processado',
      };
    } catch (error: any) {
      console.error(`Erro no processamento de saque: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao processar saque',
      };
    }
  }

  /**
   * Verifica status Multicaixa
   */
  private async verifyMulticaixaStatus(transaction: ITransaction): Promise<TransactionStatus> {
    try {
      const response = await axios.get<MulticaixaStatusResponse>(
        `${process.env.MULTICAIXA_API_URL}/payments/${transaction.paymentDetails.transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MULTICAIXA_API_KEY}`,
          },
        }
      );

      const statusMap: Record<string, TransactionStatus> = {
        'completed': TransactionStatus.COMPLETED,
        'failed': TransactionStatus.FAILED,
        'pending': TransactionStatus.PENDING,
      };

      return statusMap[response.data.status] || TransactionStatus.PENDING;
    } catch (error: any) {
      console.error(`Erro ao verificar status Multicaixa: ${error.message}`);
      return TransactionStatus.PENDING;
    }
  }

  /**
   * Verifica status PayPal
   */
  private async verifyPaypalStatus(transaction: ITransaction): Promise<TransactionStatus> {
    try {
      const response = await axios.get<PayPalStatusResponse>(
        `${process.env.PAYPAL_API_URL}/v1/payments/payment/${transaction.paymentDetails.transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`,
          },
        }
      );

      return response.data.state === 'approved' 
        ? TransactionStatus.COMPLETED 
        : TransactionStatus.PENDING;
    } catch (error: any) {
      console.error(`Erro ao verificar status PayPal: ${error.message}`);
      return TransactionStatus.PENDING;
    }
  }

  /**
   * Gera referência única para transação
   */
  private generateTransactionReference(): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TXN${timestamp}${random}`;
  }

  /**
   * Calcula taxa da plataforma
   */
  private calculatePlatformFee(amount: number): number {
    return Math.round(amount * 0.15);
  }

  /**
   * Calcula ganhos do entregador
   */
  private calculatePartnerEarnings(amount: number): number {
    const platformFee = this.calculatePlatformFee(amount);
    return amount - platformFee;
  }

  /**
   * Obtém gateway de pagamento baseado no método
   */
  private getPaymentGateway(paymentMethod: PaymentMethod): string {
    const gateways: any = {
      [PaymentMethod.MULTICAIXA_EXPRESS]: 'multicaixa_express',
      [PaymentMethod.PAYPAL]: 'paypal',
      [PaymentMethod.WALLET]: 'wallet',
      [PaymentMethod.CASH]: 'cash',
    };
    return gateways[paymentMethod];
  }

  /**
   * Processa callback de pagamento
   */
  async handlePaymentCallback(callbackData: any): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      const { transactionId, status, authCode } = callbackData;

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // Atualizar status baseado no callback
      if (status === 'success' || status === 'completed') {
        transaction.status = TransactionStatus.COMPLETED;
        if (authCode) {
          transaction.paymentDetails.authCode = authCode;
        }
      } else {
        transaction.status = TransactionStatus.FAILED;
      }

      await transaction.save();

      return {
        success: true,
        message: 'Callback processado com sucesso',
        data: transaction
      };
    } catch (error: any) {
      console.error(`Erro ao processar callback: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encontra transação por ID
   */
  async findById(id: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: ITransaction 
  }> {
    try {
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      return {
        success: true,
        message: 'Transação encontrada com sucesso',
        data: transaction
      };
    } catch (error: any) {
      console.error(`Erro ao buscar transação ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todas as transações
   */
  async findAll(): Promise<{ 
    success: boolean; 
    message: string; 
    data: ITransaction[] 
  }> {
    try {
      const transactions = await Transaction.find()
        .populate('customerId', 'name email')
        .sort({ createdAt: -1 })
        .exec();

      return {
        success: true,
        message: 'Transações listadas com sucesso',
        data: transactions
      };
    } catch (error: any) {
      console.error(`Erro ao listar transações: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encontra transações por usuário
   */
  async findByUser(userId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: ITransaction[] 
  }> {
    try {
      const transactions = await Transaction.find({ customerId: userId })
        .populate('customerId', 'name email')
        .sort({ createdAt: -1 })
        .exec();

      return {
        success: true,
        message: 'Transações do usuário listadas com sucesso',
        data: transactions
      };
    } catch (error: any) {
      console.error(`Erro ao buscar transações do usuário ${userId}: ${error.message}`);
      throw error;
    }
  }
}