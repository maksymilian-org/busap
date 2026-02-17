'use client';

import { BusapMap, RoutePolyline, NumberedStopMarker, FitBounds, ExistingStopsLayer, GeoJsonRouteLayer, WaypointMarker } from '@/components/map';
import type { BuilderStop } from './DraggableStopList';
import type { GeoJsonLineString } from '@busap/shared';
import { Loader2 } from 'lucide-react';

interface RouteBuilderMapProps {
  stops: BuilderStop[];
  positions: [number, number][];
  onClick: (lat: number, lng: number) => void;
  companyId: string;
  addedStopIds: Set<string>;
  onExistingStopClick: (stop: { id: string; name: string; code?: string; city?: string; latitude: number; longitude: number }) => void;
  routeGeometry?: GeoJsonLineString | null;
  waypoints?: Record<string, [number, number][]>;
  onWaypointAdd?: (segIdx: number, lat: number, lng: number) => void;
  onWaypointMove?: (segIdx: number, wpIdx: number, lat: number, lng: number) => void;
  onWaypointRemove?: (segIdx: number, wpIdx: number) => void;
  geometryLoading?: boolean;
}

export default function RouteBuilderMap({
  stops,
  positions,
  onClick,
  companyId,
  addedStopIds,
  onExistingStopClick,
  routeGeometry,
  waypoints,
  onWaypointAdd,
  onWaypointMove,
  onWaypointRemove,
  geometryLoading,
}: RouteBuilderMapProps) {
  return (
    <div className="relative h-full w-full">
      <BusapMap className="h-full w-full" onClick={onClick}>
        <ExistingStopsLayer
          companyId={companyId}
          addedStopIds={addedStopIds}
          onStopClick={onExistingStopClick}
        />
        {stops.map((stop, index) => (
          <NumberedStopMarker
            key={stop.id}
            position={[stop.latitude, stop.longitude]}
            number={index + 1}
            name={stop.name}
            code={stop.code}
            city={stop.city}
            isMain={stop.isMain}
          />
        ))}
        {routeGeometry ? (
          <GeoJsonRouteLayer
            geometry={routeGeometry}
            color="#3b82f6"
            weight={4}
            stopPositions={positions}
            onDragCreate={onWaypointAdd}
            waypoints={waypoints}
          />
        ) : (
          positions.length >= 2 && (
            <RoutePolyline positions={positions} color="#3b82f6" weight={3} />
          )
        )}
        {/* Existing waypoint markers — draggable, double-click to remove */}
        {waypoints &&
          Object.entries(waypoints).map(([segIdx, wps]) =>
            wps.map((wp, wpIdx) => (
              <WaypointMarker
                key={`wp-${segIdx}-${wpIdx}`}
                position={wp}
                onMove={(lat, lng) => onWaypointMove?.(Number(segIdx), wpIdx, lat, lng)}
                onRemove={() => onWaypointRemove?.(Number(segIdx), wpIdx)}
              />
            )),
          )}
        {positions.length > 0 && (
          <FitBounds positions={positions} />
        )}
      </BusapMap>
      {geometryLoading && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm border">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Routing...</span>
        </div>
      )}
    </div>
  );
}
