'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { MapPin, Plus, Search, Edit, List, Map, Star } from 'lucide-react';
import { BusapMap, StopMarker } from '@/components/map';
import { StopFormModal } from '@/components/stops/StopFormModal';

interface StopData {
  id: string;
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  county?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  formattedAddress?: string;
  isActive: boolean;
  isFavorite?: boolean;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export default function CompanyStopsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const { isManagerOf } = useAuth();
  const t = useTranslations('company.stops');
  const tCommon = useTranslations('common');
  const [stops, setStops] = useState<StopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStop, setEditingStop] = useState<StopData | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [initialCoords, setInitialCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadStops = useCallback(async () => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams();
      urlParams.set('companyId', companyId);
      if (!showFavoritesOnly) urlParams.set('favorites', 'false');
      urlParams.set('limit', '100');
      const data = await api.fetch<any>(`/stops?${urlParams}`);
      setStops(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load stops:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, showFavoritesOnly]);

  useEffect(() => {
    if (!isManagerOf(companyId)) {
      router.push('/company');
      return;
    }
    loadStops();
  }, [companyId, isManagerOf, router, loadStops]);

  const handleToggleFavorite = async (stop: StopData) => {
    if (!isManagerOf(companyId)) return;
    try {
      if (stop.isFavorite) {
        await api.delete(`/stops/favorites/${stop.id}?companyId=${companyId}`);
        toast({ variant: 'success', title: t('removedFromFavorites') });
      } else {
        await api.post('/stops/favorites', { companyId, stopId: stop.id });
        toast({ variant: 'success', title: t('addedToFavorites') });
      }
      loadStops();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const filteredStops = search
    ? stops.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.city?.toLowerCase().includes(search.toLowerCase()),
      )
    : stops;

  if (!isManagerOf(companyId)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle', { count: filteredStops.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFavoritesOnly((v) => !v)}
          >
            <Star className="h-4 w-4 mr-1" />
            {showFavoritesOnly ? t('favoritesOnly') : t('showAll')}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addStop')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {viewMode === 'map' && (
        <Card>
          <CardContent className="p-4">
            <BusapMap
              className="h-[500px] rounded-lg"
              center={[52.0, 19.5]}
              zoom={6}
              onClick={(lat, lng) => {
                setInitialCoords({ lat, lng });
                setShowCreateModal(true);
              }}
            >
              {filteredStops.map((stop) => (
                <StopMarker
                  key={stop.id}
                  position={[stop.latitude, stop.longitude]}
                  name={stop.name}
                  code={stop.code}
                  city={stop.city}
                  isActive={stop.isActive}
                />
              ))}
            </BusapMap>
          </CardContent>
        </Card>
      )}

      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t('table.name')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('table.code')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('table.city')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('table.coordinates')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('table.status')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('table.author')}</th>
                    <th className="px-4 py-3 text-center font-medium">{t('table.favorite')}</th>
                    <th className="px-4 py-3 text-right font-medium">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        {tCommon('actions.loading')}
                      </td>
                    </tr>
                  ) : filteredStops.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        {t('noStops')}
                      </td>
                    </tr>
                  ) : (
                    filteredStops.map((stop) => (
                      <tr key={stop.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{stop.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{stop.code || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{stop.city || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                          {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              stop.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {stop.isActive ? t('status.active') : t('status.inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {stop.createdBy
                            ? `${stop.createdBy.firstName} ${stop.createdBy.lastName}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isManagerOf(companyId) ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleFavorite(stop)}
                              title={stop.isFavorite ? t('removedFromFavorites') : t('addedToFavorites')}
                            >
                              <Star
                                className={`h-4 w-4 ${stop.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                              />
                            </Button>
                          ) : (
                            stop.isFavorite && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mx-auto" />
                            )
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingStop(stop)}
                            title={tCommon('actions.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {(showCreateModal || editingStop) && (
        <StopFormModal
          companyId={companyId}
          t={t}
          tCommon={tCommon}
          stop={editingStop || undefined}
          initialCoords={initialCoords}
          onClose={() => {
            setShowCreateModal(false);
            setEditingStop(null);
            setInitialCoords(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditingStop(null);
            setInitialCoords(null);
            loadStops();
          }}
        />
      )}
    </div>
  );
}

