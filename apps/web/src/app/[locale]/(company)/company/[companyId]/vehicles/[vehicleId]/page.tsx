'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { VehicleDetailView } from '@/components/vehicles/VehicleDetailView';

export default function CompanyVehicleDetailPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const vehicleId = params.vehicleId as string;
  const t = useTranslations('admin.vehicles');
  const tCommon = useTranslations('common');

  const [vehicle, setVehicle] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [position, setPosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vehicleData, tripsData] = await Promise.all([
        api.fetch<any>(`/vehicles/${vehicleId}`),
        api.fetch<any>(`/trips?vehicleId=${vehicleId}&limit=20`),
      ]);
      setVehicle(vehicleData);
      setTrips(Array.isArray(tripsData) ? tripsData : tripsData.data || []);

      try {
        const vehicleWithPos = await api.fetch<any>(`/vehicles/${vehicleId}/position`);
        setPosition(vehicleWithPos?.positions?.[0] ?? null);
      } catch {
        setPosition(null);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vehicle not found</p>
        <Button asChild className="mt-4">
          <Link href={`/company/${companyId}/vehicles`}>{t('detail.back')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/company/${companyId}/vehicles`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{vehicle.registrationNumber}</h1>
      </div>

      <VehicleDetailView
        vehicle={vehicle}
        trips={trips}
        position={position}
        canEdit
        onEdit={() => {}}
      />
    </div>
  );
}
