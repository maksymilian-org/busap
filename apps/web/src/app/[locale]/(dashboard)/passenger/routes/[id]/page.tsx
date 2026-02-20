'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Star, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { BusapMap, StopMarker, RoutePolyline } from '@/components/map';
import { Link } from '@/i18n/navigation';

interface RouteDetailData {
  id: string;
  name: string;
  code?: string;
  type: string;
  description?: string;
  isActive: boolean;
  geometry?: any;
  company: {
    id: string;
    name: string;
    logoUrl?: string;
    slug?: string;
  };
  currentVersion?: {
    id: string;
    stops: Array<{
      stop: {
        id: string;
        name: string;
        city?: string;
        latitude: number;
        longitude: number;
      };
      sequenceNumber: number;
      departureOffset: number;
      distanceFromStart?: number;
    }>;
    geometry?: any;
  };
}

export default function RouteDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('dashboard.routes.detail');
  const { user } = useAuth();

  const [route, setRoute] = useState<RouteDetailData | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRoute = useCallback(async () => {
    setLoading(true);
    try {
      const [routeData, favData] = await Promise.all([
        api.fetch<RouteDetailData>(`/routes/${params.id}`),
        user
          ? api.fetch<string>(`/favorites/check?routeIds=${params.id}`).catch(() => null)
          : Promise.resolve(null),
      ]);
      setRoute(routeData);

      // Check if favorited
      if (user) {
        try {
          const favRoutes = await api.fetch<any[]>('/favorites/routes');
          setIsFavorite(favRoutes.some((f: any) => (f.id || f.routeId || f.route?.id) === params.id));
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
    loadRoute();
  }, [loadRoute]);

  const toggleFavorite = async () => {
    if (!user || !route) return;
    try {
      if (isFavorite) {
        await api.fetch(`/favorites/routes/${route.id}`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        await api.fetch(`/favorites/routes/${route.id}`, { method: 'POST' });
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

  if (!route) {
    return <div className="py-12 text-center text-muted-foreground">Route not found</div>;
  }

  const stops = route.currentVersion?.stops ?? [];
  const mapCenter: [number, number] = stops[0]?.stop
    ? [stops[0].stop.latitude, stops[0].stop.longitude]
    : [52.0, 19.5];

  const polylinePositions = stops.map((s) => [s.stop.latitude, s.stop.longitude] as [number, number]);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/passenger/routes" className="text-sm text-muted-foreground hover:text-foreground">
        {t('backToRoutes')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{route.name}</h1>
            {route.code && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{route.code}</span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              route.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {route.isActive ? 'Aktywna' : 'Nieaktywna'}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{route.type}</span>
          </div>
          {route.description && <p className="mt-1 text-muted-foreground">{route.description}</p>}
        </div>
        {user && (
          <Button variant="outline" size="sm" onClick={toggleFavorite}>
            <Star className={`h-4 w-4 mr-1 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            {isFavorite ? 'Ulubiona' : 'Dodaj do ulubionych'}
          </Button>
        )}
      </div>

      {/* Map */}
      {stops.length > 0 && (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <div className="h-[400px]">
              <BusapMap center={mapCenter} zoom={9}>
                {polylinePositions.length > 1 && (
                  <RoutePolyline positions={polylinePositions} color="#3b82f6" weight={4} />
                )}
                {stops.map((rs, idx) => (
                  <StopMarker
                    key={rs.stop.id}
                    position={[rs.stop.latitude, rs.stop.longitude]}
                    name={`${idx + 1}. ${rs.stop.name}`}
                  />
                ))}
              </BusapMap>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stops list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('stopsOnRoute')} ({stops.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stops.map((rs, idx) => (
                  <div key={rs.stop.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/passenger/stops/${rs.stop.id}`} className="font-medium hover:underline">
                        {rs.stop.name}
                      </Link>
                      {rs.stop.city && (
                        <span className="ml-1 text-xs text-muted-foreground">({rs.stop.city})</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      +{rs.departureOffset} min
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operator */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('operatedBy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/passenger/companies/${route.company.id}`} className="flex items-center gap-3 hover:opacity-80">
                {route.company.logoUrl ? (
                  <img src={route.company.logoUrl} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10">
                    <Bus className="h-6 w-6 text-primary" />
                  </div>
                )}
                <span className="font-medium hover:underline">{route.company.name}</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
