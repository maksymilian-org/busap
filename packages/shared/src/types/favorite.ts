export interface CompanyFavoriteStop {
  id: string;
  companyId: string;
  stopId: string;
  addedById: string;
  createdAt: Date;
}

export interface CompanyFavoriteRoute {
  id: string;
  companyId: string;
  routeId: string;
  addedById: string;
  createdAt: Date;
}
