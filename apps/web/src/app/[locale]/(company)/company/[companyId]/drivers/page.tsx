'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import {
  Clock,
  CheckCircle2,
  Navigation,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ViewMode = 'day' | 'week' | 'month';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ScheduleTrip {
  id: string;
  status: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime: string;
  routeName?: string;
  route?: {
    name: string;
    code?: string;
  } | null;
  vehicle?: {
    registrationNumber: string;
  } | null;
  vehicleId?: string | null;
  driver?: {
    firstName: string;
    lastName: string;
  } | null;
  driverName?: string | null;
}

function getTripRouteName(trip: ScheduleTrip): string {
  if (trip.route?.code) return `${trip.route.code}: ${trip.route.name}`;
  if (trip.route?.name) return trip.route.name;
  return trip.routeName || '';
}

function getDateRange(date: Date, mode: ViewMode): { from: Date; to: Date } {
  const from = new Date(date);
  const to = new Date(date);

  if (mode === 'day') {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (mode === 'week') {
    const day = from.getDay();
    const diff = day === 0 ? 6 : day - 1;
    from.setDate(from.getDate() - diff);
    from.setHours(0, 0, 0, 0);
    to.setTime(from.getTime());
    to.setDate(to.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  } else {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to.setMonth(to.getMonth() + 1, 0);
    to.setHours(23, 59, 59, 999);
  }

  return { from, to };
}

function navigateDate(date: Date, mode: ViewMode, direction: number): Date {
  const next = new Date(date);
  if (mode === 'day') next.setDate(next.getDate() + direction);
  else if (mode === 'week') next.setDate(next.getDate() + 7 * direction);
  else next.setMonth(next.getMonth() + direction);
  return next;
}

function formatDateLabel(date: Date, mode: ViewMode): string {
  if (mode === 'day') {
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } else if (mode === 'week') {
    const { from, to } = getDateRange(date, 'week');
    return `${from.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - ${to.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } else {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  }
}

export default function CompanyDriversPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const t = useTranslations('company.drivers');
  const tStatus = useTranslations('company.timetable.status');
  const { user, loading, isManagerOf } = useAuth();
  const router = useRouter();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trips, setTrips] = useState<ScheduleTrip[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (!isManagerOf(companyId)) {
        router.push('/passenger');
        return;
      }
      fetchDrivers();
    }
  }, [loading, user, companyId, isManagerOf, router]);

  const fetchDrivers = async () => {
    try {
      const data = await api.get<Driver[]>(`/users/drivers/company/${companyId}`);
      setDrivers(data);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchTrips = useCallback(async () => {
    if (!selectedDriverId) return;
    const { from, to } = getDateRange(currentDate, viewMode);
    setLoadingTrips(true);
    try {
      const data = await api.get<ScheduleTrip[]>(
        `/trips?companyId=${companyId}&driverId=${selectedDriverId}&fromDate=${from.toISOString()}&toDate=${to.toISOString()}`
      );
      setTrips(data);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  }, [selectedDriverId, currentDate, viewMode, companyId]);

  useEffect(() => {
    if (selectedDriverId) {
      fetchTrips();
    }
  }, [selectedDriverId, fetchTrips]);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  const workingTimeMs = trips
    .filter((t) => t.status !== 'cancelled')
    .reduce((sum, t) => {
      const dep = new Date(t.scheduledDepartureTime).getTime();
      const arr = new Date(t.scheduledArrivalTime).getTime();
      return sum + (arr - dep);
    }, 0);

  const workingHours = Math.floor(workingTimeMs / 3600000);
  const workingMinutes = Math.floor((workingTimeMs % 3600000) / 60000);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            {tStatus('completed')}
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Navigation className="h-3 w-3" />
            {tStatus('in_progress')}
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {tStatus('cancelled')}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            {tStatus('scheduled')}
          </span>
        );
    }
  };

  if (loading || loadingDrivers) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Driver selector */}
      {drivers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('noDrivers')}
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">{t('selectDriver')}</label>
            <select
              className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedDriverId ?? ''}
              onChange={(e) => setSelectedDriverId(e.target.value || null)}
            >
              <option value="">{t('selectDriver')}</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} ({d.email})
                </option>
              ))}
            </select>
          </div>

          {selectedDriverId && (
            <>
              {/* View toggle + navigation */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                  >
                    {t('viewDaily')}
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                  >
                    {t('viewWeekly')}
                  </Button>
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                  >
                    {t('viewMonthly')}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(navigateDate(currentDate, viewMode, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[200px] text-center text-sm font-medium">
                    {formatDateLabel(currentDate, viewMode)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(navigateDate(currentDate, viewMode, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <CalendarDays className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{trips.filter((t) => t.status !== 'cancelled').length}</p>
                      <p className="text-sm text-muted-foreground">{t('totalTrips')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{workingHours}h {workingMinutes}m</p>
                      <p className="text-sm text-muted-foreground">{t('workingTime')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trips table */}
              <Card>
                <CardContent className="p-0">
                  {loadingTrips ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : trips.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      {t('noTrips')}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium">{t('columnDate')}</th>
                            <th className="px-4 py-3 text-left font-medium">{t('columnRoute')}</th>
                            <th className="px-4 py-3 text-left font-medium">{t('columnDeparture')}</th>
                            <th className="px-4 py-3 text-left font-medium">{t('columnArrival')}</th>
                            <th className="px-4 py-3 text-left font-medium">{t('columnVehicle')}</th>
                            <th className="px-4 py-3 text-left font-medium">{t('columnStatus')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trips.map((trip) => (
                            <tr key={trip.id} className="border-b hover:bg-muted/30">
                              <td className="px-4 py-3 whitespace-nowrap">
                                {formatDate(trip.scheduledDepartureTime)}
                              </td>
                              <td className="px-4 py-3">
                                {getTripRouteName(trip)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {formatTime(trip.scheduledDepartureTime)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {formatTime(trip.scheduledArrivalTime)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {trip.vehicle?.registrationNumber ?? '-'}
                              </td>
                              <td className="px-4 py-3">{getStatusBadge(trip.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
