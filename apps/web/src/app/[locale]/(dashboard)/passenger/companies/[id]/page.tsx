'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Star, Building2, ExternalLink, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Link } from '@/i18n/navigation';

interface CompanyDetail {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  email?: string;
  website?: string;
  isActive: boolean;
}

interface RouteData {
  id: string;
  name: string;
  code?: string;
  type: string;
  isActive: boolean;
}

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('dashboard.companies.detail');
  const { user } = useAuth();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [companyData, routesData] = await Promise.all([
        api.fetch<CompanyDetail>(`/companies/${params.id}`),
        api.fetch<RouteData[]>(`/routes?companyId=${params.id}`),
      ]);
      setCompany(companyData);
      setRoutes(Array.isArray(routesData) ? routesData : []);

      if (user) {
        try {
          const favCompanies = await api.fetch<any[]>('/favorites/companies');
          setIsFavorite(favCompanies.some((f: any) => (f.id || f.companyId || f.company?.id) === params.id));
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    } finally {
      setLoading(false);
    }
  }, [params.id, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleFavorite = async () => {
    if (!user || !company) return;
    try {
      if (isFavorite) {
        await api.fetch(`/favorites/companies/${company.id}`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        await api.fetch(`/favorites/companies/${company.id}`, { method: 'POST' });
        setIsFavorite(true);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!company) {
    return <div className="py-12 text-center text-muted-foreground">Company not found</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/passenger/companies" className="text-sm text-muted-foreground hover:text-foreground">
        {t('backToCompanies')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">{company.slug}</span>
              {company.email && <span className="text-sm text-muted-foreground">· {company.email}</span>}
            </div>
            {company.description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-lg">{company.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                {t('publicPage')}
              </Button>
            </a>
          )}
          {!company.website && company.slug && (
            <Link href={`/c/${company.slug}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                {t('publicPage')}
              </Button>
            </Link>
          )}
          {user && (
            <Button variant="outline" size="sm" onClick={toggleFavorite}>
              <Star className={`h-4 w-4 mr-1 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {isFavorite ? 'Ulubiona' : 'Dodaj do ulubionych'}
            </Button>
          )}
        </div>
      </div>

      {/* Routes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('routes', { count: routes.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noRoutes')}</p>
          ) : (
            <div className="space-y-2">
              {routes.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                      <Bus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Link href={`/passenger/routes/${r.id}`} className="font-medium hover:underline">
                        {r.name}
                        {r.code && <span className="ml-1 text-xs text-muted-foreground">({r.code})</span>}
                      </Link>
                      <div className="text-xs text-muted-foreground">{r.type}</div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {r.isActive ? 'Aktywna' : 'Nieaktywna'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
