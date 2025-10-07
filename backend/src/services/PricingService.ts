export class PricingService {
  private readonly BASE_RATE = 200; // Kwanzas por km
  private readonly MIN_PRICE = 500; // Mínimo
  
  calculatePrice(params: {
    distanceKm: number;
    weight: number;
    packageSize: string;
    deliverySpeed: string;
    isDeclaredValue: boolean;
    declaredValue?: number;
  }): {
    basePrice: number;
    urgencyFee: number;
    insuranceFee: number;
    platformFee: number;
    finalPrice: number;
    delivererEarnings: number;
  } {
    const { distanceKm, weight, deliverySpeed, isDeclaredValue, declaredValue } = params;
    
    // 1. Preço base (distância + peso)
    let basePrice = distanceKm * this.BASE_RATE;
    basePrice += weight * 50; // 50 Kz por kg
    
    // 2. Taxa de urgência
    let urgencyFee = 0;
    switch (deliverySpeed) {
      case 'EXPRESS':
        urgencyFee = basePrice * 1.5; // 150% a mais
        break;
      case 'SAME_DAY':
        urgencyFee = basePrice * 0.5; // 50% a mais
        break;
      case 'ECONOMIC':
        urgencyFee = -basePrice * 0.3; // 30% desconto
        break;
    }
    
    // 3. Seguro (se tiver valor declarado)
    let insuranceFee = 0;
    if (isDeclaredValue && declaredValue) {
      insuranceFee = declaredValue * 0.02; // 2% do valor
    }
    
    // 4. Taxa da plataforma (20%)
    const subtotal = Math.max(this.MIN_PRICE, basePrice + urgencyFee + insuranceFee);
    const platformFee = subtotal * 0.20;
    
    // 5. Preço final
    const finalPrice = subtotal + platformFee;
    
    // 6. Ganhos do entregador (80% do subtotal)
    const delivererEarnings = subtotal * 0.80;
    
    return {
      basePrice,
      urgencyFee,
      insuranceFee,
      platformFee,
      finalPrice: Math.round(finalPrice),
      delivererEarnings: Math.round(delivererEarnings)
    };
  }
  
  // Pricing dinâmico baseado em demanda
  applyDynamicPricing(basePrice: number, demandFactor: number): number {
    // demandFactor: 0.5 (baixa demanda) a 2.0 (alta demanda)
    return basePrice * demandFactor;
  }
}
