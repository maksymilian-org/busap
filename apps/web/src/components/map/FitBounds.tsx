'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

interface FitBoundsProps {
  positions: [number, number][];
  padding?: [number, number];
}

export default function FitBounds({ positions, padding = [50, 50] }: FitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;

    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }

    const bounds: LatLngBoundsExpression = positions.map(([lat, lng]) => [lat, lng] as [number, number]);
    map.fitBounds(bounds, { padding });
  }, [map, positions, padding]);

  return null;
}
