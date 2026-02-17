'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { suppressMapClick } from './MapInner';

interface WaypointMarkerProps {
  position: [number, number];
  onMove: (lat: number, lng: number) => void;
  onRemove: () => void;
}

const CLICK_THRESHOLD_PX = 4;

const waypointIcon = L.divIcon({
  className: 'waypoint-marker',
  html: `<div style="
    width: 14px;
    height: 14px;
    background: white;
    border: 3px solid #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function WaypointMarker({ position, onMove, onRemove }: WaypointMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  useEffect(() => {
    const marker = L.marker(position, { icon: waypointIcon, draggable: false });
    let cleanup: (() => void) | null = null;

    marker.on('mousedown', (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      suppressMapClick();
      map.dragging.disable();

      const startPoint = map.latLngToContainerPoint(e.latlng);
      let dragged = false;

      const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
        const currentPoint = map.latLngToContainerPoint(moveEvent.latlng);
        if (!dragged && startPoint.distanceTo(currentPoint) >= CLICK_THRESHOLD_PX) {
          dragged = true;
        }
        if (dragged) {
          marker.setLatLng(moveEvent.latlng);
        }
      };

      const onMouseUp = () => {
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        cleanup = null;
        suppressMapClick();
        map.dragging.enable();

        if (dragged) {
          const latlng = marker.getLatLng();
          onMoveRef.current(latlng.lat, latlng.lng);
        } else {
          // Click without drag — remove waypoint
          onRemoveRef.current();
        }
      };

      cleanup = () => {
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        map.dragging.enable();
      };

      map.on('mousemove', onMouseMove);
      map.on('mouseup', onMouseUp);
    });

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      cleanup?.();
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map, position]);

  return null;
}
