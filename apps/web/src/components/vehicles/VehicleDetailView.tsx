'use client';

import { useTranslations } from 'next-intl';
import { Truck, Edit, Trash2, Clock, CheckCircle2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BusapMap, StopMarker } from '@/components/map';
import { cn } from '@/lib/utils';

interface VehicleData {
  id: string;
  registrationNumber: string;
  brand?: string;
  model?: string;
  capacity: number;
  status: string;
  photoUrl?: string;
}

interface TripData {
  id: string;
  status: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime?: string;
  route?: { id: string; name: string; code?: string };
  driver?: { id: string; firstName: string; lastName: string };
}

interface VehiclePosition {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  updatedAt?: string;
}

interface VehicleDetailViewProps {
  vehicle: VehicleData;
  trips: TripData[];
  position?: VehiclePosition | null;
  canEdit: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  out_of_service: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const tripStatusBadge = (status: string, t: any) => {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3" />
          {t('status.completed')}
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Navigation className="h-3 w-3" />
          {t('status.in_progress')}
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
          {t('status.cancelled')}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          <Clock className="h-3 w-3" />
          {t('status.scheduled')}
        </span>
      );
  }
};

export function VehicleDetailView({
  vehicle,
  trips,
  position,
  canEdit,
  onEdit,
  onDelete,
}: VehicleDetailViewProps) {
  const t = useTranslations('admin.vehicles');
  const tTrip = useTranslations('company.timetable');

  const currentDriver = trips.find((t) => t.status === 'in_progress')?.driver
    ?? trips[0]?.driver;

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="space-y-6">
      {/* Info + photo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {vehicle.photoUrl ? (
              <img
                src={vehicle.photoUrl}
                alt={vehicle.registrationNumber}
                className="h-24 w-24 rounded-lg object-cover border"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted">
                <Truck className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{vehicle.registrationNumber}</h2>
                  <p className="text-muted-foreground">
                    {[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || '-'}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onEdit}>
                      <Edit className="h-4 w-4 mr-1" />
                      {t('editModal.title')}
                    </Button>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                    statusStyles[vehicle.status] || statusStyles.inactive
                  )}
                >
                  {t(`status.${vehicle.status}`)}
                </span>
                <span className="text-muted-foreground">
                  {t('seatsCount', { count: vehicle.capacity })}
                </span>
                {currentDriver && (
                  <span className="text-muted-foreground">
                    {currentDriver.firstName} {currentDriver.lastName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map with last position */}
      {position && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('lastPosition')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
            <div className="h-[250px]">
              <BusapMap center={[position.latitude, position.longitude]} zoom={14}>
                <StopMarker
                  position={[position.latitude, position.longitude]}
                  name={vehicle.registrationNumber}
                />
              </BusapMap>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('tripHistory')} ({trips.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {trips.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">{t('noTrips')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t('tripTable.date')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('tripTable.route')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('tripTable.time')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('tripTable.driver')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('tripTable.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(trip.scheduledDepartureTime)}</td>
                      <td className="px-4 py-3">
                        {trip.route ? (
                          <span>
                            {trip.route.code ? `${trip.route.code}: ` : ''}{trip.route.name}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatTime(trip.scheduledDepartureTime)}
                        {trip.scheduledArrivalTime && ` → ${formatTime(trip.scheduledArrivalTime)}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {tripStatusBadge(trip.status, tTrip)}
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
