// src/services/deliveries.service.ts
import { DeliveryRequest, IDeliveryRequest, DeliveryStatus, DeliveryType } from '../models/DeliveryRequest.model';
import { GeocodingService } from './geocoding.service';
import { PricingService } from './pricing.service';
import { UsersService } from './users.service';
import { NotificationsService } from './notifications.service';
import { AnalyticsService } from './analytics.service';
import { AddressesService } from './addresses.service';
import { Address } from '../models/Address.model';

export interface DeliveryAddress {
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

export interface PackageDetails {
  description: string;
  weight: number;
  size: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue: number;
  images: string[];
  category: string;
}

export interface DeliveryRequirements {
  signatureRequired?: boolean;
  idVerification?: boolean;
  fragile?: boolean;
  perishable?: boolean;
  [key: string]: any;
}

export interface CreateDeliveryDto {
  customerId: string;
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  package: PackageDetails;
  deliveryType: DeliveryType;
  requirements?: DeliveryRequirements;
  urgency?: string;
}

export interface UpdateDeliveryStatusDto {
  status: DeliveryStatus;
  location?: { lat: number; lng: number };
  notes?: string;
}

export class DeliveriesService {
  private geocodingService: GeocodingService;
  private pricingService: PricingService;
  private usersService: UsersService;
  private notificationsService: NotificationsService;
  private analyticsService: AnalyticsService;
  private addressesService: AddressesService;

  constructor() {
    this.geocodingService = new GeocodingService();
    this.pricingService = new PricingService();
    this.usersService = new UsersService();
    this.notificationsService = new NotificationsService();
    this.analyticsService = new AnalyticsService();
    this.addressesService = new AddressesService();
  }

