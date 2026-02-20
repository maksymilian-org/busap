'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '@/lib/api';

interface Stop {
  id: string;
  name: string;
  code?: string;
  city?: string;
  latitude: number;
  longitude: number;
}

interface PublicStopsLayerProps {
  onStopClick: (stop: Stop) => void;
}

const MIN_ZOOM = 10;
const DEBOUNCE_MS = 300;

const publicStopIcon = new L.DivIcon({
  className: 'public-stop-marker',
  html: `<div style="
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    border: 2px solid #ffffff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    cursor: pointer;
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
});

export default function PublicStopsLayer({ onStopClick }: PublicStopsLayerProps) {
  const [stops, setStops] = useState<Stop[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStops = useCallback(async (map: L.Map) => {
    const zoom = map.getZoom();
    if (zoom < MIN_ZOOM) {
      setStops([]);
      return;
    }

    const bounds = map.getBounds();
    const params = new URLSearchParams({
      minLat: String(bounds.getSouth()),
      maxLat: String(bounds.getNorth()),
      minLng: String(bounds.getWest()),
      maxLng: String(bounds.getEast()),
    });

    try {
      const data = await api.get<Stop[]>(`/stops/bbox?${params}`);
      setStops(Array.isArray(data) ? data : []);
    } catch {
      // Silently ignore fetch errors
    }
  }, []);

  const debouncedFetch = useCallback(
    (map: L.Map) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchStops(map), DEBOUNCE_MS);
    },
    [fetchStops],
  );

  const map = useMapEvents({
    moveend() { debouncedFetch(map); },
    zoomend() { debouncedFetch(map); },
  });

  useEffect(() => {
    fetchStops(map);
  }, [map, fetchStops]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <>
      {stops.map((stop) => (
        <Marker
          key={stop.id}
          position={[stop.latitude, stop.longitude]}
          icon={publicStopIcon}
          eventHandlers={{
            click: () => onStopClick(stop),
          }}
        >
          <Tooltip direction="top" offset={[0, -9]}>
            <span className="text-xs font-medium">{stop.name}</span>
            {stop.city && (
              <span className="text-xs text-gray-500 ml-1">({stop.city})</span>
            )}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
