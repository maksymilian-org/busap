import type { VehicleStatusType } from '../constants';

export interface Vehicle {
  id: string;
  companyId: string;
  registrationNumber: string;
  brand?: string;
  model?: string;
  capacity: number;
  photoUrl?: string;
  status: VehicleStatusType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehiclePosition {
  id: string;
  vehicleId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  speed?: number; // km/h
  heading?: number; // degrees 0-360
  accuracy?: number; // meters
  timestamp: Date;
}

export interface VehicleWithPosition extends Vehicle {
  lastPosition?: VehiclePosition;
}

export interface CreateVehicleInput {
  companyId: string;
  registrationNumber: string;
  brand?: string;
  model?: string;
  capacity: number;
  photoUrl?: string;
}

export interface UpdateVehicleInput {
  registrationNumber?: string;
  brand?: string;
  model?: string;
  capacity?: number;
  photoUrl?: string;
  status?: VehicleStatusType;
  isActive?: boolean;
}

export interface ReportPositionInput {
  vehicleId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}
