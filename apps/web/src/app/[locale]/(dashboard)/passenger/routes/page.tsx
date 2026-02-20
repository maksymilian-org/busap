'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Star, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { fuzzyFilter } from '@/lib/fuzzy-search';
import { Link } from '@/i18n/navigation';

interface RouteData {
  id: string;
  name: string;
  code?: string;
  type: string;
  isActive: boolean;
  company: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  currentVersion?: {
    stops: Array<{
      stop: { id: string; name: string; city?: string };
      sequenceNumber: number;
    }>;
  };
}

export default function PassengerRoutesPage() {
  const t = useTranslations('dashboard.routes');
  const { user } = useAuth();

  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [favoriteRouteIds, setFavoriteRouteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [routesData, favData] = await Promise.all([
        api.fetch<RouteData[]>('/routes'),
        user ? api.fetch<{ id: string }[]>('/favorites/routes').catch(() => []) : Promise.resolve([]),
      ]);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setFavoriteRouteIds(new Set((favData as any[]).map((f: any) => f.id || f.routeId || f.route?.id)));
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleFavorite = async (routeId: string) => {
    if (!user) return;
    const isFav = favoriteRouteIds.has(routeId);
    try {
      if (isFav) {
        await api.fetch(`/favorites/routes/${routeId}`, { method: 'DELETE' });
        setFavoriteRouteIds((prev) => { const s = new Set(prev); s.delete(routeId); return s; });
      } else {
        await api.fetch(`/favorites/routes/${routeId}`, { method: 'POST' });
        setFavoriteRouteIds((prev) => new Set([...prev, routeId]));
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  const companies = Array.from(new Map(routes.map((r) => [r.company.id, r.company])).values());

  const afterSearch = search
    ? fuzzyFilter(routes, search, [(r) => r.name, (r) => r.code, (r) => r.company.name])
    : routes;

  const filtered = afterSearch.filter((r) => {
    if (filterCompany && r.company.id !== filterCompany) return false;
    if (filterType && r.type !== filterType) return false;
    return true;
  });

  const favoriteRoutes = filtered.filter((r) => favoriteRouteIds.has(r.id));
  const allRoutes = filtered;

  const RouteCard = ({ route }: { route: RouteData }) => (
    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {route.company.logoUrl ? (
          <img src={route.company.logoUrl} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 flex-shrink-0">
            <Bus className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <Link href={`/passenger/routes/${route.id}`} className="font-medium hover:underline block truncate">
            {route.name}
            {route.code && <span className="ml-2 text-xs text-muted-foreground">({route.code})</span>}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href={`/passenger/companies/${route.company.id}`} className="hover:underline">
              {route.company.name}
            </Link>
            <span>·</span>
            <span>{route.type}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          route.isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }`}>
          {route.isActive ? 'Aktywna' : 'Nieaktywna'}
        </span>
        {user && (
          <Button variant="ghost" size="sm" onClick={() => toggleFavorite(route.id)}>
            <Star className={`h-4 w-4 ${favoriteRouteIds.has(route.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle', { count: routes.length })}</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
        >
          <option value="">{t('filterAll')} — {t('filterCompany')}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">{t('filterAll')} — {t('filterType')}</option>
          <option value="linear">Linear</option>
          <option value="loop">Loop</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Favorites section */}
          {user && favoriteRoutes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{t('favorites')}</h2>
              <div className="space-y-2">
                {favoriteRoutes.map((r) => <RouteCard key={r.id} route={r} />)}
              </div>
            </div>
          )}

          {/* All routes */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {t('title')} ({allRoutes.length})
            </h2>
            {allRoutes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t('noRoutes')}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {allRoutes.map((r) => <RouteCard key={r.id} route={r} />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
