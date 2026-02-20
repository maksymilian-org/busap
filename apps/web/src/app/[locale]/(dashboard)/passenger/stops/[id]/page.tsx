'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Star, Bus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { BusapMap, StopMarker } from '@/components/map';
import { Link } from '@/i18n/navigation';

interface StopDetail {
  id: string;
  name: string;
  code?: string;
  city?: string;
  country?: string;
  address?: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

interface UpcomingTrip {
  id: string;
  routeName: string;
  routeCode?: string;
  direction: string;
  scheduledDepartureTime: string;
  vehicleRegistration?: string;
}

interface RouteData {
  id: string;
  name: string;
  code?: string;
  company: {
    id: string;
    name: string;
  };
  currentVersion?: {
    stops: Array<{ stop: { id: string } }>;
  };
}

export default function StopDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('dashboard.stops.detail');
  const { user } = useAuth();

  const [stop, setStop] = useState<StopDetail | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stopData, routesData, upcomingData] = await Promise.all([
        api.fetch<StopDetail>(`/stops/${params.id}`),
        api.fetch<RouteData[]>('/routes'),
        api.fetch<UpcomingTrip[]>(`/stops/${params.id}/upcoming-trips`).catch(() => []),
      ]);
      setStop(stopData);
      setUpcomingTrips(upcomingData);

      // Filter routes that have this stop in their current version
      const routesViaStop = routesData.filter((r: RouteData) =>
        r.currentVersion?.stops?.some((rs) => rs.stop.id === params.id)
      );
      setRoutes(routesViaStop);

      // Check favorites
      if (user) {
        try {
          const favStops = await api.fetch<any[]>('/favorites/stops');
          setIsFavorite(favStops.some((f: any) => (f.stop?.id || f.id) === params.id));
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
    if (!user || !stop) return;
    try {
      if (isFavorite) {
        await api.fetch(`/favorites/stops/${stop.id}`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        await api.fetch(`/favorites/stops/${stop.id}`, { method: 'POST' });
        setIsFavorite(true);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  // Extract unique companies from routes
  const companies = Array.from(
    new Map(routes.map((r) => [r.company.id, r.company])).values()
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stop) {
    return <div className="py-12 text-center text-muted-foreground">Stop not found</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/passenger/stops" className="text-sm text-muted-foreground hover:text-foreground">
        {t('backToStops')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{stop.name}</h1>
            {stop.code && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{stop.code}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {stop.city && <span>{stop.city}</span>}
            {stop.country && <span>· {stop.country}</span>}
            {stop.address && <span>· {stop.address}</span>}
          </div>
        </div>
        {user && (
          <Button variant="outline" size="sm" onClick={toggleFavorite}>
            <Star className={`h-4 w-4 mr-1 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            {isFavorite ? 'Ulubiony' : 'Dodaj do ulubionych'}
          </Button>
        )}
      </div>

      {/* Map */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <div className="h-[300px]">
            <BusapMap center={[stop.latitude, stop.longitude]} zoom={14}>
              <StopMarker
                position={[stop.latitude, stop.longitude]}
                name={stop.name}
                city={stop.city}
              />
            </BusapMap>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Routes via this stop */}
        <Card>
          <CardHeader>
            <CardTitle>{t('routesViaStop')} ({routes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {routes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noRoutes')}</p>
            ) : (
              <div className="space-y-2">
                {routes.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Link href={`/passenger/routes/${r.id}`} className="font-medium hover:underline">
                        {r.name}
                        {r.code && <span className="ml-1 text-xs text-muted-foreground">({r.code})</span>}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        <Link href={`/passenger/companies/${r.company.id}`} className="hover:underline">
                          {r.company.name}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Companies */}
        {companies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Firmy ({companies.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {companies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/passenger/companies/${c.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                      <Bus className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium hover:underline">{c.name}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming trips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            {t('upcomingTrips')} ({upcomingTrips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noUpcomingTrips')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">{t('tripRoute')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('tripDirection')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('tripDeparture')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('tripVehicle')}</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingTrips.map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">
                        {trip.routeCode ? `${trip.routeCode}: ` : ''}{trip.routeName}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{trip.direction}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {new Date(trip.scheduledDepartureTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          <span className="text-xs text-muted-foreground ml-1">
                            {new Date(trip.scheduledDepartureTime).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {trip.vehicleRegistration ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
