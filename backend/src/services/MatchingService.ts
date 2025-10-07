interface MatchingCriteria {
  orderId: string;
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  packageSize: string;
  weight: number;
  deliverySpeed: string;
}

interface DelivererScore {
  delivererId: string;
  score: number;
  reasons: string[];
  estimatedPickupTime: number;
}

export class MatchingService {
  // Algoritmo de matching inteligente
  async findBestDeliverers(criteria: MatchingCriteria): Promise<DelivererScore[]> {
    const { pickupLat, pickupLng, packageSize, weight, deliverySpeed } = criteria;
    
    // 1. Buscar entregadores disponíveis próximos
    const availableDeliverers = await this.getAvailableDeliverersNearby(
      pickupLat,
      pickupLng,
      10 // raio em km
    );
    
    // 2. Calcular score para cada entregador
    const scoredDeliverers = await Promise.all(
      availableDeliverers.map(async (deliverer) => {
        let score = 100;
        const reasons: string[] = [];
        
        // Distância (40 pontos)
        const distance = this.calculateDistance(
          pickupLat,
          pickupLng,
          deliverer.currentLat!,
          deliverer.currentLng!
        );
        const distanceScore = Math.max(0, 40 - distance * 4);
        score += distanceScore;
        reasons.push(`${distance.toFixed(1)}km de distância`);
        
        // Rating (30 pontos)
        const ratingScore = (deliverer.rating / 5) * 30;
        score += ratingScore;
        reasons.push(`Rating ${deliverer.rating}/5.0`);
        
        // Taxa de conclusão (20 pontos)
        const completionRate = deliverer.completedDeliveries / 
          (deliverer.totalDeliveries || 1);
        score += completionRate * 20;
        
        // Capacidade do veículo (10 pontos)
        const capacityMatch = this.checkCapacity(deliverer, weight, packageSize);
        if (capacityMatch) {
          score += 10;
          reasons.push('Veículo compatível');
        }
        
        return {
          delivererId: deliverer.id,
          score,
          reasons,
          estimatedPickupTime: Math.ceil(distance / 30 * 60) // assumindo 30km/h média
        };
      })
    );
    
    // 3. Ordenar por score
    return scoredDeliverers
      .filter(d => d.score >= 50) // mínimo de 50 pontos
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // top 10
  }
  
  // Cálculo de distância Haversine
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  private async getAvailableDeliverersNearby(lat: number, lng: number, radiusKm: number) {
    // Implementação com Prisma
    return [];
  }
  
  private checkCapacity(deliverer: any, weight: number, packageSize: string): boolean {
    return deliverer.maxWeight >= weight;
  }
}