export const UserRole = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  MANAGER: 'manager',
  OWNER: 'owner',
  SUPERADMIN: 'superadmin',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const TripStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
} as const;

export type TripStatusType = (typeof TripStatus)[keyof typeof TripStatus];

export const VehicleStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  OUT_OF_SERVICE: 'out_of_service',
} as const;

export type VehicleStatusType = (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const RouteType = {
  LINEAR: 'linear',
  LOOP: 'loop',
} as const;

export type RouteTypeType = (typeof RouteType)[keyof typeof RouteType];

export const PriceType = {
  FLAT: 'flat',
  PER_SEGMENT: 'per_segment',
} as const;

export type PriceTypeType = (typeof PriceType)[keyof typeof PriceType];

export const ETASource = {
  SCHEDULE: 'schedule',
  GPS: 'gps',
  HISTORICAL: 'historical',
  TRAFFIC: 'traffic',
} as const;

export type ETASourceType = (typeof ETASource)[keyof typeof ETASource];

export const ExceptionType = {
  TEMPORARY: 'temporary',
  PERMANENT: 'permanent',
} as const;

export type ExceptionTypeType = (typeof ExceptionType)[keyof typeof ExceptionType];

export const SUPPORTED_LANGUAGES = ['pl', 'en', 'ua', 'de', 'it', 'fr', 'es', 'be'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'pl';
