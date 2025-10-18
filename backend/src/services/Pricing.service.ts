// src/services/Pricing.service.ts
export class PricingService {
  calculateDeliveryFee(
    distance: number,
    size: 'small' | 'medium' | 'large' | 'extra_large',
    weight: number,
    province: string
  ): number {
    const baseRates: { [key: string]: number } = {
      'Luanda': 750,
      'Benguela': 600,
      'Huíla': 550,
      'default': 500
    };
    
    const baseRate = baseRates[province] || baseRates.default;
    const distanceRate = distance * 200; // 200 KZ/km
    
    const sizeMultipliers = {
      'small': 1,
      'medium': 1.4,
      'large': 1.8,
      'extra_large': 2.5
    };
    
    return Math.round((baseRate + distanceRate) * (sizeMultipliers[size] || 1));
  }
}