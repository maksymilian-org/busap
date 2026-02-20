'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Calendar,
  Clock,
  Bus,
  Navigation,
  Loader2,
  AlertCircle,
  MapIcon,
  BookmarkPlus,
  Trash2,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { BusapMap, StopMarker, BusMarker, RoutePolyline } from '@/components/map';
import { Link } from '@/i18n/navigation';
import { StopAutocomplete } from '@/components/connections/StopAutocomplete';

interface StopData {
  id: string;
  name: string;
  code?: string;
  city?: string;
  latitude: number;
  longitude: number;
}

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
    logoUrl?: string;
  };
  vehicle?: {
    id: string;
    registrationNumber: string;
    brand?: string;
    model?: string;
    photoUrl?: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  routeVersion?: {
    stops: Array<{
      stop: StopData;
      sequenceNumber: number;
      departureOffset: number;
    }>;
  };
  price?: number;
  duration?: number;
}

interface GpsPosition {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface SavedConnection {
  id: string;
  name?: string;
  fromStop: { id: string; name: string; city?: string };
  toStop: { id: string; name: string; city?: string };
}

export default function ConnectionsPage() {
  const t = useTranslations('dashboard.connections');
  const tPassenger = useTranslations('dashboard.passenger');
  const { user } = useAuth();

  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [fromStopId, setFromStopId] = useState<string | null>(null);
  const [toStopId, setToStopId] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<TripResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedTrip, setSelectedTrip] = useState<TripResult | null>(null);
  const [tripGps, setTripGps] = useState<GpsPosition | null>(null);
  const [showMap, setShowMap] = useState(false);

  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([]);
  const [savingConnection, setSavingConnection] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const tCommon = useTranslations('common');

