'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import StopSelector from './StopSelector';
import DraggableStopList, { type BuilderStop } from './DraggableStopList';
import QuickCreateStopDialog from './QuickCreateStopDialog';
import type { GeoJsonLineString } from '@busap/shared';

// Dynamic import for map to avoid SSR issues
const MapSection = dynamic(() => import('./RouteBuilderMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

interface RouteWithDetails {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  comment?: string | null;
  type: string;
  currentVersion?: {
    id: string;
    geometry?: GeoJsonLineString | null;
    totalDistance?: number | null;
    totalDuration?: number | null;
    waypoints?: Record<string, [number, number][]>;
    stops: Array<{
      id: string;
      stopId: string;
      sequenceNumber: number;
      distanceFromStart: number;
      durationFromStart: number;
      isPickup: boolean;
      isDropoff: boolean;
      isMain: boolean;
      stop: {
        id: string;
        name: string;
        code?: string;
        city?: string;
        latitude: number;
        longitude: number;
      };
    }>;
  };
}

interface RouteBuilderProps {
  companyId: string;
  existingRoute?: RouteWithDetails;
  mode: 'create' | 'edit';
  /** When false (e.g. owner/manager), name field is read-only and name is not sent on update */
  canEditName?: boolean;
  /** Where to navigate on save or back. Defaults to /company/:companyId/routes */
  backHref?: string;
}

let stopCounter = 0;

export default function RouteBuilder({ companyId, existingRoute, mode, canEditName = true, backHref }: RouteBuilderProps) {
  const t = useTranslations('company.routes.builder');
  const tCommon = useTranslations('common');
  const router = useRouter();

  // Form state
  const [name, setName] = useState(existingRoute?.name || '');
  const [code, setCode] = useState(existingRoute?.code || '');
  const [routeType, setRouteType] = useState(existingRoute?.type || 'linear');
  const [comment, setComment] = useState(existingRoute?.comment || '');
  const [autoName, setAutoName] = useState(!existingRoute);
  const nameReadOnly = !canEditName;

  // Stops state
  const [stops, setStops] = useState<BuilderStop[]>(() => {
    if (existingRoute?.currentVersion?.stops) {
      return existingRoute.currentVersion.stops
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
        .map((rs) => ({
          id: `existing-${rs.id}`,
          stopId: rs.stop.id,
          name: rs.stop.name,
          city: rs.stop.city,
          code: rs.stop.code,
          latitude: rs.stop.latitude,
          longitude: rs.stop.longitude,
          isMain: rs.isMain ?? false,
        }));
    }
    return [];
  });

  // Route geometry state
  const [routeGeometry, setRouteGeometry] = useState<GeoJsonLineString | null>(
    existingRoute?.currentVersion?.geometry || null,
  );
  const [waypoints, setWaypoints] = useState<Record<string, [number, number][]>>(
    existingRoute?.currentVersion?.waypoints || {},
  );
  const [geometryLoading, setGeometryLoading] = useState(false);

  // Quick create dialog
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateCoords, setQuickCreateCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Debounce ref for geometry preview
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPreviewKeyRef = useRef<string>('');

  // Auto-name generation using city names
  const generatedName = useMemo(() => {
    if (stops.length < 2) return '';

    const cities: string[] = [];
    for (const s of stops) {
      const cityName = s.city || s.name;
      if (cityName && cities[cities.length - 1] !== cityName) {
        cities.push(cityName);
      }
    }

    if (cities.length === 0) return '';
    if (cities.length === 1) return cities[0];

    const first = cities[0];
    const last = cities[cities.length - 1];
    const via = cities.slice(1, -1);

    if (via.length === 0) return `${first} - ${last}`;
    return `${first} - ${last} (via ${via.join(', ')})`;
  }, [stops]);

  // Keep name in sync when autoName is on; when name read-only use existing or generated
  const effectiveName = nameReadOnly
    ? (mode === 'edit' ? (existingRoute?.name ?? '') : generatedName)
    : (autoName ? generatedName : name);

  // Added stop IDs for deduplication
  const addedStopIds = useMemo(() => new Set(stops.map((s) => s.stopId)), [stops]);

  // Map positions
  const mapPositions = useMemo(
    () => stops.map((s) => [s.latitude, s.longitude] as [number, number]),
    [stops]
  );

  // Fetch geometry preview when stops or waypoints change
  useEffect(() => {
    if (stops.length < 2) {
      setRouteGeometry(null);
      return;
    }

    const previewKey = JSON.stringify({
      stops: stops.map((s) => [s.latitude, s.longitude]),
      waypoints,
    });

    // Skip if nothing changed
    if (previewKey === prevPreviewKeyRef.current) return;

    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = setTimeout(async () => {
      prevPreviewKeyRef.current = previewKey;
      setGeometryLoading(true);
      try {
        const result = await api.post('/routes/preview-geometry', {
          stops: stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
          waypoints,
        });
        if (result?.geometry) {
          setRouteGeometry(result.geometry);
        }
      } catch {
        // Non-fatal — fall back to straight lines
        setRouteGeometry(null);
      } finally {
        setGeometryLoading(false);
      }
    }, 600);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [stops, waypoints]);

  const handleWaypointAdd = useCallback(
    (segIdx: number, lat: number, lng: number) => {
      setWaypoints((prev) => {
        const key = String(segIdx);
        const existing = prev[key] || [];
        return { ...prev, [key]: [...existing, [lat, lng]] };
      });
    },
    [],
  );

  const handleWaypointMove = useCallback(
    (segIdx: number, wpIdx: number, lat: number, lng: number) => {
      setWaypoints((prev) => {
        const key = String(segIdx);
        const existing = [...(prev[key] || [])];
        existing[wpIdx] = [lat, lng];
        return { ...prev, [key]: existing };
      });
    },
    [],
  );

  const handleWaypointRemove = useCallback(
    (segIdx: number, wpIdx: number) => {
      setWaypoints((prev) => {
        const key = String(segIdx);
        const existing = [...(prev[key] || [])];
        existing.splice(wpIdx, 1);
        const next = { ...prev };
        if (existing.length === 0) {
          delete next[key];
        } else {
          next[key] = existing;
        }
        return next;
      });
    },
    [],
  );

  const handleAddStop = useCallback((stop: { id: string; name: string; city?: string; code?: string; latitude: number; longitude: number }) => {
    setStops((prev) => [
      ...prev,
      {
        id: `stop-${++stopCounter}`,
        stopId: stop.id,
        name: stop.name,
        city: stop.city,
        code: stop.code,
        latitude: stop.latitude,
        longitude: stop.longitude,
        isMain: false,
      },
    ]);
  }, []);

  const handleReorder = useCallback((newStops: BuilderStop[]) => {
    setStops(newStops);
    // Reset waypoints — segment indices change after reorder
    setWaypoints({});
  }, []);

  const handleToggleMain = useCallback((index: number) => {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, isMain: !s.isMain } : s))
    );
  }, []);

  const handleRemove = useCallback((index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
    // Reset waypoints — segment indices change after removal
    setWaypoints({});
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setQuickCreateCoords({ lat, lng });
    setQuickCreateOpen(true);
  }, []);

  const handleQuickCreateDone = useCallback((stop: { id: string; name: string; city?: string; code?: string; latitude: number; longitude: number }) => {
    handleAddStop(stop);
    setQuickCreateOpen(false);
    setQuickCreateCoords(null);
  }, [handleAddStop]);

  const handleSave = async () => {
    const routeName = effectiveName.trim();
    if (!routeName) return;
    if (stops.length < 2) {
      toast({ variant: 'destructive', title: t('minStopsRequired') });
      return;
    }

    setSaving(true);
    try {
      let routeId: string;

      if (mode === 'create') {
        const route = await api.post('/routes', {
          companyId,
          name: routeName,
          nameOverridden: nameReadOnly ? false : !autoName,
          code: code || undefined,
          description: undefined,
          comment: comment || undefined,
          type: routeType,
        });
        routeId = route.id;
      } else {
        routeId = existingRoute!.id;
        const updatePayload: Record<string, unknown> = {
          code: code || undefined,
          comment: comment || undefined,
          type: routeType,
        };
        if (!nameReadOnly) {
          updatePayload.name = routeName;
          updatePayload.nameOverridden = !autoName;
        }
        await api.put(`/routes/${routeId}`, updatePayload);
      }

      // Create version with stops and waypoints
      await api.post(`/routes/${routeId}/versions`, {
        validFrom: new Date().toISOString(),
        stops: stops.map((s, index) => ({
          stopId: s.stopId,
          sequenceNumber: index,
          distanceFromStart: 0,
          durationFromStart: 0,
          isPickup: true,
          isDropoff: true,
          isMain: s.isMain,
        })),
        waypoints: Object.keys(waypoints).length > 0 ? waypoints : undefined,
      });

      toast({ variant: 'success', title: t('saved') });
      router.push(backHref ?? `/company/${companyId}/routes`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backHref ?? `/company/${companyId}/routes`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('backToRoutes')}
          </Button>
          <h1 className="text-lg font-semibold">
            {mode === 'edit' ? t('titleEdit') : t('titleNew')}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saving || stops.length < 2}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" />
              {t('save')}
            </>
          )}
        </Button>
      </div>

      {/* Main content: two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: form + stops */}
        <div className="w-[400px] shrink-0 overflow-y-auto border-r p-4 space-y-4">
          {/* Route name */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('routeName')}</label>
              {!nameReadOnly && (
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={autoName}
                    onChange={(e) => {
                      setAutoName(e.target.checked);
                      if (e.target.checked) setName(generatedName);
                    }}
                    className="rounded border"
                  />
                  {t('autoName')}
                </label>
              )}
            </div>
            <input
              type="text"
              value={nameReadOnly ? effectiveName : (autoName ? generatedName : name)}
              onChange={(e) => setName(e.target.value)}
              disabled={nameReadOnly || autoName}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>

          {/* Code */}
          <div>
            <label className="text-sm font-medium">{t('routeCode')}</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="L1, A2..."
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium">{t('routeType')}</label>
            <select
              value={routeType}
              onChange={(e) => setRouteType(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="linear">Liniowa</option>
              <option value="loop">Pętla</option>
            </select>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium">{t('comment')}</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('commentPlaceholder')}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Divider */}
          <hr />

          {/* Stop search */}
          <StopSelector
            companyId={companyId}
            addedStopIds={addedStopIds}
            onSelect={handleAddStop}
            onQuickCreate={() => {
              setQuickCreateCoords(null);
              setQuickCreateOpen(true);
            }}
            searchPlaceholder={t('searchStops')}
            quickCreateLabel={t('quickCreateStop')}
          />

          {/* Divider */}
          <hr />

          {/* Stops list with drag-and-drop */}
          <div>
            <label className="text-sm font-medium">{t('addedStops')}</label>
            <p className="text-xs text-muted-foreground mb-2">
              {t('clickMapToAdd')}
              {' · '}
              {t('clickExistingStopToAdd')}
            </p>
            {stops.length >= 2 && (
              <p className="text-xs text-muted-foreground mb-2">
                {t('waypointHint')}
              </p>
            )}
            <DraggableStopList
              stops={stops}
              onReorder={handleReorder}
              onToggleMain={handleToggleMain}
              onRemove={handleRemove}
              emptyMessage={t('noStops')}
              mainStopLabel={t('mainStop')}
              removeStopLabel={t('removeStop')}
            />
          </div>
        </div>

        {/* Right panel: map */}
        <div className="flex-1">
          <MapSection
            stops={stops}
            positions={mapPositions}
            onClick={handleMapClick}
            companyId={companyId}
            addedStopIds={addedStopIds}
            onExistingStopClick={handleAddStop}
            routeGeometry={routeGeometry}
            waypoints={waypoints}
            onWaypointAdd={handleWaypointAdd}
            onWaypointMove={handleWaypointMove}
            onWaypointRemove={handleWaypointRemove}
            geometryLoading={geometryLoading}
          />
        </div>
      </div>

      {/* Quick create stop dialog */}
      {quickCreateOpen && (
        <QuickCreateStopDialog
          companyId={companyId}
          initialLat={quickCreateCoords?.lat}
          initialLng={quickCreateCoords?.lng}
          onCreated={handleQuickCreateDone}
          onClose={() => {
            setQuickCreateOpen(false);
            setQuickCreateCoords(null);
          }}
          labels={{
            title: t('quickCreateStop'),
            stopName: t('stopName'),
            stopCity: t('stopCity'),
            latitude: 'Lat',
            longitude: 'Lng',
            save: t('save'),
            saving: t('saving'),
            error: tCommon('status.error'),
          }}
        />
      )}
    </div>
  );
}
