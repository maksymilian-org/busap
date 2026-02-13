export interface Stop {
  id: string;
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  county?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  formattedAddress?: string;
  companyId?: string; // null = global stop
  createdById?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StopWithDistance extends Stop {
  distance?: number; // distance from user in meters
}

export interface CreateStopInput {
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  county?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  formattedAddress?: string;
  companyId?: string;
}

export interface UpdateStopInput {
  name?: string;
  code?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
  county?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  formattedAddress?: string;
  isActive?: boolean;
}

export interface SearchStopsInput {
  query?: string;
  companyId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in meters
  limit?: number;
  offset?: number;
}
