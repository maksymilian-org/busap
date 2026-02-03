import type { PriceTypeType } from '../constants';

export interface Price {
  id: string;
  companyId: string;
  routeId?: string; // null = company default
  type: PriceTypeType;
  basePrice: number; // in cents/grosze
  currency: string;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentPrice {
  id: string;
  priceId: string;
  fromStopId: string;
  toStopId: string;
  price: number; // in cents/grosze
}

export interface PriceWithSegments extends Price {
  segments?: SegmentPrice[];
}

export interface CreatePriceInput {
  companyId: string;
  routeId?: string;
  type: PriceTypeType;
  basePrice: number;
  currency?: string;
  validFrom: Date;
  validTo?: Date;
  segments?: CreateSegmentPriceInput[];
}

export interface CreateSegmentPriceInput {
  fromStopId: string;
  toStopId: string;
  price: number;
}

export interface UpdatePriceInput {
  basePrice?: number;
  isActive?: boolean;
  validTo?: Date;
}

export interface CalculatePriceInput {
  routeId: string;
  fromStopId: string;
  toStopId: string;
  passengers?: number;
}

export interface PriceCalculationResult {
  unitPrice: number;
  totalPrice: number;
  currency: string;
  priceType: PriceTypeType;
  segments?: {
    fromStopId: string;
    toStopId: string;
    price: number;
  }[];
}
