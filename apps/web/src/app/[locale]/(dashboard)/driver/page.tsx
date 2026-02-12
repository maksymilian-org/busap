'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bus,
  Clock,
  MapPin,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sample data
const todayTrips = [
  {
    id: '1',
    route: 'Linia 42: Warszawa - Kraków',
    departureTime: '06:30',
    arrivalTime: '09:45',
    vehicle: 'WZ 12345',
    status: 'completed',
    stops: 8,
  },
  {
    id: '2',
    route: 'Linia 42: Kraków - Warszawa',
    departureTime: '14:30',
    arrivalTime: '17:45',
    vehicle: 'WZ 12345',
    status: 'scheduled',
    stops: 8,
  },
  {
    id: '3',
    route: 'Linia 15: Warszawa - Łódź',
    departureTime: '19:00',
    arrivalTime: '21:30',
    vehicle: 'WZ 67890',
    status: 'scheduled',
    stops: 5,
  },
];

export default function DriverPage() {
  const t = useTranslations('dashboard.driver');
  const tStatus = useTranslations('dashboard.passenger.tripStatus');
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  const nextTrip = todayTrips.find((t) => t.status === 'scheduled');
  const completedTrips = todayTrips.filter((t) => t.status === 'completed');

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
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            {tStatus('scheduled')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
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
              <p className="text-sm text-muted-foreground">Kursy dzisiaj</p>
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
              <p className="text-sm text-muted-foreground">Ukończone</p>
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
                {nextTrip ? nextTrip.departureTime : '--:--'}
              </p>
              <p className="text-sm text-muted-foreground">Następny kurs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next trip highlight */}
      {nextTrip && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Navigation className="h-5 w-5 text-primary" />
              Następny kurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xl font-semibold">{nextTrip.route}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {nextTrip.departureTime} - {nextTrip.arrivalTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus className="h-4 w-4" />
                    {nextTrip.vehicle}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {nextTrip.stops} przystanków
                  </span>
                </div>
              </div>
              <Button size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Rozpocznij kurs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All trips list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wszystkie kursy</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <p className="font-medium">{trip.route}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {trip.departureTime} - {trip.arrivalTime}
                      </span>
                      <span>{trip.vehicle}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(trip.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
