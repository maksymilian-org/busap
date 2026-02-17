export interface CompanyNews {
  id: string;
  companyId: string;
  title: string;
  content: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  publishedAt?: Date | null;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
