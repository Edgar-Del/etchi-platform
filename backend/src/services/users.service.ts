// src/services/users.service.ts
import { User, IUser, UserType } from '../models/User.model';

export interface UpdateUserDto {
  name?: string;
  photo?: string;
  preferences?: {
    pushNotifications?: boolean;
    emailNotifications?: boolean;
    language?: string;
    currency?: string;
  };
}

export interface LocationDto {
  lat: number;
  lng: number;
}

export class UsersService {
  /**
   * Encontra todos os usuários com filtros opcionais
   */
  async findAll(filters?: { 
    userType?: UserType; 
    isActive?: boolean;
    verificationStatus?: string;
  }): Promise<{ 
    success: boolean; 
    message: string; 
    data: IUser[] 
  }> {
    try {
      const query: any = {};
      
      if (filters?.userType) query.userType = filters.userType;
      if (filters?.isActive !== undefined) query.isActive = filters.isActive;
      if (filters?.verificationStatus) query.verificationStatus = filters.verificationStatus;

      const users = await User.find(query).exec();

      return {
        success: true,
        message: 'Usuários encontrados com sucesso',
        data: users
      };
    } catch (error: any) {
      console.error(`Erro ao buscar usuários: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encontra usuário por ID
   */
  async findById(id: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: IUser 
  }> {
    try {
      const user = await User.findById(id).exec();
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return {
        success: true,
        message: 'Usuário encontrado com sucesso',
        data: user
      };
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: IUser 
  }> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { 
          $set: updateUserDto,
          $currentDate: { updatedAt: true }
        },
        { new: true, runValidators: true }
      ).exec();

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      console.log(`Perfil atualizado: ${user.email}`);

      return {
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: user
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar perfil ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza localização do usuário
   */
  async updateLocation(id: string, locationDto: LocationDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: IUser 
  }> {
    try {
      const { lat, lng } = locationDto;

      const user = await User.findByIdAndUpdate(
        id,
        { 
          location: {
            type: 'Point',
            coordinates: [lng, lat] // GeoJSON: [longitude, latitude]
          },
          $currentDate: { updatedAt: true, lastActive: true }
        },
        { new: true }
      ).exec();

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      console.log(`Localização atualizada para usuário: ${user.email}`);

      return {
        success: true,
        message: 'Localização atualizada com sucesso',
        data: user
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar localização ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encontra entregadores próximos a uma localização
   */
  async findNearbyCouriers(
    coords: { lat: number; lng: number }, 
    radius: number = 5000
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: IUser[] 
  }> {
    try {
      const { lat, lng } = coords;

      const couriers = await User.find({
        userType: UserType.DELIVERY_PARTNER,
        isActive: true,
        'travelerProfile.isAvailable': true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius
          }
        }
      })
      .select('name email phone location travelerProfile rating')
      .exec();

      return {
        success: true,
        message: 'Entregadores próximos encontrados com sucesso',
        data: couriers
      };
    } catch (error: any) {
      console.error(`Erro ao buscar entregadores próximos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza disponibilidade do entregador
   */
  async updateCourierAvailability(
    id: string, 
    isAvailable: boolean
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: IUser 
  }> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { 
          'travelerProfile.isAvailable': isAvailable,
          $currentDate: { updatedAt: true }
        },
        { new: true }
      ).exec();

      if (!user || user.userType !== UserType.DELIVERY_PARTNER) {
        throw new Error('Entregador não encontrado');
      }

      console.log(`Disponibilidade atualizada para: ${user.email} - ${isAvailable}`);

      return {
        success: true,
        message: `Disponibilidade ${isAvailable ? 'ativada' : 'desativada'} com sucesso`,
        data: user
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar disponibilidade ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desativa conta de usuário
   */
  async deactivateUser(id: string): Promise<{ 
    success: boolean; 
    message: string; 
  }> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { 
          isActive: false,
          $currentDate: { updatedAt: true }
        }
      ).exec();

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      console.log(`Usuário desativado: ${user.email}`);

      return {
        success: true,
        message: 'Conta desativada com sucesso'
      };
    } catch (error: any) {
      console.error(`Erro ao desativar usuário ${id}: ${error.message}`);
      throw error;
    }
  }
}