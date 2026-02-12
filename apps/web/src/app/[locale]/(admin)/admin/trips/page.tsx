'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, X, XCircle } from 'lucide-react';

interface TripData {
  id: string;
  status: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  notes?: string;
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  route?: { id: string; name: string; code?: string };
  vehicle?: { id: string; registrationNumber: string };
  driver?: { id: string; firstName: string; lastName: string };
}

interface RouteOption {
  id: string;
  name: string;
  code?: string;
}

interface VehicleOption {
  id: string;
  registrationNumber: string;
}

interface DriverOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AdminTripsPage() {
  const t = useTranslations('admin.trips');
  const tCommon = useTranslations('common');
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      const data = await api.fetch<any>(`/trips?${params}`);
      setTrips(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleCancel = async (tripId: string) => {
    if (!confirm(t('confirmCancel'))) return;
    try {
      await api.fetch(`/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      toast({ variant: 'success', title: t('cancelled') });
      loadTrips();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    delayed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle', { count: trips.length })}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addTrip')}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'scheduled', 'in_progress', 'completed', 'cancelled', 'delayed'].map((s) => (
          <Button
            key={s || 'all'}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === '' ? t('filterAll') : t(`status.${s}`)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{t('table.route')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.driver')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.vehicle')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.departure')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.arrival')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.status')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {tCommon('actions.loading')}
                    </td>
                  </tr>
                ) : trips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {t('noTrips')}
                    </td>
                  </tr>
                ) : (
                  trips.map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        {trip.route?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {trip.vehicle?.registrationNumber || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(trip.scheduledDepartureTime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(trip.scheduledArrivalTime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[trip.status] || ''}`}>
                          {t(`status.${trip.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTrip(trip)}
                            title={tCommon('actions.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {trip.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(trip.id)}
                              title={t('cancelTrip')}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
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

      {(showCreateModal || editingTrip) && (
        <TripFormModal
          t={t}
          tCommon={tCommon}
          trip={editingTrip || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTrip(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditingTrip(null);
            loadTrips();
          }}
        />
      )}
    </div>
  );
}

function TripFormModal({
  t,
  tCommon,
  trip,
  onClose,
  onSaved,
}: {
  t: any;
  tCommon: any;
  trip?: TripData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [form, setForm] = useState({
    routeId: trip?.routeId || trip?.route?.id || '',
    vehicleId: trip?.vehicleId || trip?.vehicle?.id || '',
    driverId: trip?.driverId || trip?.driver?.id || '',
    scheduledDepartureTime: trip?.scheduledDepartureTime
      ? new Date(trip.scheduledDepartureTime).toISOString().slice(0, 16)
      : '',
    scheduledArrivalTime: trip?.scheduledArrivalTime
      ? new Date(trip.scheduledArrivalTime).toISOString().slice(0, 16)
      : '',
    notes: trip?.notes || '',
    status: trip?.status || 'scheduled',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!trip;

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [routesData, vehiclesData, driversData] = await Promise.all([
          api.fetch<any>('/routes?limit=100'),
          api.fetch<any>('/vehicles?limit=100'),
          api.fetch<any>('/users?systemRole=passenger&limit=100'),
        ]);
        setRoutes(Array.isArray(routesData) ? routesData : routesData.data || []);
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.data || []);
        setDrivers(Array.isArray(driversData) ? driversData : driversData.data || []);
      } catch (err) {
        console.error('Failed to load options:', err);
      }
    };
    loadOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        scheduledDepartureTime: new Date(form.scheduledDepartureTime).toISOString(),
        scheduledArrivalTime: new Date(form.scheduledArrivalTime).toISOString(),
      };

      if (isEdit) {
        await api.fetch(`/trips/${trip.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast({ variant: 'success', title: t('editModal.success') });
      } else {
        await api.fetch('/trips', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast({ variant: 'success', title: t('createModal.success') });
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? t('editModal.title') : t('createModal.title')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('createModal.route')}</label>
            <select
              required
              value={form.routeId}
              onChange={(e) => setForm({ ...form, routeId: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('createModal.selectRoute')}</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.code ? `(${r.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.vehicle')}</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('createModal.selectVehicle')}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.driver')}</label>
            <select
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('createModal.selectDriver')}</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} ({d.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.departureTime')}</label>
            <input
              type="datetime-local"
              required
              value={form.scheduledDepartureTime}
              onChange={(e) => setForm({ ...form, scheduledDepartureTime: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.arrivalTime')}</label>
            <input
              type="datetime-local"
              required
              value={form.scheduledArrivalTime}
              onChange={(e) => setForm({ ...form, scheduledArrivalTime: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {isEdit && (
            <div>
              <label className="text-sm font-medium">{t('table.status')}</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed'].map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? isEdit
                  ? t('editModal.submitting')
                  : t('createModal.submitting')
                : isEdit
                ? t('editModal.submit')
                : t('createModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
