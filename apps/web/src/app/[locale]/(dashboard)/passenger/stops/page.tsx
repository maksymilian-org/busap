'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Link } from '@/i18n/navigation';

interface StopData {
  id: string;
  name: string;
  code?: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export default function PassengerStopsPage() {
  const t = useTranslations('dashboard.stops');
  const { user } = useAuth();

  const [stops, setStops] = useState<StopData[]>([]);
  const [favoriteStopIds, setFavoriteStopIds] = useState<Set<string>>(new Set());
  const [favoriteStops, setFavoriteStops] = useState<StopData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.fetch<any[]>('/favorites/stops');
      const stopsData = data.map((f: any) => f.stop || f).filter(Boolean);
      setFavoriteStops(stopsData);
      setFavoriteStopIds(new Set(stopsData.map((s: StopData) => s.id)));
    } catch {
      // Ignore
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Search on type (debounced)
  useEffect(() => {
    if (!search && !filterCity) {
      setStops([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '50' });
        if (search) params.set('query', search);
        if (filterCity) params.set('city', filterCity);
        const data = await api.fetch<StopData[]>(`/stops/search?${params}`);
        setStops(Array.isArray(data) ? data : []);
      } catch (err: any) {
        toast({ variant: 'destructive', title: err.message });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterCity]);

  const toggleFavorite = async (stopId: string) => {
    if (!user) return;
    const isFav = favoriteStopIds.has(stopId);
    try {
      if (isFav) {
        await api.fetch(`/favorites/stops/${stopId}`, { method: 'DELETE' });
        setFavoriteStopIds((prev) => { const s = new Set(prev); s.delete(stopId); return s; });
        setFavoriteStops((prev) => prev.filter((s) => s.id !== stopId));
      } else {
        await api.fetch(`/favorites/stops/${stopId}`, { method: 'POST' });
        setFavoriteStopIds((prev) => new Set([...prev, stopId]));
        loadFavorites();
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  const StopCard = ({ stop }: { stop: StopData }) => (
    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <Link href={`/passenger/stops/${stop.id}`} className="font-medium hover:underline block truncate">
            {stop.name}
            {stop.code && <span className="ml-1 text-xs text-muted-foreground">({stop.code})</span>}
          </Link>
          {stop.city && <div className="text-xs text-muted-foreground">{stop.city}</div>}
        </div>
      </div>
      {user && (
        <Button variant="ghost" size="sm" onClick={() => toggleFavorite(stop.id)} className="flex-shrink-0 ml-2">
          <Star className={`h-4 w-4 ${favoriteStopIds.has(stop.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle', { count: stops.length })}</p>
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
        <input
          type="text"
          placeholder={t('filterCity')}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
        />
      </div>

      {/* Favorites section */}
      {user && favoriteStops.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('favorites')}</h2>
          <div className="space-y-2">
            {favoriteStops.map((s) => <StopCard key={s.id} stop={s} />)}
          </div>
        </div>
      )}

      {/* Search results */}
      {(search || filterCity) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('title')} ({stops.length})</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : stops.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">{t('noStops')}</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {stops.map((s) => <StopCard key={s.id} stop={s} />)}
            </div>
          )}
        </div>
      )}

      {!search && !filterCity && favoriteStops.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="mx-auto h-12 w-12 mb-3 text-muted-foreground/50" />
            <p>{t('searchPlaceholder')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
