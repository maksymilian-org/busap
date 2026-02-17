import { z } from 'zod';
import {
  UserRole,
  TripStatus,
  VehicleStatus,
  RouteType,
  PriceType,
  ExceptionType,
  SUPPORTED_LANGUAGES,
} from '../constants';

// Auth validators
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// User validators
export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  preferredLanguage: z.enum(SUPPORTED_LANGUAGES).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  preferredLanguage: z.enum(SUPPORTED_LANGUAGES).optional(),
});

// Company validators
export const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  description: z.string().max(1000).optional(),
  address: z.string().max(500).optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().max(1000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactPhone2: z.string().optional().or(z.literal('')),
  contactPhone3: z.string().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  website: z.string().url().max(500).optional().or(z.literal('')),
  facebookUrl: z.string().url().max(500).optional().or(z.literal('')),
  instagramUrl: z.string().url().max(500).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

// Stop validators
export const createStopSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  county: z.string().max(200).optional(),
  region: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  countryCode: z.string().max(2).optional(),
  formattedAddress: z.string().max(500).optional(),
  companyId: z.string().uuid().optional(),
});

export const updateStopSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  county: z.string().max(200).optional(),
  region: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  countryCode: z.string().max(2).optional(),
  formattedAddress: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const searchStopsSchema = z.object({
  query: z.string().optional(),
  companyId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Route validators
export const createRouteSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(200),
  nameOverridden: z.boolean().optional(),
  code: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  comment: z.string().max(500).optional(),
  type: z.enum([RouteType.LINEAR, RouteType.LOOP]),
});

export const updateRouteSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nameOverridden: z.boolean().optional(),
  code: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  comment: z.string().max(500).optional(),
  type: z.enum([RouteType.LINEAR, RouteType.LOOP]).optional(),
  isActive: z.boolean().optional(),
});

export const createRouteStopSchema = z.object({
  stopId: z.string().uuid(),
  sequenceNumber: z.number().int().nonnegative(),
  distanceFromStart: z.number().nonnegative(),
  durationFromStart: z.number().nonnegative(),
  isPickup: z.boolean().optional().default(true),
  isDropoff: z.boolean().optional().default(true),
  isMain: z.boolean().optional().default(false),
});

export const createRouteVersionSchema = z.object({
  routeId: z.string().uuid(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date().optional(),
  stops: z.array(createRouteStopSchema).min(2),
});

export const createRouteExceptionSchema = z.object({
  routeId: z.string().uuid(),
  type: z.enum([ExceptionType.TEMPORARY, ExceptionType.PERMANENT]),
  reason: z.string().min(1).max(500),
  affectedStopIds: z.array(z.string().uuid()),
  alternativeRouteId: z.string().uuid().optional(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date().optional(),
});

// Favorite validators
export const addFavoriteStopSchema = z.object({
  companyId: z.string().uuid(),
  stopId: z.string().uuid(),
});

export const removeFavoriteStopSchema = z.object({
  companyId: z.string().uuid(),
  stopId: z.string().uuid(),
});

export const addFavoriteRouteSchema = z.object({
  companyId: z.string().uuid(),
  routeId: z.string().uuid(),
});

export const removeFavoriteRouteSchema = z.object({
  companyId: z.string().uuid(),
  routeId: z.string().uuid(),
});

// Company News validators
export const createCompanyNewsSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
});

export const updateCompanyNewsSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

// Vehicle validators
export const createVehicleSchema = z.object({
  companyId: z.string().uuid(),
  registrationNumber: z.string().min(1).max(20),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  capacity: z.number().int().positive().max(200),
  photoUrl: z.string().url().optional(),
});

export const updateVehicleSchema = z.object({
  registrationNumber: z.string().min(1).max(20).optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  capacity: z.number().int().positive().max(200).optional(),
  photoUrl: z.string().url().optional(),
  status: z
    .enum([
      VehicleStatus.ACTIVE,
      VehicleStatus.INACTIVE,
      VehicleStatus.MAINTENANCE,
      VehicleStatus.OUT_OF_SERVICE,
    ])
    .optional(),
  isActive: z.boolean().optional(),
});

export const reportPositionSchema = z.object({
  vehicleId: z.string().uuid(),
  tripId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().positive().optional(),
});

// Trip validators
export const createTripSchema = z.object({
  companyId: z.string().uuid(),
  routeId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  scheduledDepartureTime: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

export const updateTripSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  scheduledDepartureTime: z.coerce.date().optional(),
  status: z
    .enum([
      TripStatus.SCHEDULED,
      TripStatus.IN_PROGRESS,
      TripStatus.COMPLETED,
      TripStatus.CANCELLED,
      TripStatus.DELAYED,
    ])
    .optional(),
  notes: z.string().max(500).optional(),
});

export const searchTripsSchema = z.object({
  companyId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  status: z
    .enum([
      TripStatus.SCHEDULED,
      TripStatus.IN_PROGRESS,
      TripStatus.COMPLETED,
      TripStatus.CANCELLED,
      TripStatus.DELAYED,
    ])
    .optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  fromStopId: z.string().uuid().optional(),
  toStopId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Price validators
export const createSegmentPriceSchema = z.object({
  fromStopId: z.string().uuid(),
  toStopId: z.string().uuid(),
  price: z.number().int().nonnegative(),
});

export const createPriceSchema = z.object({
  companyId: z.string().uuid(),
  routeId: z.string().uuid().optional(),
  type: z.enum([PriceType.FLAT, PriceType.PER_SEGMENT]),
  basePrice: z.number().int().nonnegative(),
  currency: z.string().length(3).optional().default('PLN'),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date().optional(),
  segments: z.array(createSegmentPriceSchema).optional(),
});

export const updatePriceSchema = z.object({
  basePrice: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  validTo: z.coerce.date().optional(),
});

export const calculatePriceSchema = z.object({
  routeId: z.string().uuid(),
  fromStopId: z.string().uuid(),
  toStopId: z.string().uuid(),
  passengers: z.number().int().positive().optional().default(1),
});

// ETA validators
export const etaRequestSchema = z.object({
  tripId: z.string().uuid(),
  stopId: z.string().uuid(),
});

export const etaBatchRequestSchema = z.object({
  tripId: z.string().uuid(),
  stopIds: z.array(z.string().uuid()).min(1),
});

// Role validators
export const userRoleSchema = z.enum([
  UserRole.PASSENGER,
  UserRole.DRIVER,
  UserRole.MANAGER,
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
]);

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  companyId: z.string().uuid(),
  role: userRoleSchema,
});

// Invitation validators
export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum([UserRole.PASSENGER, UserRole.DRIVER, UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN]).optional(),
  companyId: z.string().uuid().optional(),
  companyRole: z.enum([UserRole.PASSENGER, UserRole.DRIVER, UserRole.MANAGER, UserRole.OWNER]).optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

// Admin user creation
export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  systemRole: z.enum([UserRole.PASSENGER, UserRole.ADMIN]).optional(),
  preferredLanguage: z.enum(SUPPORTED_LANGUAGES).optional(),
});

// Pagination
export const paginationSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

// ID param
export const idParamSchema = z.object({
  id: z.string().uuid(),
});
