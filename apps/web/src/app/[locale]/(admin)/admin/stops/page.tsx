'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { MapPin, Plus, Search, Edit, List, Map, Trash2 } from 'lucide-react';
import { BusapMap, StopMarker } from '@/components/map';
import { StopFormModal } from '@/components/stops/StopFormModal';
import { Link } from '@/i18n/navigation';

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
}

export default function AdminStopsPage() {
  const t = useTranslations('admin.stops');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const canDeleteStops = user?.systemRole === 'admin' || user?.systemRole === 'superadmin';
  const [stops, setStops] = useState<StopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStop, setEditingStop] = useState<StopData | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapInitialCoords, setMapInitialCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadStops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('query', search);
      params.set('limit', '100');
      const data = await api.fetch<any>(`/stops?${params}`);
      setStops(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load stops:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const handleDeleteStop = async (stop: StopData) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/stops/${stop.id}`);
      toast({ variant: 'success', title: t('deleted') });
      loadStops();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  useEffect(() => {
    loadStops();
  }, [loadStops]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle', { count: stops.length })}
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
          <Button onClick={() => { setMapInitialCoords(null); setShowCreateModal(true); }}>
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
                setMapInitialCoords({ lat, lng });
                setShowCreateModal(true);
              }}
            >
              {stops.map((stop) => (
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
                    <th className="px-4 py-3 text-right font-medium">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        {tCommon('actions.loading')}
                      </td>
                    </tr>
                  ) : stops.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        {t('noStops')}
                      </td>
                    </tr>
                  ) : (
                    stops.map((stop) => (
                      <tr key={stop.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <Link
                              href={`/admin/stops/${stop.id}`}
                              className="font-medium hover:underline"
                            >
                              {stop.name}
                            </Link>
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
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingStop(stop)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canDeleteStops && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteStop(stop)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
          t={t}
          tCommon={tCommon}
          stop={editingStop || undefined}
          initialCoords={mapInitialCoords}
          onClose={() => {
            setShowCreateModal(false);
            setEditingStop(null);
            setMapInitialCoords(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditingStop(null);
            setMapInitialCoords(null);
            loadStops();
          }}
        />
      )}
    </div>
  );
}
