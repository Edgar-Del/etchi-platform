import { Package, IPackage, PackageStatus, PackageSize } from '../models/Package.model';
import { User } from '../models/User.model';
import { calculateDistance } from '../utils/geoUtils';

interface CreatePackageData {
  senderId: string;
  itemName: string;
  description?: string;
  size: PackageSize;
  weight: number;
  value: number;
  images: string[];
  pickupAddress: any;
  deliveryAddress: any;
}

interface OfferData {
  travelerId: string;
  amount: number;
  message?: string;
  estimatedArrival: number;
}

export class PackageService {
  async createPackage(data: CreatePackageData): Promise<IPackage> {
    // Calcular distância e preço
    const distance = await calculateDistance(
      data.pickupAddress,
      data.deliveryAddress
    );
    
    const pricing = this.calculatePricing(distance, data.size, data.weight);
    
    const newPackage = await Package.create({
      ...data,
      estimatedDistance: distance,
      estimatedDuration: Math.round(distance * 3), // Estimativa: 3 min/km
      deliveryFee: pricing.deliveryFee,
      platformFee: pricing.platformFee,
      totalAmount: pricing.totalAmount,
      timeline: [{
        status: PackageStatus.PENDING,
        description: 'Pedido criado e aguardando propostas'
      }]
    });
    
    return newPackage;
  }
  
  async getAvailablePackages(travelerId: string, filters: any = {}) {
    const traveler = await User.findById(travelerId);
    if (!traveler?.travelerProfile?.currentLocation) {
      throw new Error('Traveler location not available');
    }
    
    const query: any = {
      status: PackageStatus.PENDING,
      'offers.travelerId': { $ne: travelerId } // Não mostrar pacotes já oferecidos
    };
    
    // Filtros por tamanho, distância, etc.
    if (filters.size) query.size = filters.size;
    if (filters.maxDistance) {
      // Implementar filtro por distância geográfica
    }
    
    const packages = await Package.find(query)
      .populate('senderId', 'name profilePhoto')
      .sort({ createdAt: -1 });
    
    return packages;
  }
  
  async makeOffer(packageId: string, offerData: OfferData): Promise<IPackage> {
    const packageDoc = await Package.findById(packageId);
    if (!packageDoc) {
      throw new Error('Package not found');
    }
    
    if (packageDoc.status !== PackageStatus.PENDING) {
      throw new Error('Package not available for offers');
    }
    
    // Verificar se já fez proposta
    const existingOffer = packageDoc.offers.find(
      offer => offer.travelerId.toString() === offerData.travelerId
    );
    
    if (existingOffer) {
      throw new Error('Offer already made for this package');
    }
    
    packageDoc.offers.push({
      ...offerData,
      createdAt: new Date()
    });
    
    await packageDoc.save();
    
    return packageDoc;
  }
  
  async acceptOffer(packageId: string, travelerId: string): Promise<IPackage> {
    const packageDoc = await Package.findById(packageId);
    if (!packageDoc) {
      throw new Error('Package not found');
    }
    
    if (packageDoc.senderId.toString() !== travelerId) {
      throw new Error('Only sender can accept offers');
    }
    
    const offer = packageDoc.offers.find(
      o => o.travelerId.toString() === travelerId
    );
    
    if (!offer) {
      throw new Error('Offer not found');
    }
    
    packageDoc.travelerId = offer.travelerId;
    packageDoc.status = PackageStatus.ACCEPTED;
    packageDoc.deliveryFee = offer.amount;
    packageDoc.totalAmount = offer.amount + packageDoc.platformFee;
    
    packageDoc.timeline.push({
      status: PackageStatus.ACCEPTED,
      description: `Proposta aceita de ${travelerId}`
    });
    
    await packageDoc.save();
    
    return packageDoc;
  }
  
  async updatePackageStatus(
    packageId: string, 
    status: PackageStatus, 
    travelerId: string,
    location?: { latitude: number; longitude: number }
  ): Promise<IPackage> {
    const packageDoc = await Package.findById(packageId);
    if (!packageDoc) {
      throw new Error('Package not found');
    }
    
    if (packageDoc.travelerId?.toString() !== travelerId) {
      throw new Error('Not authorized to update this package');
    }
    
    packageDoc.status = status;
    
    const statusDescriptions = {
      [PackageStatus.PICKED_UP]: 'Pacote recolhido pelo traveler',
      [PackageStatus.IN_TRANSIT]: 'Pacote a caminho do destino',
      [PackageStatus.DELIVERED]: 'Pacote entregue com sucesso'
    };
    
    packageDoc.timeline.push({
      status,
      description: statusDescriptions[status] || `Status atualizado para ${status}`,
      location
    });
    
    // Se entregue, atualizar estatísticas do traveler
    if (status === PackageStatus.DELIVERED) {
      await this.updateTravelerStats(travelerId);
    }
    
    await packageDoc.save();
    return packageDoc;
  }
  
  private async updateTravelerStats(travelerId: string): Promise<void> {
    const traveler = await User.findById(travelerId);
    if (traveler && traveler.travelerProfile) {
      const completedPackages = await Package.countDocuments({
        travelerId,
        status: PackageStatus.DELIVERED
      });
      
      traveler.travelerProfile.totalDeliveries = completedPackages;
      await traveler.save();
    }
  }
  
  private calculatePricing(distance: number, size: PackageSize, weight: number) {
    const baseRate = 500; // KZ base
    const distanceRate = distance * 150; // 150 KZ/km
    const sizeMultiplier = {
      [PackageSize.SMALL]: 1,
      [PackageSize.MEDIUM]: 1.3,
      [PackageSize.LARGE]: 1.7,
      [PackageSize.EXTRA_LARGE]: 2.2
    };
    
    const deliveryFee = Math.round((baseRate + distanceRate) * sizeMultiplier[size]);
    const platformFee = Math.round(deliveryFee * 0.15); // 15% platform fee
    const totalAmount = deliveryFee + platformFee;
    
    return { deliveryFee, platformFee, totalAmount };
  }
}

export const packageService = new PackageService();