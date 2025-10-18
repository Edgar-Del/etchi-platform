// src/services/addresses.service.ts
import { Address, IAddress, AddressType } from '../models/Address.model';
import { GeocodingService } from './geocoding.service';

export interface CreateAddressDto {
  userId: string;
  label: string;
  contactName: string;
  contactPhone: string;
  addressType: AddressType;
  street: string;
  number?: string;
  neighborhood: string;
  municipality: string;
  province: string;
  referencePoint?: string;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  label?: string;
  contactName?: string;
  contactPhone?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  municipality?: string;
  province?: string;
  referencePoint?: string;
  isDefault?: boolean;
}

export class AddressesService {
  private geocodingService: GeocodingService;

  constructor() {
    this.geocodingService = new GeocodingService();
  }

  /**
   * Cria um novo endereço
   */
  async create(createAddressDto: CreateAddressDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: IAddress 
  }> {
    try {
      const { userId, street, neighborhood, municipality, province, addressType } = createAddressDto;

      // Geocodificação do endereço
      const fullAddress = `${street}, ${neighborhood}, ${municipality}, ${province}, Angola`;
      const coordinates = await this.geocodingService.geocodeAddress(fullAddress);

      if (!coordinates) {
        throw new Error('Não foi possível geocodificar o endereço');
      }

      const addressData: Partial<IAddress> = {
        ...createAddressDto,
        userId: userId as any,
        location: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat]
        },
        country: 'Angola'
      };

      // Se for o primeiro endereço ou marcado como padrão, definir como default
      if (createAddressDto.isDefault) {
        await Address.updateMany(
          { userId, isDefault: true },
          { $set: { isDefault: false } }
        );
      } else {
        const existingAddresses = await Address.countDocuments({ userId });
        addressData.isDefault = existingAddresses === 0;
      }

      const address = await Address.create(addressData);

      console.log(`Novo endereço criado para usuário: ${userId}`);

      return {
        success: true,
        message: 'Endereço criado com sucesso',
        data: address
      };
    } catch (error: any) {
      console.error(`Erro ao criar endereço: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encontra todos os endereços de um usuário
   */
  async findAllByUser(userId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: IAddress[] 
  }> {
    try {
      const addresses = await Address
        .find({ userId, isActive: true })
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();

      return {
        success: true,
        message: 'Endereços encontrados com sucesso',
        data: addresses
      };
    } catch (error: any) {
      console.error(`Erro ao buscar endereços do usuário ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza um endereço
   */
  async update(id: string, updateAddressDto: UpdateAddressDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: IAddress 
  }> {
    try {
      const address = await Address.findById(id);
      if (!address) {
        throw new Error('Endereço não encontrado');
      }

      // Se estiver definindo como padrão, atualizar outros endereços
      if (updateAddressDto.isDefault) {
        await Address.updateMany(
          { userId: address.userId, _id: { $ne: id } },
          { $set: { isDefault: false } }
        );
      }

      // Geocodificação se o endereço mudou
      if (updateAddressDto.street || updateAddressDto.neighborhood || 
          updateAddressDto.municipality || updateAddressDto.province) {
        
        const street = updateAddressDto.street || address.street;
        const neighborhood = updateAddressDto.neighborhood || address.neighborhood;
        const municipality = updateAddressDto.municipality || address.municipality;
        const province = updateAddressDto.province || address.province;

        const fullAddress = `${street}, ${neighborhood}, ${municipality}, ${province}, Angola`;
        const coordinates = await this.geocodingService.geocodeAddress(fullAddress);

        if (coordinates) {
          (updateAddressDto as any).location = {
            type: 'Point',
            coordinates: [coordinates.lng, coordinates.lat]
          };
        }
      }

      const updatedAddress = await Address.findByIdAndUpdate(
        id,
        { 
          $set: updateAddressDto,
          $currentDate: { updatedAt: true }
        },
        { new: true, runValidators: true }
      ).exec();

      if (!updatedAddress) {
        throw new Error('Endereço não encontrado');
      }

      return {
        success: true,
        message: 'Endereço atualizado com sucesso',
        data: updatedAddress
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar endereço ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove um endereço
   */
  async remove(id: string): Promise<{ 
    success: boolean; 
    message: string; 
  }> {
    try {
      const address = await Address.findById(id);
      if (!address) {
        throw new Error('Endereço não encontrado');
      }

      // Se for o endereço padrão, definir outro como padrão
      if (address.isDefault) {
        const anotherAddress = await Address.findOne({ 
          userId: address.userId, 
          _id: { $ne: id },
          isActive: true 
        });

        if (anotherAddress) {
          anotherAddress.isDefault = true;
          await anotherAddress.save();
        }
      }

      // Soft delete
      await Address.findByIdAndUpdate(id, { 
        isActive: false,
        $currentDate: { updatedAt: true }
      });

      console.log(`Endereço removido: ${id}`);

      return {
        success: true,
        message: 'Endereço removido com sucesso'
      };
    } catch (error: any) {
      console.error(`Erro ao remover endereço ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Define um endereço como padrão
   */
  async setDefaultAddress(id: string, userId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: IAddress 
  }> {
    try {
      // Remover padrão de outros endereços
      await Address.updateMany(
        { userId, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );

      // Definir novo endereço como padrão
      const address = await Address.findByIdAndUpdate(
        id,
        { 
          $set: { isDefault: true },
          $currentDate: { updatedAt: true }
        },
        { new: true }
      ).exec();

      if (!address) {
        throw new Error('Endereço não encontrado');
      }

      console.log(`Endereço definido como padrão: ${id} para usuário: ${userId}`);

      return {
        success: true,
        message: 'Endereço definido como padrão com sucesso',
        data: address
      };
    } catch (error: any) {
      console.error(`Erro ao definir endereço padrão ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encontra endereços por proximidade
   */
  async findNearbyAddresses(
    coords: { lat: number; lng: number }, 
    radius: number = 1000
  ): Promise<{ 
    success: boolean; 
    message: string; 
    data: IAddress[] 
  }> {
    try {
      const { lat, lng } = coords;

      const addresses = await Address.find({
        isActive: true,
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
      .populate('userId', 'name phone')
      .exec();

      return {
        success: true,
        message: 'Endereços próximos encontrados com sucesso',
        data: addresses
      };
    } catch (error: any) {
      console.error(`Erro ao buscar endereços próximos: ${error.message}`);
      throw error;
    }
  }
}