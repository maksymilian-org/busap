'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Bus,
  Navigation,
  Loader2,
  AlertCircle,
  MapIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { BusapMap, StopMarker, BusMarker, RoutePolyline } from '@/components/map';

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

export default function PassengerPage() {
  const t = useTranslations('dashboard.passenger');
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [fromStopId, setFromStopId] = useState<string | null>(null);
  const [toStopId, setToStopId] = useState<string | null>(null);

  const [fromSuggestions, setFromSuggestions] = useState<StopData[]>([]);
  const [toSuggestions, setToSuggestions] = useState<StopData[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const [searchResults, setSearchResults] = useState<TripResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedTrip, setSelectedTrip] = useState<TripResult | null>(null);
  const [tripGps, setTripGps] = useState<GpsPosition | null>(null);
  const [showMap, setShowMap] = useState(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced stop search
  const searchStops = useCallback(async (query: string, setResults: (stops: StopData[]) => void) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    try {
      const data = await api.fetch<StopData[]>(`/stops/search?query=${encodeURIComponent(query)}&limit=10`);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to search stops:', err);
    }
  }, []);

  // Debounce effect for from stop
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromStop && !fromStopId) {
        searchStops(fromStop, setFromSuggestions);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fromStop, fromStopId, searchStops]);

  // Debounce effect for to stop
  useEffect(() => {
    const timer = setTimeout(() => {
      if (toStop && !toStopId) {
        searchStops(toStop, setToSuggestions);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [toStop, toStopId, searchStops]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setShowFromSuggestions(false);
      }
      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setShowToSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // GPS polling for selected trip
  useEffect(() => {
    if (selectedTrip && selectedTrip.status === 'in_progress') {
      const fetchGps = async () => {
        try {
          const data = await api.fetch<GpsPosition>(`/gps/vehicle/${selectedTrip.vehicle?.id}/latest`);
          setTripGps(data);
        } catch (err) {
          // Ignore errors for GPS polling
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

  const selectFromStop = (stop: StopData) => {
    setFromStop(stop.name);
    setFromStopId(stop.id);
    setFromSuggestions([]);
    setShowFromSuggestions(false);
  };

  const selectToStop = (stop: StopData) => {
    setToStop(stop.name);
    setToStopId(stop.id);
    setToSuggestions([]);
    setShowToSuggestions(false);
  };

  const clearFromStop = () => {
    setFromStop('');
    setFromStopId(null);
  };

  const clearToStop = () => {
    setToStop('');
    setToStopId(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromStopId || !toStopId) {
      toast({
        variant: 'destructive',
        title: t('selectStops'),
        description: t('selectStopsHint'),
      });
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setSelectedTrip(null);

    try {
      const params = new URLSearchParams({
        fromStopId,
        toStopId,
      });
      if (date) params.set('date', date);

      const data = await api.fetch<TripResult[]>(`/trips/search?${params}`);
      setSearchResults(Array.isArray(data) ? data : []);

      if (data.length === 0) {
        toast({
          title: t('noResults'),
          description: t('noResultsHint'),
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('noResults'),
        description: err.message,
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectTrip = (trip: TripResult) => {
    setSelectedTrip(trip);
    setShowMap(true);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return t('tripStatus.scheduled');
      case 'in_progress': return t('tripStatus.inProgress');
      case 'completed': return t('tripStatus.completed');
      case 'cancelled': return t('tripStatus.cancelled');
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

  // Calculate map center and bounds
  const mapCenter: [number, number] = selectedTrip?.routeVersion?.stops?.[0]?.stop
    ? [selectedTrip.routeVersion.stops[0].stop.latitude, selectedTrip.routeVersion.stops[0].stop.longitude]
    : [52.0, 19.5];

  const tCommon = useTranslations('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Search form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* From stop */}
              <div className="space-y-2" ref={fromRef}>
                <label className="text-sm font-medium">{t('fromLabel')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('fromPlaceholder')}
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={fromStop}
                    onChange={(e) => {
                      setFromStop(e.target.value);
                      setFromStopId(null);
                      setShowFromSuggestions(true);
                    }}
                    onFocus={() => setShowFromSuggestions(true)}
                  />
                  {fromStopId && (
                    <button
                      type="button"
                      onClick={clearFromStop}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* From suggestions dropdown */}
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border bg-card shadow-lg">
                      {fromSuggestions.map((stop) => (
                        <button
                          key={stop.id}
                          type="button"
                          onClick={() => selectFromStop(stop)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <div className="font-medium">{stop.name}</div>
                            {stop.city && (
                              <div className="text-xs text-muted-foreground">{stop.city}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* To stop */}
              <div className="space-y-2" ref={toRef}>
                <label className="text-sm font-medium">{t('toLabel')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                  <input
                    type="text"
                    placeholder={t('toPlaceholder')}
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={toStop}
                    onChange={(e) => {
                      setToStop(e.target.value);
                      setToStopId(null);
                      setShowToSuggestions(true);
                    }}
                    onFocus={() => setShowToSuggestions(true)}
                  />
                  {toStopId && (
                    <button
                      type="button"
                      onClick={clearToStop}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* To suggestions dropdown */}
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border bg-card shadow-lg">
                      {toSuggestions.map((stop) => (
                        <button
                          key={stop.id}
                          type="button"
                          onClick={() => selectToStop(stop)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          <div>
                            <div className="font-medium">{stop.name}</div>
                            {stop.city && (
                              <div className="text-xs text-muted-foreground">{stop.city}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('dateLabel')}</label>
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

              {/* Search button */}
              <div className="flex items-end">
                <Button type="submit" className="w-full" size="lg" disabled={searching}>
                  {searching ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-5 w-5" />
                  )}
                  {t('searchButton')}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Trip list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{t('results', { count: searchResults.length })}</span>
                {searchResults.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                  >
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
                  <p className="text-muted-foreground">{t('noResults')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('noResultsHint')}</p>
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
                            <p className="font-medium">{trip.company.name}</p>
                            <p className="text-xs text-muted-foreground">{trip.route.name}</p>
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
                            <p className="text-xs text-muted-foreground">{t('departure')}</p>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <div className="h-px w-8 bg-border" />
                            <Clock className="h-3 w-3" />
                            {trip.duration && <span className="text-xs">{formatDuration(trip.duration)}</span>}
                            <div className="h-px w-8 bg-border" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{formatTime(trip.scheduledArrivalTime)}</p>
                            <p className="text-xs text-muted-foreground">{t('arrival')}</p>
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

          {/* Map and trip details */}
          {showMap && selectedTrip && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedTrip.route.name}
                  {selectedTrip.status === 'in_progress' && tripGps && (
                    <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-green-600">
                      <Navigation className="h-3 w-3 animate-pulse" />
                      {t('live')}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Map */}
                <div className="h-[300px] rounded-lg overflow-hidden">
                  <BusapMap center={mapCenter} zoom={8}>
                    {/* Route polyline */}
                    {selectedTrip.routeVersion?.stops && (
                      <RoutePolyline
                        positions={selectedTrip.routeVersion.stops.map(
                          (s) => [s.stop.latitude, s.stop.longitude] as [number, number]
                        )}
                        color="#3b82f6"
                        weight={4}
                      />
                    )}

                    {/* Stop markers */}
                    {selectedTrip.routeVersion?.stops.map((rs, idx) => (
                      <StopMarker
                        key={rs.stop.id}
                        position={[rs.stop.latitude, rs.stop.longitude]}
                        name={`${idx + 1}. ${rs.stop.name}`}
                      />
                    ))}

                    {/* Bus marker if in progress */}
                    {tripGps && (
                      <BusMarker
                        position={[tripGps.latitude, tripGps.longitude]}
                        heading={tripGps.heading}
                        speed={tripGps.speed}
                      />
                    )}
                  </BusapMap>
                </div>

                {/* Stops list */}
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('stopsOnRoute')}</h4>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {selectedTrip.routeVersion?.stops.map((rs, idx) => (
                      <div
                        key={rs.stop.id}
                        className="flex items-center gap-2 py-1.5 text-sm"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{rs.stop.name}</span>
                          {rs.stop.city && (
                            <span className="text-muted-foreground ml-1">({rs.stop.city})</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          +{rs.departureOffset} min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vehicle info */}
                {selectedTrip.vehicle && (
                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium mb-2">{t('vehicle')}</h4>
                    <div className="flex items-center gap-3">
                      {selectedTrip.vehicle.photoUrl ? (
                        <img
                          src={selectedTrip.vehicle.photoUrl}
                          alt=""
                          className="h-12 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded bg-muted">
                          <Bus className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {selectedTrip.vehicle.brand} {selectedTrip.vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTrip.vehicle.registrationNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Initial state - no search yet */}
      {!hasSearched && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('howToSearch')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  1
                </div>
                <div>
                  <p className="font-medium">{t('step1Title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('step1Desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  2
                </div>
                <div>
                  <p className="font-medium">{t('step2Title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('step2Desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  3
                </div>
                <div>
                  <p className="font-medium">{t('step3Title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('step3Desc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('featuresTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Navigation className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('featureLiveTracking')}</p>
                  <p className="text-xs text-muted-foreground">{t('featureLiveTrackingDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('featureEta')}</p>
                  <p className="text-xs text-muted-foreground">{t('featureEtaDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <MapIcon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('featureRouteMap')}</p>
                  <p className="text-xs text-muted-foreground">{t('featureRouteMapDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
