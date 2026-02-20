'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Route as RouteIcon, Plus, Edit, Trash2, Calendar, Copy, ChevronDown, ChevronRight, ArrowLeftRight, Star } from 'lucide-react';
import { RouteSchedulesSection } from '@/components/routes/RouteSchedulesSection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RouteData {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  comment?: string | null;
  type: string;
  isActive: boolean;
  isFavorite?: boolean;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  currentVersion?: {
    id: string;
    stops: Array<{
      id: string;
      sequenceNumber: number;
      isMain?: boolean;
      stop: { id: string; name: string };
    }>;
  };
  _count?: {
    trips: number;
  };
}


export default function CompanyRoutesPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const { isManagerOf } = useAuth();
  const t = useTranslations('company');
  const tCommon = useTranslations('common');

  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams({ companyId });
      if (!showFavoritesOnly) urlParams.set('favorites', 'false');
      const response = await api.get(`/routes?${urlParams}`);
      setRoutes(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, showFavoritesOnly]);

  const handleDelete = async (routeId: string) => {
    if (!confirm(t('routes.confirmDelete'))) return;
    try {
      await api.delete(`/routes/${routeId}`);
      toast({ variant: 'success', title: t('routes.deleted') });
      fetchRoutes();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const toggleRouteSchedules = (routeId: string) => {
    setExpandedRoute((prev) => (prev === routeId ? null : routeId));
  };

  const handleDuplicateRoute = async (routeId: string) => {
    try {
      await api.post(`/routes/${routeId}/duplicate`);
      toast({ variant: 'success', title: t('routes.duplicated') });
      fetchRoutes();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const handleReverseRoute = async (routeId: string) => {
    try {
      await api.post(`/routes/${routeId}/reverse`);
      toast({ variant: 'success', title: t('routes.reversed') });
      fetchRoutes();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const handleToggleFavorite = async (route: RouteData) => {
    if (!isManagerOf(companyId)) return;
    try {
      if (route.isFavorite) {
        await api.delete(`/routes/favorites/${route.id}?companyId=${companyId}`);
        toast({ variant: 'success', title: t('routes.removedFromFavorites') });
      } else {
        await api.post('/routes/favorites', { companyId, routeId: route.id });
        toast({ variant: 'success', title: t('routes.addedToFavorites') });
      }
      fetchRoutes();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  useEffect(() => {
    if (!isManagerOf(companyId)) {
      router.push('/company');
      return;
    }
    fetchRoutes();
  }, [companyId, isManagerOf, router, fetchRoutes]);

  if (!isManagerOf(companyId)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('routes.title')}</h1>
          <p className="text-muted-foreground">{t('routes.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFavoritesOnly((v) => !v)}
          >
            <Star className="h-4 w-4 mr-1" />
            {showFavoritesOnly ? t('routes.favoritesOnly') : t('routes.showAll')}
          </Button>
          <Button onClick={() => router.push(`/company/${companyId}/routes/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('routes.addRoute')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <RouteIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t('routes.noRoutes')}</p>
          <Button className="mt-4" onClick={() => router.push(`/company/${companyId}/routes/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('routes.addRoute')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <div key={route.id} className="rounded-lg border bg-card">
              <div className="p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <RouteIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{route.name}</p>
                        {route.code && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {route.code}
                          </span>
                        )}
                      </div>
                      {route.description && (
                        <p className="text-sm text-muted-foreground">{route.description}</p>
                      )}
                      {route.comment && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">{route.comment}</p>
                      )}
                      {route.currentVersion?.stops && (() => {
                        const mainStops = route.currentVersion.stops
                          .filter((s) => s.isMain)
                          .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                          .map((s) => s.stop.name);
                        return mainStops.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {t('routes.via')}: {mainStops.join(', ')}
                          </p>
                        ) : null;
                      })()}
                      {route.createdBy && (
                        <p className="text-xs text-muted-foreground">
                          {t('routes.author')}: {route.createdBy.firstName} {route.createdBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        route.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      )}
                    >
                      {route.isActive ? tCommon('status.active') : tCommon('status.inactive')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRouteSchedules(route.id)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {t('routes.tabs.schedules')}
                      {expandedRoute === route.id ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                    <div className="flex gap-1">
                      {isManagerOf(companyId) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFavorite(route)}
                          title={route.isFavorite ? t('routes.removedFromFavorites') : t('routes.addedToFavorites')}
                        >
                          <Star
                            className={`h-4 w-4 ${route.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                          />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/company/${companyId}/routes/${route.id}/edit`)}
                        title={tCommon('actions.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateRoute(route.id)}
                        title={t('routes.duplicate')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReverseRoute(route.id)}
                        title={t('routes.reverse')}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(route.id)}
                        title={tCommon('actions.delete')}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedules section */}
              {expandedRoute === route.id && (
                <RouteSchedulesSection
                  companyId={companyId}
                  routeId={route.id}
                  route={route}
                />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

