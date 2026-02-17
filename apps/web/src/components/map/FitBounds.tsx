'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

interface FitBoundsProps {
  positions: [number, number][];
  padding?: [number, number];
}

export default function FitBounds({ positions, padding = [50, 50] }: FitBoundsProps) {
  const map = useMap();
  const prevCountRef = useRef(positions.length);
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (positions.length === 0) return;

    // Only fit bounds on initial render or when the number of stops changes
    const countChanged = positions.length !== prevCountRef.current;
    prevCountRef.current = positions.length;

    if (!countChanged && initialFitDone.current) return;
    initialFitDone.current = true;

    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }

    const bounds: LatLngBoundsExpression = positions.map(([lat, lng]) => [lat, lng] as [number, number]);
    map.fitBounds(bounds, { padding });
  }, [map, positions, padding]);

  return null;
}
