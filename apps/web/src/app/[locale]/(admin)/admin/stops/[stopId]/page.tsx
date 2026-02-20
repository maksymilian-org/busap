'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Edit, Trash2 } from 'lucide-react';
import { BusapMap, StopMarker } from '@/components/map';
import { StopFormModal } from '@/components/stops/StopFormModal';
import { cn } from '@/lib/utils';

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

export default function AdminStopDetailPage() {
  const params = useParams();
  const stopId = params.stopId as string;
  const t = useTranslations('admin.stops');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const canDelete = user?.systemRole === 'admin' || user?.systemRole === 'superadmin';

  const [stop, setStop] = useState<StopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadStop = useCallback(async () => {
    try {
      const data = await api.fetch<StopData>(`/stops/${stopId}`);
      setStop(data);
    } catch (err) {
      console.error('Failed to load stop:', err);
    } finally {
      setLoading(false);
    }
  }, [stopId]);

  useEffect(() => {
    loadStop();
  }, [loadStop]);

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/stops/${stopId}`);
      toast({ variant: 'success', title: t('deleted') });
      window.history.back();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stop) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Stop not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/stops">{tCommon('actions.back')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/stops">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{stop.name}</h1>
            {stop.code && (
              <span className="rounded bg-muted px-2 py-0.5 text-sm font-mono">{stop.code}</span>
            )}
          </div>
          {stop.city && (
            <p className="text-muted-foreground ml-9">{stop.city}</p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex rounded-full px-3 py-1 text-sm font-medium',
            stop.isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          )}
        >
          {stop.isActive ? t('status.active') : t('status.inactive')}
        </span>
        <Button variant="outline" onClick={() => setShowEditModal(true)}>
          <Edit className="h-4 w-4 mr-2" />
          {tCommon('actions.edit')}
        </Button>
        {canDelete && (
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {tCommon('actions.delete')}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('table.coordinates')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">{t('createModal.latitude')}</p>
                <p className="font-mono">{stop.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('createModal.longitude')}</p>
                <p className="font-mono">{stop.longitude.toFixed(6)}</p>
              </div>
            </div>
            {stop.formattedAddress && (
              <div>
                <p className="text-muted-foreground">Formatted address</p>
                <p>{stop.formattedAddress}</p>
              </div>
            )}
            {stop.address && (
              <div>
                <p className="text-muted-foreground">{t('createModal.address')}</p>
                <p>{stop.address}</p>
              </div>
            )}
            {stop.county && (
              <div>
                <p className="text-muted-foreground">{t('createModal.county')}</p>
                <p>{stop.county}</p>
              </div>
            )}
            {stop.region && (
              <div>
                <p className="text-muted-foreground">{t('createModal.region')}</p>
                <p>{stop.region}</p>
              </div>
            )}
            {stop.postalCode && (
              <div>
                <p className="text-muted-foreground">{t('createModal.postalCode')}</p>
                <p>{stop.postalCode}</p>
              </div>
            )}
            {stop.countryCode && (
              <div>
                <p className="text-muted-foreground">{t('createModal.countryCode')}</p>
                <p>{stop.countryCode}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('createModal.mapTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <BusapMap
              className="h-[300px] rounded-lg"
              center={[stop.latitude, stop.longitude]}
              zoom={16}
            >
              <StopMarker
                position={[stop.latitude, stop.longitude]}
                name={stop.name}
                code={stop.code}
                city={stop.city}
                isActive={stop.isActive}
              />
            </BusapMap>
          </CardContent>
        </Card>
      </div>

      {showEditModal && (
        <StopFormModal
          t={t}
          tCommon={tCommon}
          stop={stop}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            loadStop();
          }}
        />
      )}
    </div>
  );
}
