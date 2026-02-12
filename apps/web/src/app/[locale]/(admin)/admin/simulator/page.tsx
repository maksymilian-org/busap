'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { BusapMap, BusMarker, StopMarker, RoutePolyline } from '@/components/map';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Activity,
  Gauge,
  Navigation,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripOption {
  id: string;
  status: string;
  scheduledDepartureTime: string;
  route?: { name: string; code?: string };
  vehicle?: { registrationNumber: string; brand?: string; model?: string };
  driver?: { firstName: string; lastName: string };
  routeVersion?: {
    stops: Array<{
      stop: { name: string; latitude: number; longitude: number };
      sequenceNumber: number;
    }>;
  };
}

interface SimulationState {
  id: string;
  tripId: string;
  vehicleId: string;
  status: 'running' | 'paused' | 'stopped' | 'completed';
  currentPosition: { latitude: number; longitude: number };
  speed: number;
  heading: number;
  currentSegment: number;
  segmentProgress: number;
  elapsedMs: number;
  totalDistance: number;
  routeStops: Array<{
    name: string;
    latitude: number;
    longitude: number;
    sequenceNumber: number;
  }>;
}

export default function SimulatorPage() {
  const t = useTranslations('admin.simulator');
  const tCommon = useTranslations('common');
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [simulations, setSimulations] = useState<SimulationState[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [speedMultiplier, setSpeedMultiplier] = useState(10);
  const [updateInterval, setUpdateInterval] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadTrips = useCallback(async () => {
    try {
      const data = await api.fetch<TripOption[]>('/simulator/trips');
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  }, []);

  const loadSimulations = useCallback(async () => {
    try {
      const data = await api.fetch<SimulationState[]>('/simulator/simulations');
      setSimulations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load simulations:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadTrips(), loadSimulations()]).finally(() => setLoading(false));
  }, [loadTrips, loadSimulations]);

  useEffect(() => {
    if (simulations.some((s) => s.status === 'running')) {
      pollRef.current = setInterval(loadSimulations, 2000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [simulations, loadSimulations]);

  const handleStart = async () => {
    if (!selectedTripId) return;
    setStarting(true);
    try {
      await api.fetch('/simulator/start', {
        method: 'POST',
        body: JSON.stringify({
          tripId: selectedTripId,
          speedMultiplier,
          updateIntervalMs: updateInterval,
          randomDeviation: 50,
        }),
      });
      await loadSimulations();
      setSelectedTripId('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setStarting(false);
    }
  };

  const handlePause = async (simId: string) => {
    await api.fetch(`/simulator/pause/${simId}`, { method: 'POST' });
    await loadSimulations();
  };

  const handleResume = async (simId: string) => {
    await api.fetch(`/simulator/resume/${simId}`, { method: 'POST' });
    await loadSimulations();
  };

  const handleStop = async (simId: string) => {
    await api.fetch(`/simulator/${simId}`, { method: 'DELETE' });
    await loadSimulations();
  };

  const activeSimulation = simulations.find(
    (s) => s.status === 'running' || s.status === 'paused',
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('newSimulation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('trip')}</label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('selectTrip')}</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.route?.name || t('noRoute')} | {trip.vehicle?.registrationNumber || t('noVehicle')} |{' '}
                      {new Date(trip.scheduledDepartureTime).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {t('speedMultiplier', { value: speedMultiplier })}
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                  className="mt-1 w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('speedRealtime')}</span>
                  <span>50x</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {t('updateInterval', { value: updateInterval / 1000 })}
                </label>
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={500}
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </div>

              <Button
                onClick={handleStart}
                disabled={!selectedTripId || starting}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {starting ? t('starting') : t('startSimulation')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('activeSimulations', { count: simulations.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {simulations.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noActiveSimulations')}</p>
              ) : (
                <div className="space-y-3">
                  {simulations.map((sim) => (
                    <div
                      key={sim.id}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono">{sim.id}</span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            sim.status === 'running'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : sim.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : sim.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          )}
                        >
                          <Activity className="h-3 w-3" />
                          {t(`status.${sim.status}`)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          {sim.speed?.toFixed(0) || 0} km/h
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {sim.heading?.toFixed(0) || 0}°
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {t('segment', { current: (sim.currentSegment || 0) + 1, total: sim.routeStops?.length || 0 })}
                        </div>
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {((sim.elapsedMs || 0) / 1000).toFixed(0)}s
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {sim.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePause(sim.id)}
                            className="flex-1"
                          >
                            <Pause className="h-3.5 w-3.5 mr-1" />
                            {t('pause')}
                          </Button>
                        )}
                        {sim.status === 'paused' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResume(sim.id)}
                            className="flex-1"
                          >
                            <Play className="h-3.5 w-3.5 mr-1" />
                            {t('resume')}
                          </Button>
                        )}
                        {(sim.status === 'running' || sim.status === 'paused') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStop(sim.id)}
                            className="flex-1"
                          >
                            <Square className="h-3.5 w-3.5 mr-1" />
                            {t('stop')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <BusapMap
                className="h-[600px] rounded-lg"
                center={
                  activeSimulation
                    ? [
                        activeSimulation.currentPosition.latitude,
                        activeSimulation.currentPosition.longitude,
                      ]
                    : [52.0, 19.5]
                }
                zoom={activeSimulation ? 10 : 6}
              >
                {simulations.map((sim) => (
                  <span key={`stops-${sim.id}`}>
                    {sim.routeStops?.map((stop) => (
                      <StopMarker
                        key={`${sim.id}-${stop.sequenceNumber}`}
                        position={[stop.latitude, stop.longitude]}
                        name={stop.name}
                      />
                    ))}

                    {sim.routeStops && (
                      <RoutePolyline
                        positions={sim.routeStops.map(
                          (s) => [s.latitude, s.longitude] as [number, number]
                        )}
                        color="#3b82f6"
                        weight={3}
                      />
                    )}

                    {sim.currentPosition && (
                      <BusMarker
                        position={[
                          sim.currentPosition.latitude,
                          sim.currentPosition.longitude,
                        ]}
                        heading={sim.heading}
                        speed={sim.speed}
                      />
                    )}
                  </span>
                ))}

                {selectedTripId && !activeSimulation && (() => {
                  const trip = trips.find((tr) => tr.id === selectedTripId);
                  if (!trip?.routeVersion?.stops) return null;
                  const stops = trip.routeVersion.stops;
                  return (
                    <>
                      {stops.map((rs) => (
                        <StopMarker
                          key={rs.stop.name}
                          position={[rs.stop.latitude, rs.stop.longitude]}
                          name={rs.stop.name}
                        />
                      ))}
                      <RoutePolyline
                        positions={stops.map(
                          (rs) => [rs.stop.latitude, rs.stop.longitude] as [number, number]
                        )}
                        color="#94a3b8"
                        weight={3}
                        dashArray="10 5"
                        name={trip.route?.name}
                      />
                    </>
                  );
                })()}
              </BusapMap>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
