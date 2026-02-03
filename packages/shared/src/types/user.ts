import type { UserRoleType } from '../constants';

export interface User {
  id: string;
  appwriteId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  appwriteId: string;
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
