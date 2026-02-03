import type { ETASourceType } from '../constants';

export interface ETA {
  tripId: string;
  stopId: string;
  scheduledArrival: Date;
  estimatedArrival: Date;
  source: ETASourceType;
  confidence: number; // 0-1
  delayMinutes: number;
  updatedAt: Date;
}

export interface ETARequest {
  tripId: string;
  stopId: string;
}

export interface ETABatchRequest {
  tripId: string;
  stopIds: string[];
}

export interface ETAResponse {
  eta: ETA;
  vehicle?: {
    latitude: number;
    longitude: number;
    speed?: number;
    lastUpdate: Date;
  };
}

export interface ETABatchResponse {
  tripId: string;
  etas: ETA[];
  vehicle?: {
    latitude: number;
    longitude: number;
    speed?: number;
    lastUpdate: Date;
  };
}

export interface LiveBusPosition {
  tripId: string;
  vehicleId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  nextStopId?: string;
  nextStopETA?: Date;
  status: string;
  updatedAt: Date;
}
