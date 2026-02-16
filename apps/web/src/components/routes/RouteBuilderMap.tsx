'use client';

import { BusapMap, RoutePolyline, NumberedStopMarker, FitBounds, ExistingStopsLayer } from '@/components/map';
import type { BuilderStop } from './DraggableStopList';

interface RouteBuilderMapProps {
  stops: BuilderStop[];
  positions: [number, number][];
  onClick: (lat: number, lng: number) => void;
  companyId: string;
  addedStopIds: Set<string>;
  onExistingStopClick: (stop: { id: string; name: string; code?: string; city?: string; latitude: number; longitude: number }) => void;
}

export default function RouteBuilderMap({ stops, positions, onClick, companyId, addedStopIds, onExistingStopClick }: RouteBuilderMapProps) {
  return (
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
      {positions.length >= 2 && (
        <RoutePolyline positions={positions} color="#3b82f6" weight={3} />
      )}
      {positions.length > 0 && (
        <FitBounds positions={positions} />
      )}
    </BusapMap>
  );
}