  // Load saved connections
  const loadSavedConnections = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.fetch<SavedConnection[]>('/connections');
      setSavedConnections(Array.isArray(data) ? data : []);
    } catch {
      // Not critical
    }
  }, [user]);

  useEffect(() => {
    loadSavedConnections();
  }, [loadSavedConnections]);


  // GPS polling for selected trip
  useEffect(() => {
    if (selectedTrip && selectedTrip.status === 'in_progress') {
      const fetchGps = async () => {
        try {
          const data = await api.fetch<GpsPosition>(`/gps/vehicle/${selectedTrip.vehicle?.id}/latest`);
          setTripGps(data);
        } catch {
          // Ignore GPS polling errors
        }
      };
      fetchGps();
      gpsIntervalRef.current = setInterval(fetchGps, 5000);
      return () => {
        if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
      };
    } else {
      setTripGps(null);
    }
  }, [selectedTrip]);

  const runSearch = useCallback(async (fId: string, tId: string, d: string) => {
    setSearching(true);
    setHasSearched(true);
    setSelectedTrip(null);

    try {
      const params = new URLSearchParams({ fromStopId: fId, toStopId: tId });
      if (d) params.set('date', d);

      const data = await api.fetch<TripResult[]>(`/trips/search?${params}`);
      setSearchResults(Array.isArray(data) ? data : []);

      if (!data.length) {
        toast({ title: tPassenger('noResults'), description: tPassenger('noResultsHint') });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: tPassenger('noResults'), description: err.message });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [tPassenger]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStopId || !toStopId) {
      toast({ variant: 'destructive', title: tPassenger('selectStops'), description: tPassenger('selectStopsHint') });
      return;
    }
    await runSearch(fromStopId, toStopId, date);
  };

  const handleSaveConnection = async () => {
    if (!fromStopId || !toStopId) return;
    setSavingConnection(true);
    try {
      await api.fetch('/connections', {
        method: 'POST',
        body: JSON.stringify({ fromStopId, toStopId }),
      });
      toast({ title: t('connectionSaved') });
      await loadSavedConnections();
    } catch (err: any) {
      if (err?.status === 409 || String(err?.message).includes('409') || String(err?.message).includes('already')) {
        toast({ title: t('connectionExists') });
      } else {
        toast({ variant: 'destructive', title: err.message });
      }
    } finally {
      setSavingConnection(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      await api.fetch(`/connections/${id}`, { method: 'DELETE' });
      toast({ title: t('connectionRemoved') });
      setSavedConnections((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  const handleSearchFromSaved = async (conn: SavedConnection) => {
    setFromStop(conn.fromStop.name);
    setFromStopId(conn.fromStop.id);
    setToStop(conn.toStop.name);
    setToStopId(conn.toStop.id);
    await runSearch(conn.fromStop.id, conn.toStop.id, date);
  };

  const selectTrip = (trip: TripResult) => {
    setSelectedTrip(trip);
    setShowMap(true);
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return tPassenger('tripStatus.scheduled');
      case 'in_progress': return tPassenger('tripStatus.inProgress');
      case 'completed': return tPassenger('tripStatus.completed');
      case 'cancelled': return tPassenger('tripStatus.cancelled');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const mapCenter: [number, number] = selectedTrip?.routeVersion?.stops?.[0]?.stop
    ? [selectedTrip.routeVersion.stops[0].stop.latitude, selectedTrip.routeVersion.stops[0].stop.longitude]
    : [52.0, 19.5];

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
                label={tPassenger('fromLabel')}
                placeholder={tPassenger('fromPlaceholder')}
                iconVariant="muted"
                inputClassName="w-full rounded-lg border bg-background py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {/* To stop */}
              <StopAutocomplete
                value={toStop}
                stopId={toStopId}
                onChange={(text) => { setToStop(text); setToStopId(null); }}
                onSelect={(stop) => { setToStop(stop.name); setToStopId(stop.id); }}
                onClear={() => { setToStop(''); setToStopId(null); }}
                label={tPassenger('toLabel')}
                placeholder={tPassenger('toPlaceholder')}
                iconVariant="primary"
                inputClassName="w-full rounded-lg border bg-background py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{tPassenger('dateLabel')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Search + Save button */}
              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1" size="lg" disabled={searching}>
                  {searching ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                  {tPassenger('searchButton')}
                </Button>
                {fromStopId && toStopId && (
                  <Button type="button" variant="outline" size="lg" onClick={handleSaveConnection} disabled={savingConnection} title={t('saveConnection')}>
                    <BookmarkPlus className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Filters accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                {t('filters')}
              </button>
              {showFilters && (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder={t('filterCity')}
                    className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder={t('filterCountry')}
                    className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Saved Connections */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('saved')}</CardTitle>
          </CardHeader>
          <CardContent>
            {savedConnections.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                <p>{t('noSaved')}</p>
                <p className="mt-1 text-xs">{t('noSavedHint')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedConnections.map((conn) => (
                  <div key={conn.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-1 text-sm min-w-0">
                      <Link href={`/passenger/stops/${conn.fromStop.id}`} className="font-medium hover:underline truncate">
                        {conn.fromStop.name}
                      </Link>
                      {conn.fromStop.city && <span className="text-xs text-muted-foreground">({conn.fromStop.city})</span>}
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <Link href={`/passenger/stops/${conn.toStop.id}`} className="font-medium hover:underline truncate">
                        {conn.toStop.name}
                      </Link>
                      {conn.toStop.city && <span className="text-xs text-muted-foreground">({conn.toStop.city})</span>}
                      {conn.name && <span className="text-xs text-muted-foreground">— {conn.name}</span>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Button variant="ghost" size="sm" onClick={() => handleSearchFromSaved(conn)}>
                        <Search className="h-4 w-4 mr-1" />
                        {t('searchRoute')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteConnection(conn.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{tPassenger('results', { count: searchResults.length })}</span>
                {searchResults.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
                    <MapIcon className="h-4 w-4 mr-2" />
                    {showMap ? tCommon('actions.hideMap') : tCommon('actions.showMap')}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{tPassenger('noResults')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{tPassenger('noResultsHint')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {searchResults.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => selectTrip(trip)}
                      className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted ${
                        selectedTrip?.id === trip.id ? 'ring-2 ring-primary bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {trip.company.logoUrl ? (
                            <img src={trip.company.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                              <Bus className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/passenger/companies/${trip.company.id}`}
                              className="font-medium hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {trip.company.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              <Link
                                href={`/passenger/routes/${trip.route.id}`}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {trip.route.name}
                              </Link>
                            </p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(trip.status)}`}>
                          {getStatusLabel(trip.status)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-lg font-bold">{formatTime(trip.scheduledDepartureTime)}</p>
                            <p className="text-xs text-muted-foreground">{tPassenger('departure')}</p>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <div className="h-px w-8 bg-border" />
                            <Clock className="h-3 w-3" />
                            {trip.duration && <span className="text-xs">{formatDuration(trip.duration)}</span>}
                            <div className="h-px w-8 bg-border" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{formatTime(trip.scheduledArrivalTime)}</p>
                            <p className="text-xs text-muted-foreground">{tPassenger('arrival')}</p>
                          </div>
                        </div>
                        {trip.price && (
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">{trip.price.toFixed(2)} zł</p>
                          </div>
                        )}
                      </div>

                      {trip.vehicle && (
                        <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                          <Bus className="h-3 w-3" />
                          {trip.vehicle.brand} {trip.vehicle.model} ({trip.vehicle.registrationNumber})
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {showMap && selectedTrip && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  <Link href={`/passenger/routes/${selectedTrip.route.id}`} className="hover:underline">
                    {selectedTrip.route.name}
                  </Link>
                  {selectedTrip.status === 'in_progress' && tripGps && (
                    <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-green-600">
                      <Navigation className="h-3 w-3 animate-pulse" />
                      {tPassenger('live')}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[300px] rounded-lg overflow-hidden">
                  <BusapMap center={mapCenter} zoom={8}>
                    {selectedTrip.routeVersion?.stops && (
                      <RoutePolyline
                        positions={selectedTrip.routeVersion.stops.map(
                          (s) => [s.stop.latitude, s.stop.longitude] as [number, number]
                        )}
                        color="#3b82f6"
                        weight={4}
                      />
                    )}
                    {selectedTrip.routeVersion?.stops.map((rs, idx) => (
                      <StopMarker
                        key={rs.stop.id}
                        position={[rs.stop.latitude, rs.stop.longitude]}
                        name={`${idx + 1}. ${rs.stop.name}`}
                      />
                    ))}
                    {tripGps && (
                      <BusMarker
                        position={[tripGps.latitude, tripGps.longitude]}
                        heading={tripGps.heading}
                        speed={tripGps.speed}
                      />
                    )}
                  </BusapMap>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">{tPassenger('stopsOnRoute')}</h4>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {selectedTrip.routeVersion?.stops.map((rs, idx) => (
                      <div key={rs.stop.id} className="flex items-center gap-2 py-1.5 text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <Link href={`/passenger/stops/${rs.stop.id}`} className="font-medium hover:underline">
                            {rs.stop.name}
                          </Link>
                          {rs.stop.city && <span className="text-muted-foreground ml-1">({rs.stop.city})</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">+{rs.departureOffset} min</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTrip.vehicle && (
                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium mb-2">{tPassenger('vehicle')}</h4>
                    <div className="flex items-center gap-3">
                      {selectedTrip.vehicle.photoUrl ? (
                        <img src={selectedTrip.vehicle.photoUrl} alt="" className="h-12 w-16 rounded object-cover" />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded bg-muted">
                          <Bus className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{selectedTrip.vehicle.brand} {selectedTrip.vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{selectedTrip.vehicle.registrationNumber}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
