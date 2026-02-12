'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CalendarClock, UserPlus, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface VirtualTrip {
  id: string;
  type: 'virtual' | 'materialized';
  scheduleId: string;
  scheduleDate: string;
  companyId: string;
  routeId: string;
  routeName: string;
  vehicleId: string | null;
  driverId: string | null;
  driverName: string | null;
  scheduledDepartureTime: string;
  scheduledArrivalTime: string;
  status: string;
  stopTimes: Array<{
    routeStopId: string;
    stopId: string;
    stopName: string;
    sequenceNumber: number;
    scheduledArrival: string;
    scheduledDeparture: string;
  }>;
  isModified: boolean;
}

export default function TimetablePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const t = useTranslations('company.timetable');
  const { toast } = useToast();

  const [trips, setTrips] = useState<VirtualTrip[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [fromDate, setFromDate] = useState(today.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(nextWeek.toISOString().split('T')[0]);
  const [filterRoute, setFilterRoute] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Assign driver modal
  const [assignModalTrip, setAssignModalTrip] = useState<VirtualTrip | null>(null);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId,
        fromDate: new Date(fromDate).toISOString(),
        toDate: new Date(toDate).toISOString(),
      });
      if (filterRoute) params.set('routeId', filterRoute);
      if (filterDriver) params.set('driverId', filterDriver);
      if (filterStatus) params.set('status', filterStatus);

      const data = await api.get<VirtualTrip[]>(`/trips?${params.toString()}`);
      setTrips(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [companyId, fromDate, toDate, filterRoute, filterDriver, filterStatus, toast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [routesData, membersData] = await Promise.all([
          api.get<any[]>(`/routes?companyId=${companyId}`),
          api.get<any[]>(`/companies/${companyId}/users`),
        ]);
        setRoutes(routesData);
        setDrivers(membersData.filter((m: any) => m.role === 'driver'));
      } catch {}
    };
    fetchFilters();
  }, [companyId]);

  const handleAssignDriver = async () => {
    if (!assignModalTrip || !assignDriverId) return;
    setAssigning(true);
    try {
      await api.post(`/trips/${assignModalTrip.id}/assign-driver`, { driverId: assignDriverId });
      toast({ title: t('assignDriverModal.success'), variant: 'success' as any });
      setAssignModalTrip(null);
      setAssignDriverId('');
      fetchTrips();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarClock className="h-6 w-6" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end rounded-lg border bg-card p-4">
        <div>
          <label className="text-sm font-medium">{t('from')}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('to')}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('filterRoute')}</label>
          <select
            value={filterRoute}
            onChange={(e) => setFilterRoute(e.target.value)}
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">{t('allRoutes')}</option>
            {routes.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t('filterStatus')}</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">{t('allStatuses')}</option>
            <option value="scheduled">{t('status.scheduled')}</option>
            <option value="in_progress">{t('status.in_progress')}</option>
            <option value="completed">{t('status.completed')}</option>
            <option value="cancelled">{t('status.cancelled')}</option>
          </select>
        </div>
      </div>

      {/* Trips table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">{t('noTrips')}</p>
          <p className="text-sm">{t('noTripsHint')}</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t('columns.date')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('columns.route')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('columns.departure')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('columns.arrival')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('columns.driver')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('columns.status')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('columns.type')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr
                  key={trip.id}
                  className={cn(
                    'border-b hover:bg-muted/30 transition-colors',
                    trip.type === 'virtual' && 'border-dashed',
                  )}
                >
                  <td className="px-4 py-3">
                    {formatDate(trip.scheduledDepartureTime)}
                  </td>
                  <td className="px-4 py-3 font-medium">{trip.routeName}</td>
                  <td className="px-4 py-3">{formatTime(trip.scheduledDepartureTime)}</td>
                  <td className="px-4 py-3">{formatTime(trip.scheduledArrivalTime)}</td>
                  <td className="px-4 py-3">
                    {trip.driverName || (
                      <span className="text-muted-foreground italic">{t('unassigned')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[trip.status] || '')}>
                      {t(`status.${trip.status}` as any)}
                    </span>
                    {trip.isModified && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {t('modified')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      trip.type === 'virtual'
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
                    )}>
                      {trip.type === 'virtual' ? t('virtual') : t('materialized')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!trip.driverId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAssignModalTrip(trip);
                          setAssignDriverId('');
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        {t('assignDriver')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign driver modal */}
      {assignModalTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAssignModalTrip(null)}>
          <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{t('assignDriverModal.title')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {assignModalTrip.routeName} &mdash; {formatDate(assignModalTrip.scheduledDepartureTime)} {formatTime(assignModalTrip.scheduledDepartureTime)}
            </p>
            <select
              value={assignDriverId}
              onChange={(e) => setAssignDriverId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-4"
            >
              <option value="">{t('assignDriverModal.selectDriver')}</option>
              {drivers.map((d: any) => (
                <option key={d.userId} value={d.userId}>
                  {d.user?.firstName} {d.user?.lastName}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAssignModalTrip(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignDriver}
                disabled={!assignDriverId || assigning}
              >
                {assigning ? t('assignDriverModal.submitting') : t('assignDriverModal.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
