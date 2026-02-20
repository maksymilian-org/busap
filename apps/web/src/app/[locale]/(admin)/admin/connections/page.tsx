'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Link } from '@/i18n/navigation';
import { StopAutocomplete } from '@/components/connections/StopAutocomplete';

interface TripResult {
  id: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime: string;
  status: string;
  route: {
    id: string;
    name: string;
    code?: string;
  };
  company: {
    id: string;
    name: string;
  };
  vehicle?: {
    registrationNumber: string;
    brand?: string;
    model?: string;
  };
  driver?: {
    firstName: string;
    lastName: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function AdminConnectionsPage() {
  const t = useTranslations('admin.connections');

  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromStopId, setFromStopId] = useState<string | null>(null);
  const [toStopId, setToStopId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<TripResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStopId || !toStopId) {
      toast({ variant: 'destructive', title: 'Wybierz przystanki' });
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ fromStopId, toStopId });
      if (date) params.set('date', date);
      const data = await api.fetch<TripResult[]>(`/trips/search?${params}`);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pl-PL');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Search form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* From stop */}
              <StopAutocomplete
                value={fromStop}
                stopId={fromStopId}
                onChange={(text) => { setFromStop(text); setFromStopId(null); }}
                onSelect={(stop) => { setFromStop(stop.name); setFromStopId(stop.id); }}
                onClear={() => { setFromStop(''); setFromStopId(null); }}
                label="Skąd"
                placeholder="Przystanek początkowy"
                iconVariant="muted"
              />

              {/* To stop */}
              <StopAutocomplete
                value={toStop}
                stopId={toStopId}
                onChange={(text) => { setToStop(text); setToStopId(null); }}
                onSelect={(stop) => { setToStop(stop.name); setToStopId(stop.id); }}
                onClear={() => { setToStop(''); setToStopId(null); }}
                label="Dokąd"
                placeholder="Przystanek końcowy"
                iconVariant="primary"
              />

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Search button */}
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={searching}>
                  {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Szukaj
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results table */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Wyniki ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {searching ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('noResults')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('table.route')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('table.company')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('table.departure')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('table.arrival')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('table.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((trip) => (
                      <tr key={trip.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/admin/routes`} className="font-medium hover:underline">
                            {trip.route.name}
                            {trip.route.code && <span className="ml-1 text-xs text-muted-foreground">({trip.route.code})</span>}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{trip.company.name}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{formatTime(trip.scheduledDepartureTime)}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(trip.scheduledDepartureTime)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{formatTime(trip.scheduledArrivalTime)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-800'}`}>
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
