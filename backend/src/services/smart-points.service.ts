// src/services/smart-points.service.ts
import { SmartPoint, ISmartPoint, SmartPointStatus } from '../models/SmartPoint.model';

export interface CreateSmartPointDto {
  name: string;
  location: any;
  managerId: string;
  contactPhone: string;
  email?: string;
  capacity: number;
  services?: string[];
  facilities?: any;
  operatingHours?: any;
}

export interface UpdateSmartPointDto {
  name?: string;
  contactPhone?: string;
  email?: string;
  capacity?: number;
  services?: string[];
  facilities?: any;
  operatingHours?: any;
  status?: SmartPointStatus;
}

export class SmartPointsService {
  /**
   * Cria um novo ponto inteligente
   */
  async createSmartPoint(createSmartPointDto: CreateSmartPointDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISmartPoint 
  }> {
    try {
      const { name, location, managerId, capacity } = createSmartPointDto;

      // Verificar se já existe ponto com mesmo código ou nome na área
      const existingPoint = await SmartPoint.findOne({
        $or: [
          { name },
          { 
            location: {
              $near: {
                $geometry: location,
                $maxDistance: 100,
              },
            },
          },
        ],
      });

      if (existingPoint) {
        throw new Error('Já existe um ponto com este nome ou muito próximo');
      }

      // Gerar código único
      const code = await this.generateUniqueCode();

      const smartPointData: Partial<ISmartPoint> = {
        name: createSmartPointDto.name,
        location: createSmartPointDto.location,
        managerId: managerId as any,
        contactPhone: createSmartPointDto.contactPhone,
        email: createSmartPointDto.email,
        capacity: {
          total: capacity,
          available: capacity,
          reserved: 0,
        },
        services: createSmartPointDto.services || [],
        facilities: createSmartPointDto.facilities || {},
        operatingHours: createSmartPointDto.operatingHours || {},
        code,
        status: SmartPointStatus.ACTIVE,
      };

      const smartPoint = await SmartPoint.create(smartPointData);

      console.log(`Novo ponto inteligente criado: ${code} - ${name}`);

      return {
        success: true,
        message: 'Ponto inteligente criado com sucesso',
        data: smartPoint
      };
    } catch (error: any) {
      console.error(`Erro ao criar ponto inteligente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encontra pontos inteligentes próximos
   */
  async findNearbyPoints(
    coords: { lat: number; lng: number }, 
    radius: number = 5000,
    filters?: { 
      services?: string[];
      hasCapacity?: boolean;
      isOpen?: boolean;
    }
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISmartPoint[] 
  }> {
    try {
      const { lat, lng } = coords;

      const query: any = {
        status: SmartPointStatus.ACTIVE,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: radius,
          },
        },
      };

      // Aplicar filtros
      if (filters?.services && filters.services.length > 0) {
        query.services = { $in: filters.services };
      }

      if (filters?.hasCapacity) {
        query['capacity.available'] = { $gt: 0 };
      }

      const points = await SmartPoint.find(query)
        .populate('managerId', 'name phone')
        .exec();

      // Filtrar por horário de funcionamento se solicitado
      let filteredPoints = points;
      if (filters?.isOpen) {
        filteredPoints = points.filter(point => this.isPointOpen(point));
      }

      return {
        success: true,
        message: 'Pontos inteligentes próximos encontrados',
        data: filteredPoints
      };
    } catch (error: any) {
      console.error(`Erro ao buscar pontos próximos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza status de um ponto inteligente
   */
  async updateStatus(id: string, status: SmartPointStatus): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISmartPoint 
  }> {
    try {
      const updateData: any = { 
        status,
        updatedAt: new Date(),
      };

      if (status === SmartPointStatus.MAINTENANCE) {
        updateData.nextMaintenance = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      const smartPoint = await SmartPoint.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).exec();

      if (!smartPoint) {
        throw new Error('Ponto inteligente não encontrado');
      }

      console.log(`Status do ponto ${id} atualizado para: ${status}`);

      return {
        success: true,
        message: 'Status atualizado com sucesso',
        data: smartPoint
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar status do ponto ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza capacidade do ponto
   */
  async updateCapacity(
    id: string, 
    capacityUpdate: { total?: number; available?: number; reserved?: number }
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: ISmartPoint 
  }> {
    try {
      const updateData: any = { 
        updatedAt: new Date(),
      };
      
      if (capacityUpdate.total !== undefined) {
        updateData['capacity.total'] = capacityUpdate.total;
      }
      
      if (capacityUpdate.available !== undefined) {
        updateData['capacity.available'] = capacityUpdate.available;
      }
      
      if (capacityUpdate.reserved !== undefined) {
        updateData['capacity.reserved'] = capacityUpdate.reserved;
      }

      const smartPoint = await SmartPoint.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).exec();

      if (!smartPoint) {
        throw new Error('Ponto inteligente não encontrado');
      }

      console.log(`Capacidade do ponto ${id} atualizada`);

      return {
        success: true,
        message: 'Capacidade atualizada com sucesso',
        data: smartPoint
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar capacidade do ponto ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reserva capacidade no ponto
   */
  async reserveCapacity(id: string, quantity: number): Promise<{ 
    success: boolean; 
    message: string; 
    data: { reserved: boolean; availableAfter: number } 
  }> {
    const session = await SmartPoint.startSession();
    session.startTransaction();

    try {
      if (quantity <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      const smartPoint = await SmartPoint.findById(id).session(session);
      
      if (!smartPoint) {
        throw new Error('Ponto inteligente não encontrado');
      }

      if (smartPoint.capacity.available < quantity) {
        await session.abortTransaction();
        return {
          success: false,
          message: 'Capacidade insuficiente no ponto',
          data: { reserved: false, availableAfter: smartPoint.capacity.available }
        };
      }

      // Reservar capacidade
      smartPoint.capacity.available -= quantity;
      smartPoint.capacity.reserved += quantity;
      
      await smartPoint.save({ session });
      await session.commitTransaction();

      console.log(`Capacidade reservada no ponto ${id}: ${quantity} unidades`);

      return {
        success: true,
        message: 'Capacidade reservada com sucesso',
        data: { reserved: true, availableAfter: smartPoint.capacity.available }
      };
    } catch (error: any) {
      await session.abortTransaction();
      console.error(`Erro ao reservar capacidade no ponto ${id}: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Libera capacidade reservada no ponto
   */
  async releaseCapacity(id: string, quantity: number): Promise<{ 
    success: boolean; 
    message: string; 
  }> {
    const session = await SmartPoint.startSession();
    session.startTransaction();

    try {
      const smartPoint = await SmartPoint.findById(id).session(session);
      
      if (!smartPoint) {
        throw new Error('Ponto inteligente não encontrado');
      }

      if (smartPoint.capacity.reserved < quantity) {
        quantity = smartPoint.capacity.reserved;
      }

      // Liberar capacidade
      smartPoint.capacity.available += quantity;
      smartPoint.capacity.reserved -= quantity;
      
      await smartPoint.save({ session });
      await session.commitTransaction();

      console.log(`Capacidade liberada no ponto ${id}: ${quantity} unidades`);

      return {
        success: true,
        message: 'Capacidade liberada com sucesso',
      };
    } catch (error: any) {
      await session.abortTransaction();
      console.error(`Erro ao liberar capacidade no ponto ${id}: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Obtém estatísticas de utilização dos pontos
   */
  async getUtilizationStats(): Promise<{ 
    success: boolean; 
    message: string; 
    data: any 
  }> {
    try {
      const stats = await SmartPoint.aggregate([
        {
          $match: { status: SmartPointStatus.ACTIVE }
        },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: 1 },
            totalCapacity: { $sum: '$capacity.total' },
            totalAvailable: { $sum: '$capacity.available' },
            totalReserved: { $sum: '$capacity.reserved' },
            averageUtilization: { 
              $avg: { 
                $divide: [
                  { $subtract: ['$capacity.total', '$capacity.available'] },
                  '$capacity.total'
                ]
              } 
            },
          },
        },
      ]);

      const utilization = stats[0] || {
        totalPoints: 0,
        totalCapacity: 0,
        totalAvailable: 0,
        totalReserved: 0,
        averageUtilization: 0,
      };

      return {
        success: true,
        message: 'Estatísticas de utilização obtidas',
        data: utilization
      };
    } catch (error: any) {
      console.error(`Erro ao obter estatísticas de utilização: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera código único para ponto
   */
  private async generateUniqueCode(): Promise<string> {
    let code: string = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const number = (await SmartPoint.countDocuments()) + 1;
      code = `SP${number.toString().padStart(4, '0')}`;
      
      const existing = await SmartPoint.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      const timestamp = Date.now().toString().slice(-6);
      code = `SP${timestamp}`;
    }

    return code;
  }

  /**
   * Verifica se o ponto está aberto
   */
  private isPointOpen(point: ISmartPoint): boolean {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const hours = (point.operatingHours as any)[day];
    
    if (!hours || hours === 'Fechado') return false;
    
    const [open, close] = hours.split('-');
    return currentTime >= open && currentTime <= close;
  }
}