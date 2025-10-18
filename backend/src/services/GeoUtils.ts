// src/utils/geoUtils.ts

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  // Implementação simplificada da fórmula de Haversine
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Arredondar para 2 casas decimais
}

function toRad(degrees: number): number {
  return degrees * (Math.PI/180);
}

export function isWithinRadius(
  point1: Coordinates, 
  point2: Coordinates, 
  radiusKm: number
): boolean {
  const distance = calculateDistance(point1, point2);
  return distance <= radiusKm;
}