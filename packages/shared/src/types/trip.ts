import type { TripStatusType } from '../constants';
import type { RouteWithDetails } from './route';
import type { Vehicle, VehiclePosition } from './vehicle';
import type { User } from './user';

export interface Trip {
  id: string;
  companyId: string;
  routeId: string;
  routeVersionId: string;
  vehicleId: string;
  driverId: string;
  scheduledDepartureTime: Date;
  scheduledArrivalTime: Date;
  actualDepartureTime?: Date;
  actualArrivalTime?: Date;
  status: TripStatusType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripWithDetails extends Trip {
  route?: RouteWithDetails;
  vehicle?: Vehicle;
  driver?: User;
  currentPosition?: VehiclePosition;
}

export interface TripStopTime {
  id: string;
  tripId: string;
  routeStopId: string;
  scheduledArrival: Date;
  scheduledDeparture: Date;
  actualArrival?: Date;
  actualDeparture?: Date;
}

export interface CreateTripInput {
  companyId: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  scheduledDepartureTime: Date;
  notes?: string;
}

export interface UpdateTripInput {
  vehicleId?: string;
  driverId?: string;
  scheduledDepartureTime?: Date;
  status?: TripStatusType;
  notes?: string;
}

export interface SearchTripsInput {
  companyId?: string;
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  status?: TripStatusType;
  fromDate?: Date;
  toDate?: Date;
  fromStopId?: string;
  toStopId?: string;
  limit?: number;
  offset?: number;
}

export interface DriverTripView {
  trip: TripWithDetails;
  stopTimes: TripStopTime[];
  nextStop?: {
    stopId: string;
    stopName: string;
    scheduledArrival: Date;
    estimatedArrival?: Date;
    distanceRemaining?: number;
  };
  progress: {
    completedStops: number;
    totalStops: number;
    percentComplete: number;
  };
}
