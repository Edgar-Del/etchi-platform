// src/services/pricing.service.ts
export class PricingService {
  calculateDeliveryPrice(options: {
    distance: number;
    size: string;
    weight: number;
    deliveryType: string;
    urgency: string;
  }): {
    baseFee: number;
    distanceFee: number;
    sizeFee: number;
    urgencyFee: number;
    platformFee: number;
    insuranceFee: number;
    totalAmount: number;
  } {
    const baseFee = 500;
    const distanceFee = Math.round(options.distance * 150);
    
    const sizeMultipliers: any = {
      small: 1,
      medium: 1.3,
      large: 1.7,
      extra_large: 2.2,
    };
    
    const sizeFee = Math.round(baseFee * (sizeMultipliers[options.size] || 1));
    
    const urgencyMultipliers: any = {
      standard: 1,
      express: 1.5,
      urgent: 2,
    };
    
    const urgencyFee = Math.round(baseFee * (urgencyMultipliers[options.urgency] || 1));
    
    const platformFee = Math.round((baseFee + distanceFee + sizeFee + urgencyFee) * 0.15);
    const insuranceFee = Math.round(options.weight * 10);

    const totalAmount = baseFee + distanceFee + sizeFee + urgencyFee + platformFee + insuranceFee;

    return {
      baseFee,
      distanceFee,
      sizeFee,
      urgencyFee,
      platformFee,
      insuranceFee,
      totalAmount,
    };
  }
}