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

export interface UserFavoriteCompany {
  id: string;
  userId: string;
  companyId: string;
  createdAt: Date;
}

export interface UserFavoriteRoute {
  id: string;
  userId: string;
  routeId: string;
  createdAt: Date;
}

export interface UserFavoriteStop {
  id: string;
  userId: string;
  stopId: string;
  createdAt: Date;
}
