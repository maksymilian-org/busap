export interface AuditLog {
  id: string;
  userId: string;
  companyId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  userId: string;
  companyId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SearchAuditLogsInput {
  userId?: string;
  companyId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}