  /**
   * Cria um novo pedido de entrega
   */
  async createDelivery(createDeliveryDto: CreateDeliveryDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryRequest 
  }> {
    try {
      const { customerId, pickupAddress, deliveryAddress, package: packageDetails } = createDeliveryDto;

      // Validar endereços
      const [pickupCoords, deliveryCoords] = await Promise.all([
        this.geocodingService.geocodeAddress(pickupAddress.fullAddress),
        this.geocodingService.geocodeAddress(deliveryAddress.fullAddress),
      ]);

      if (!pickupCoords || !deliveryCoords) {
        throw new Error('Não foi possível geocodificar um dos endereços');
      }

      // Calcular distância e duração
      const distanceResult = await this.geocodingService.calculateDistance(
        pickupCoords,
        deliveryCoords
      );

      // Calcular preços
      const pricing = this.pricingService.calculateDeliveryPrice({
        distance: distanceResult.distance,
        size: packageDetails.size,
        weight: packageDetails.weight,
        deliveryType: createDeliveryDto.deliveryType,
        urgency: createDeliveryDto.urgency || 'standard',
      });

      // Gerar código de rastreamento
      const trackingCode = this.generateTrackingCode();

    // Use the exported interface

    // Criar endereços primeiro
    const originAddressResult = await this.addressesService.create({
      userId: customerId,
      label: 'Endereço de Origem',
      contactName: 'Cliente',
      contactPhone: '000000000',
      addressType: 'PICKUP' as any,
      street: pickupAddress.fullAddress,
      neighborhood: 'Centro',
      municipality: 'Luanda',
      province: 'Luanda',
    });
    
    const destinationAddressResult = await this.addressesService.create({
      userId: customerId,
      label: 'Endereço de Destino',
      contactName: 'Destinatário',
      contactPhone: '000000000',
      addressType: 'DELIVERY' as any,
      street: deliveryAddress.fullAddress,
      neighborhood: 'Centro',
      municipality: 'Luanda',
      province: 'Luanda',
    });

    const deliveryData = {
      trackingCode,
      customerId: customerId as any,
      originAddressId: originAddressResult.data._id,
      destinationAddressId: destinationAddressResult.data._id,
      package: packageDetails,
      deliveryType: createDeliveryDto.deliveryType,
      status: DeliveryStatus.PENDING,
      estimatedDistance: distanceResult.distance,
      estimatedDuration: distanceResult.duration,
      pricing,
      pickupDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas
      deliveryDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      timeline: [{
        status: DeliveryStatus.PENDING,
        description: 'Pedido criado e aguardando atribuição',
        timestamp: new Date(),
      }],
      requirements: createDeliveryDto.requirements || {
        signatureRequired: false,
        idVerification: false,
        fragile: false,
        perishable: false,
      },
    } as Partial<IDeliveryRequest>;

      const delivery = await DeliveryRequest.create(deliveryData);

      // Notificar entregadores próximos
      await this.notifyNearbyCouriers(delivery);

      // Log analytics
      await this.analyticsService.trackDeliveryCreated(delivery);

      console.log(`Nova entrega criada: ${trackingCode} para cliente: ${customerId}`);

      return {
        success: true,
        message: 'Entrega criada com sucesso',
        data: delivery
      };
    } catch (error: any) {
      console.error(`Erro ao criar entrega: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Atribui automaticamente um entregador à entrega
   */
  async assignCourier(deliveryId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryRequest 
  }> {
    try {
      const delivery = await DeliveryRequest.findById(deliveryId);
      if (!delivery) {
        throw new Error('Entrega não encontrada');
      }

      if (delivery.status !== DeliveryStatus.PENDING) {
        throw new Error('Entrega já foi atribuída ou está em andamento');
      }

      // Buscar endereço de origem para obter coordenadas
      const originAddress = await Address.findById(delivery.originAddressId);
      if (!originAddress) {
        throw new Error('Endereço de origem não encontrado');
      }
      
      // Encontrar entregadores próximos
      const nearbyCouriers = await this.usersService.findNearbyCouriers({
        lat: originAddress.location.coordinates[1],
        lng: originAddress.location.coordinates[0],
      }, 5000); // 5km radius

      if (nearbyCouriers.data.length === 0) {
        throw new Error('Nenhum entregador disponível na área');
      }

      // Selecionar o melhor entregador (baseado em rating e proximidade)
      const bestCourier = this.selectBestCourier(nearbyCouriers.data, delivery);
      
      if (!bestCourier) {
        throw new Error('Nenhum entregador adequado encontrado');
      }

      // Atribuir entregador
      delivery.deliveryPartnerId = bestCourier._id;
      delivery.status = DeliveryStatus.ASSIGNED;
      
      delivery.timeline.push({
        status: DeliveryStatus.ASSIGNED,
        description: `Entregador ${bestCourier.name} atribuído à entrega`,
        timestamp: new Date(),
      });

      const updatedDelivery = await delivery.save();

      // Notificar cliente e entregador
      await Promise.all([
        this.notificationsService.sendNotification(
          delivery.customerId.toString(),
          'Entregador atribuído',
          `Seu pedido ${delivery.trackingCode} foi atribuído a ${bestCourier.name}`
        ),
        this.notificationsService.sendNotification(
          bestCourier._id.toString(),
          'Nova entrega atribuída',
          `Você foi selecionado para a entrega ${delivery.trackingCode}`
        ),
      ]);

      console.log(`Entregador ${bestCourier._id} atribuído à entrega ${deliveryId}`);

      return {
        success: true,
        message: 'Entregador atribuído com sucesso',
        data: updatedDelivery
      };
    } catch (error: any) {
      console.error(`Erro ao atribuir entregador ${deliveryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza o status da entrega
   */
  async updateStatus(id: string, updateStatusDto: UpdateDeliveryStatusDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: IDeliveryRequest 
  }> {
    try {
      const { status, location, notes } = updateStatusDto;

      const delivery = await DeliveryRequest.findById(id);
      if (!delivery) {
        throw new Error('Entrega não encontrada');
      }

      // Validar transição de status
      this.validateStatusTransition(delivery.status, status);

      // Atualizar status
      delivery.status = status;

      // Adicionar ao timeline
      const timelineEntry: any = {
        status,
        description: this.getStatusDescription(status, notes),
        timestamp: new Date(),
      };

      if (location) {
        timelineEntry.location = {
          latitude: location.lat,
          longitude: location.lng,
        };
      }

      delivery.timeline.push(timelineEntry);

      // Atualizar timestamps específicos
      if (status === DeliveryStatus.PICKED_UP) {
        delivery.pickedUpAt = new Date();
      } else if (status === DeliveryStatus.DELIVERED) {
        delivery.deliveredAt = new Date();
      }

      const updatedDelivery = await delivery.save();

      // Notificar cliente sobre atualização
      await this.notificationsService.sendNotification(
        delivery.customerId.toString(),
        'Status da entrega atualizado',
        `Seu pedido ${delivery.trackingCode} está: ${this.getStatusDisplayName(status)}`
      );

      console.log(`Status da entrega ${id} atualizado para: ${status}`);

      return {
        success: true,
        message: 'Status atualizado com sucesso',
        data: updatedDelivery
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar status ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém dados de rastreamento da entrega
   */
  async trackDelivery(id: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      let delivery: IDeliveryRequest | null;

      if (id.match(/^ETC/)) {
        delivery = await DeliveryRequest.findOne({ trackingCode: id.toUpperCase() })
          .populate('customerId', 'name phone')
          .populate('deliveryPartnerId', 'name phone vehicleInfo')
          .exec();
      } else {
        delivery = await DeliveryRequest.findById(id)
          .populate('customerId', 'name phone')
          .populate('deliveryPartnerId', 'name phone vehicleInfo')
          .exec();
      }

      if (!delivery) {
        throw new Error('Entrega não encontrada');
      }

      const trackingData = {
        delivery,
        currentStatus: delivery.status,
        timeline: delivery.timeline,
        estimatedDelivery: this.calculateEstimatedDelivery(delivery),
      };

      return {
        success: true,
        message: 'Dados de rastreamento obtidos com sucesso',
        data: trackingData
      };
    } catch (error: any) {
      console.error(`Erro ao rastrear entrega ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula o custo de entrega baseado na distância
   */
  calculateDeliveryCost(distanceKm: number): number {
    const baseRate = 500; // 500 AOA base
    const perKmRate = 150; // 150 AOA por km
    
    return Math.round(baseRate + (distanceKm * perKmRate));
  }

  /**
   * Gera código de rastreamento único
   */
  private generateTrackingCode(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ETC${timestamp}${random}`;
  }

  /**
   * Seleciona o melhor entregador baseado em critérios
   */
  private selectBestCourier(couriers: any[], delivery: IDeliveryRequest): any {
    return couriers
      .filter(courier => 
        courier.travelerProfile?.capacity >= delivery.package.weight
      )
      .sort((a, b) => {
        // Priorizar rating mais alto
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (Math.abs(ratingDiff) > 0.5) return ratingDiff;
        
        // Priorizar mais entregas realizadas
        return (b.totalDeliveries || 0) - (a.totalDeliveries || 0);
      })[0];
  }

  /**
   * Valida transição de status
   */
  private validateStatusTransition(currentStatus: DeliveryStatus, newStatus: DeliveryStatus): void {
    const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      [DeliveryStatus.PENDING]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
      [DeliveryStatus.ASSIGNED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED],
      [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.CANCELLED],
      [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED],
      [DeliveryStatus.DELIVERED]: [],
      [DeliveryStatus.CANCELLED]: [],
      [DeliveryStatus.FAILED]: [],
      [DeliveryStatus.SEARCHING]: [DeliveryStatus.ASSIGNED],
      [DeliveryStatus.ACCEPTED]: [DeliveryStatus.PICKED_UP],
      [DeliveryStatus.PICKUP_ARRIVED]: [DeliveryStatus.PICKED_UP],
      [DeliveryStatus.DELIVERY_ARRIVED]: [DeliveryStatus.DELIVERED]
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Transição de status inválida: ${currentStatus} -> ${newStatus}`);
    }
  }

  /**
   * Obtém descrição do status
   */
  private getStatusDescription(status: DeliveryStatus, notes?: string): string {
    const descriptions: Record<DeliveryStatus, string> = {
      [DeliveryStatus.PENDING]: 'Aguardando atribuição de entregador',
      [DeliveryStatus.ASSIGNED]: 'Entregador atribuído',
      [DeliveryStatus.PICKED_UP]: 'Pacote recolhido pelo entregador',
      [DeliveryStatus.IN_TRANSIT]: 'Em trânsito para destino',
      [DeliveryStatus.DELIVERED]: 'Entrega concluída com sucesso',
      [DeliveryStatus.CANCELLED]: `Entrega cancelada${notes ? `: ${notes}` : ''}`,
      [DeliveryStatus.FAILED]: `Falha na entrega${notes ? `: ${notes}` : ''}`,
      [DeliveryStatus.SEARCHING]: 'Procurando entregador',
      [DeliveryStatus.ACCEPTED]: 'Entrega aceita',
      [DeliveryStatus.PICKUP_ARRIVED]: 'Chegou ao local de retirada',
      [DeliveryStatus.DELIVERY_ARRIVED]: 'Chegou ao destino'
    };

    return descriptions[status];
  }

  /**
   * Obtém nome amigável do status
   */
  private getStatusDisplayName(status: DeliveryStatus): string {
    const names: Record<DeliveryStatus, string> = {
        [DeliveryStatus.PENDING]: 'Pendente',
        [DeliveryStatus.ASSIGNED]: 'Atribuído',
        [DeliveryStatus.PICKED_UP]: 'Recolhido',
        [DeliveryStatus.IN_TRANSIT]: 'Em Trânsito',
        [DeliveryStatus.DELIVERED]: 'Entregue',
        [DeliveryStatus.CANCELLED]: 'Cancelado',
        [DeliveryStatus.FAILED]: 'Falhou',
        [DeliveryStatus.SEARCHING]: 'Procurando',
        [DeliveryStatus.ACCEPTED]: 'Aceito',
        [DeliveryStatus.PICKUP_ARRIVED]: 'Chegou ao Local de Retirada',
        [DeliveryStatus.DELIVERY_ARRIVED]: 'Chegou ao Destino'
    };

    return names[status];
  }

  /**
   * Calcula estimativa de entrega
   */
  private calculateEstimatedDelivery(delivery: IDeliveryRequest): Date {
    const baseDate = delivery.pickedUpAt || new Date();
    return new Date(baseDate.getTime() + delivery.estimatedDuration * 60000);
  }

  /**
   * Notifica entregadores próximos sobre nova entrega
   */
  private async notifyNearbyCouriers(delivery: IDeliveryRequest): Promise<void> {
    try {
      interface Courier {
        _id: string;
      }
      
      // Buscar endereço de origem para obter coordenadas
      const originAddress = await Address.findById(delivery.originAddressId);
      if (!originAddress) {
        console.error('Endereço de origem não encontrado para notificação');
        return;
      }
      
      const nearbyCouriers = await this.usersService.findNearbyCouriers({
        lat: originAddress.location.coordinates[1],
        lng: originAddress.location.coordinates[0],
      }, 3000); // 3km radius

      for (const courier of nearbyCouriers.data as Courier[]) {
        await this.notificationsService.sendNotification(
          courier._id.toString(),
          'Nova entrega disponível',
          `Entrega disponível perto de você: ${delivery.package.description}`
        );
      }
    } catch (error: any) {
      console.error(`Erro ao notificar entregadores: ${error.message}`);
    }
  }
}