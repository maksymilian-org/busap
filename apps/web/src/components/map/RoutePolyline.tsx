'use client';

import { Polyline, Tooltip } from 'react-leaflet';

interface RoutePolylineProps {
  positions: [number, number][];
  color?: string;
  weight?: number;
  name?: string;
  dashArray?: string;
}

export default function RoutePolyline({
  positions,
  color = '#3b82f6',
  weight = 4,
  name,
  dashArray,
}: RoutePolylineProps) {
  if (positions.length < 2) return null;

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight,
        opacity: 0.8,
        dashArray,
      }}
    >
      {name && <Tooltip sticky>{name}</Tooltip>}
    </Polyline>
  );
}
