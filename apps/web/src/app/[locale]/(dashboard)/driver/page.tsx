'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import {
  Bus,
  Clock,
  Navigation,
  CheckCircle2,
  Play,
  Square,
  Truck,
  Users as UsersIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Trip {
  id: string;
  status: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime: string;
  route: {
    name: string;
    code?: string;
    currentVersion?: {
      stops?: Array<{ stop: { name: string } }>;
    };
  };
  vehicle?: {
    registrationNumber: string;
    brand?: string;
    model?: string;
    capacity?: number;
  } | null;
}

interface NextTripResponse {
  trip: Trip | null;
  timeUntilDeparture: string | null;
  timeUntilDepartureMs: number | null;
}

export default function DriverPage() {
  const t = useTranslations('dashboard.driver');
  const tStatus = useTranslations('dashboard.passenger.tripStatus');
  const { user, loading, isAnyDriver } = useAuth();
  const router = useRouter();
  const [todayTrips, setTodayTrips] = useState<Trip[]>([]);
  const [nextTripData, setNextTripData] = useState<NextTripResponse | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [trips, next] = await Promise.all([
        api.get<Trip[]>('/trips/driver/today'),
        api.get<NextTripResponse>('/trips/driver/next'),
      ]);
      setTodayTrips(trips);
      setNextTripData(next);
    } catch (err) {
      console.error('Failed to fetch driver data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      if (!isAnyDriver()) {
        router.push('/passenger');
        return;
      }
      fetchData();
    }
  }, [loading, user, isAnyDriver, router, fetchData]);

  // Countdown timer
  useEffect(() => {
    if (!nextTripData?.timeUntilDepartureMs) {
      setCountdown(null);
      return;
    }

    let remaining = nextTripData.timeUntilDepartureMs;
    const updateCountdown = () => {
      if (remaining <= 0) {
        setCountdown('0:00:00');
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      remaining -= 1000;
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextTripData?.timeUntilDepartureMs]);

  const handleStartTrip = async (tripId: string) => {
    setActionLoading(tripId);
    try {
      await api.post(`/trips/${tripId}/start`);
      await fetchData();
    } catch (err) {
      console.error('Failed to start trip:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTrip = async (tripId: string) => {
    setActionLoading(tripId);
    try {
      await api.post(`/trips/${tripId}/complete`);
      await fetchData();
    } catch (err) {
      console.error('Failed to complete trip:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const completedTrips = todayTrips.filter((t) => t.status === 'completed');
  const nextTrip = nextTripData?.trip;

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

  if (loading || loadingData) {
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayTrips.length}</p>
              <p className="text-sm text-muted-foreground">{t('todayTrips')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTrips.length}</p>
              <p className="text-sm text-muted-foreground">{t('completedTrips')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {countdown ?? '--:--'}
              </p>
              <p className="text-sm text-muted-foreground">{t('nextDeparture')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Countdown + Next trip */}
      {nextTrip ? (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Navigation className="h-5 w-5 text-primary" />
              {t('nextTripTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xl font-semibold">
                  {nextTrip.route?.code ? `${nextTrip.route.code}: ` : ''}{nextTrip.route?.name}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(nextTrip.scheduledDepartureTime)} - {formatTime(nextTrip.scheduledArrivalTime)}
                  </span>
                  {nextTrip.vehicle && (
                    <>
                      <span className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        {nextTrip.vehicle.registrationNumber}
                        {nextTrip.vehicle.brand && ` ${nextTrip.vehicle.brand}`}
                        {nextTrip.vehicle.model && ` ${nextTrip.vehicle.model}`}
                      </span>
                      {nextTrip.vehicle.capacity && (
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-4 w-4" />
                          {t('capacity')}: {nextTrip.vehicle.capacity}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {countdown && (
                  <p className="mt-2 text-lg font-mono font-bold text-primary">
                    {t('countdownLabel')}: {countdown}
                  </p>
                )}
              </div>
              <Button
                size="lg"
                className="gap-2"
                onClick={() => handleStartTrip(nextTrip.id)}
                disabled={actionLoading === nextTrip.id}
              >
                <Play className="h-5 w-5" />
                {t('startTrip')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('noNextTrip')}
          </CardContent>
        </Card>
      )}

      {/* All trips list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('allTodayTrips')}</CardTitle>
        </CardHeader>
        <CardContent>
          {todayTrips.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">{t('noNextTrip')}</p>
          ) : (
            <div className="space-y-3">
              {todayTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Bus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {trip.route?.code ? `${trip.route.code}: ` : ''}{trip.route?.name}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          {formatTime(trip.scheduledDepartureTime)} - {formatTime(trip.scheduledArrivalTime)}
                        </span>
                        {trip.vehicle && (
                          <span>{trip.vehicle.registrationNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {trip.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleCompleteTrip(trip.id)}
                        disabled={actionLoading === trip.id}
                      >
                        <Square className="h-3 w-3" />
                        {t('completeTrip')}
                      </Button>
                    )}
                    {trip.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleStartTrip(trip.id)}
                        disabled={actionLoading === trip.id}
                      >
                        <Play className="h-3 w-3" />
                        {t('startTrip')}
                      </Button>
                    )}
                    {getStatusBadge(trip.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
