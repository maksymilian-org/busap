import type { UserRoleType } from '../constants';

export interface UserCompanyMembership {
  companyId: string;
  role: UserRoleType;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  systemRole: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  companyMemberships?: UserCompanyMembership[];
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: string;
  companyId?: string;
  companyRole?: string;
  invitedById: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface CreateInvitationInput {
  email: string;
  role?: string;
  companyId?: string;
  companyRole?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyUser {
  id: string;
  userId: string;
  companyId: string;
  role: UserRoleType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithCompanies extends User {
  companies: (CompanyUser & { company: Company })[];
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredLanguage?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
}

export interface CreateCompanyInput {
  name: string;
  contactEmail: string;
  contactPhone?: string;
  description?: string;
  address?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  logoUrl?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive?: boolean;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
