'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import {
  Bus,
  Clock,
  CheckCircle2,
  Navigation,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ViewMode = 'day' | 'week' | 'month';

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
    const diff = day === 0 ? 6 : day - 1; // Monday as start
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

export default function DriverSchedulePage() {
  const t = useTranslations('dashboard.driver');
  const tStatus = useTranslations('dashboard.passenger.tripStatus');
  const { user, loading, isAnyDriver } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trips, setTrips] = useState<ScheduleTrip[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchSchedule = useCallback(async () => {
    const { from, to } = getDateRange(currentDate, viewMode);
    setLoadingData(true);
    try {
      const data = await api.get<ScheduleTrip[]>(
        `/trips/driver/schedule?fromDate=${from.toISOString()}&toDate=${to.toISOString()}`
      );
      setTrips(data);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoadingData(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    if (!loading && user) {
      if (!isAnyDriver()) {
        router.push('/passenger');
        return;
      }
      fetchSchedule();
    }
  }, [loading, user, isAnyDriver, router, fetchSchedule]);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  // Calculate working time (sum of arrival - departure for non-cancelled trips)
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
            {tStatus('inProgress')}
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('schedule.title')}</h1>
      </div>

      {/* View toggle + navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            {t('schedule.viewDaily')}
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            {t('schedule.viewWeekly')}
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            {t('schedule.viewMonthly')}
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
              <p className="text-sm text-muted-foreground">{t('schedule.totalTrips')}</p>
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
              <p className="text-sm text-muted-foreground">{t('schedule.workingTime')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips table */}
      <Card>
        <CardContent className="p-0">
          {loadingData ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : trips.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t('schedule.noTrips')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t('schedule.columnDate')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('schedule.columnRoute')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('schedule.columnDeparture')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('schedule.columnArrival')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('schedule.columnVehicle')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('schedule.columnStatus')}</th>
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
    </div>
  );
}
