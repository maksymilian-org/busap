'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, UserCheck, CheckCircle2, Navigation, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

interface Trip {
  id: string;
  status: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime?: string;
  route?: { id: string; name: string; code?: string };
  vehicle?: { id: string; registrationNumber: string };
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const from = new Date(now);
  from.setDate(from.getDate() - diff);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

const tripStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="h-3 w-3" />ukończony</span>;
    case 'in_progress':
      return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"><Navigation className="h-3 w-3" />w trakcie</span>;
    case 'cancelled':
      return <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">anulowany</span>;
    default:
      return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"><Clock className="h-3 w-3" />zaplanowany</span>;
  }
};

export default function AdminDriverDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const t = useTranslations('admin.drivers.detail');
  const tCommon = useTranslations('common');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weekTrips, setWeekTrips] = useState<Trip[]>([]);
  const [historyTrips, setHistoryTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getWeekRange();
      const [profileData, weekData, historyData] = await Promise.all([
        api.fetch<UserProfile>(`/users/${userId}`),
        api.fetch<any>(`/trips?driverId=${userId}&fromDate=${from.toISOString()}&toDate=${to.toISOString()}`),
        api.fetch<any>(`/trips?driverId=${userId}&limit=20`),
      ]);
      setProfile(profileData);
      setWeekTrips(Array.isArray(weekData) ? weekData : weekData.data || []);
      setHistoryTrips(Array.isArray(historyData) ? historyData : historyData.data || []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  const distinctRoutes = [...new Set(historyTrips.map((t) => t.route?.name).filter(Boolean))];
  const distinctVehicles = [...new Set(historyTrips.map((t) => t.vehicle?.registrationNumber).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Driver not found</p>
        <Button asChild className="mt-4"><Link href="/admin/drivers">{t('back')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/drivers"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {profile.firstName[0]}{profile.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
            {profile.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
          </div>
          <span className={cn(
            'ml-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            profile.isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          )}>
            {profile.isActive ? 'Aktywny' : 'Nieaktywny'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{historyTrips.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Kursy (historia)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{distinctRoutes.length}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('uniqueRoutes')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{distinctVehicles.length}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('uniqueVehicles')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t('schedule')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {weekTrips.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">{t('noHistory')}</p>
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
                  {weekTrips.map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(trip.scheduledDepartureTime)}</td>
                      <td className="px-4 py-3">{trip.route ? `${trip.route.code ? trip.route.code + ': ' : ''}${trip.route.name}` : '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatTime(trip.scheduledDepartureTime)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{trip.scheduledArrivalTime ? formatTime(trip.scheduledArrivalTime) : '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{trip.vehicle?.registrationNumber ?? '-'}</td>
                      <td className="px-4 py-3">{tripStatusBadge(trip.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip history */}
      <Card>
        <CardHeader>
          <CardTitle>{t('history')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyTrips.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">{t('noHistory')}</p>
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
                  {historyTrips.map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(trip.scheduledDepartureTime)}</td>
                      <td className="px-4 py-3">{trip.route ? `${trip.route.code ? trip.route.code + ': ' : ''}${trip.route.name}` : '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatTime(trip.scheduledDepartureTime)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{trip.scheduledArrivalTime ? formatTime(trip.scheduledArrivalTime) : '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{trip.vehicle?.registrationNumber ?? '-'}</td>
                      <td className="px-4 py-3">{tripStatusBadge(trip.status)}</td>
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
