import type { RouteTypeType, ExceptionTypeType } from '../constants';
import type { Stop } from './stop';

export interface Route {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  description?: string;
  type: RouteTypeType;
  isActive: boolean;
  currentVersionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteVersion {
  id: string;
  routeId: string;
  versionNumber: number;
  validFrom: Date;
  validTo?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface RouteStop {
  id: string;
  routeVersionId: string;
  stopId: string;
  sequenceNumber: number;
  distanceFromStart: number; // in meters
  durationFromStart: number; // in minutes
  isPickup: boolean;
  isDropoff: boolean;
  stop?: Stop;
}

export interface RouteException {
  id: string;
  routeId: string;
  type: ExceptionTypeType;
  reason: string;
  affectedStopIds: string[];
  alternativeRouteId?: string;
  validFrom: Date;
  validTo?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteWithDetails extends Route {
  currentVersion?: RouteVersion & {
    stops: RouteStop[];
  };
  activeExceptions?: RouteException[];
}

export interface CreateRouteInput {
  companyId: string;
  name: string;
  code?: string;
  description?: string;
  type: RouteTypeType;
}

export interface UpdateRouteInput {
  name?: string;
  code?: string;
  description?: string;
  type?: RouteTypeType;
  isActive?: boolean;
}

export interface CreateRouteVersionInput {
  routeId: string;
  validFrom: Date;
  validTo?: Date;
  stops: CreateRouteStopInput[];
}

export interface CreateRouteStopInput {
  stopId: string;
  sequenceNumber: number;
  distanceFromStart: number;
  durationFromStart: number;
  isPickup?: boolean;
  isDropoff?: boolean;
}

export interface CreateRouteExceptionInput {
  routeId: string;
  type: ExceptionTypeType;
  reason: string;
  affectedStopIds: string[];
  alternativeRouteId?: string;
  validFrom: Date;
  validTo?: Date;
}
