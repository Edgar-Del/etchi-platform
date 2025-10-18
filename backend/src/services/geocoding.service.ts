// src/services/geocoding.service.ts
import axios from 'axios';

// Interfaces for Google Maps API responses
interface GoogleGeocodingResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

interface GoogleDistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      status: string;
      distance?: {
        value: number;
        text: string;
      };
      duration?: {
        value: number;
        text: string;
      };
    }>;
  }>;
  status: string;
}

export class GeocodingService {
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Usar Google Maps Geocoding API
      const response = await axios.get<GoogleGeocodingResponse>(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address,
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        }
      );

      if (response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      return null;
    } catch (error: any) {
      console.error(`Erro no geocoding para endereço: ${address}`, error.message);
      return null;
    }
  }

  async calculateDistance(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<{ distance: number; duration: number }> {
    try {
      // Usar Google Distance Matrix API
      const response = await axios.get<GoogleDistanceMatrixResponse>(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: `${origin.lat},${origin.lng}`,
            destinations: `${destination.lat},${destination.lng}`,
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        }
      );

      if (response.data.rows[0].elements[0].status === 'OK') {
        const element = response.data.rows[0].elements[0];
        return {
          distance: (element.distance?.value || 0) / 1000,
          duration: (element.duration?.value || 0) / 60,
        };
      }

      return { distance: 0, duration: 0 };
    } catch (error: any) {
      console.error('Erro no cálculo de distância:', error.message);
      return { distance: 0, duration: 0 };
    }
  }
}