'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonLineString } from '@busap/shared';
import { suppressMapClick } from './MapInner';

const DRAG_THRESHOLD_PX = 4;
const DRAG_THRESHOLD_MS = 180;

const dragIcon = L.divIcon({
  className: 'route-drag-marker',
  html: `<div style="
    width: 14px;
    height: 14px;
    background: white;
    border: 3px solid #3b82f6;
    border-radius: 50%;
    cursor: grabbing;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface GeoJsonRouteLayerProps {
  geometry: GeoJsonLineString;
  color?: string;
  weight?: number;
  stopPositions?: [number, number][];
  onDragCreate?: (segIdx: number, lat: number, lng: number) => void;
  waypoints?: Record<string, [number, number][]>;
}

function findClosestSegment(
  lat: number,
  lng: number,
  positions: [number, number][],
): number {
  let minDist = Infinity;
  let bestSeg = 0;
  for (let i = 0; i < positions.length - 1; i++) {
    const [ax, ay] = positions[i];
    const [bx, by] = positions[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((lat - ax) * dx + (lng - ay) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    const dist = (lat - projX) ** 2 + (lng - projY) ** 2;
    if (dist < minDist) {
      minDist = dist;
      bestSeg = i;
    }
  }
  return bestSeg;
}

export default function GeoJsonRouteLayer({
  geometry,
  color = '#3b82f6',
  weight = 4,
  stopPositions,
  onDragCreate,
  waypoints,
}: GeoJsonRouteLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);
  const hitLayerRef = useRef<L.GeoJSON | null>(null);
  const callbackRef = useRef(onDragCreate);
  callbackRef.current = onDragCreate;
  const positionsRef = useRef(stopPositions);
  positionsRef.current = stopPositions;
  const waypointsRef = useRef(waypoints);
  waypointsRef.current = waypoints;

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (hitLayerRef.current) {
      map.removeLayer(hitLayerRef.current);
      hitLayerRef.current = null;
    }

    if (!geometry?.coordinates?.length) return;

    const geoJsonData: any = {
      type: 'Feature',
      properties: {},
      geometry,
    };

    // Visible route line (non-interactive)
    const visibleLayer = L.geoJSON(geoJsonData, {
      style: { color, weight, opacity: 0.8 },
      interactive: false,
    });
    visibleLayer.addTo(map);
    layerRef.current = visibleLayer;

    // Invisible wider hit area for drag interaction
    const hitLayer = L.geoJSON(geoJsonData, {
      style: { color: 'transparent', weight: weight + 14, opacity: 0 },
    });

    let tempMarker: L.Marker | null = null;
    let activeCleanup: (() => void) | null = null;

    function isNearWaypoint(latlng: L.LatLng): boolean {
      const wps = waypointsRef.current;
      if (!wps) return false;
      const clickPt = map.latLngToContainerPoint(latlng);
      for (const segs of Object.values(wps)) {
        for (const wp of segs) {
          const wpPt = map.latLngToContainerPoint(L.latLng(wp[0], wp[1]));
          if (wpPt.distanceTo(clickPt) < 20) return true;
        }
      }
      return false;
    }

    const onMouseDown = (e: L.LeafletMouseEvent) => {
      if (!callbackRef.current || !positionsRef.current) return;
      if (isNearWaypoint(e.latlng)) return;

      const startTime = Date.now();
      const startPoint = map.latLngToContainerPoint(e.latlng);
      let dragConfirmed = false;

      // Disable map panning immediately so the map doesn't move
      map.dragging.disable();

      const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
        const currentPoint = map.latLngToContainerPoint(moveEvent.latlng);
        const pixelDist = startPoint.distanceTo(currentPoint);

        if (!dragConfirmed && pixelDist >= DRAG_THRESHOLD_PX) {
          dragConfirmed = true;
          tempMarker = L.marker(moveEvent.latlng, { icon: dragIcon, interactive: false });
          tempMarker.addTo(map);
        }
        if (dragConfirmed && tempMarker) {
          tempMarker.setLatLng(moveEvent.latlng);
        }
      };

      const onMouseUp = (upEvent: L.LeafletMouseEvent) => {
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        activeCleanup = null;

        const elapsed = Date.now() - startTime;
        const endPoint = map.latLngToContainerPoint(upEvent.latlng);
        const pixelDist = startPoint.distanceTo(endPoint);
        const wasDrag = dragConfirmed || elapsed >= DRAG_THRESHOLD_MS || pixelDist >= DRAG_THRESHOLD_PX;

        map.dragging.enable();

        if (tempMarker) {
          map.removeLayer(tempMarker);
          tempMarker = null;
        }

        if (wasDrag) {
          // It was a drag — create waypoint, suppress the click
          suppressMapClick();
          const segIdx = findClosestSegment(
            upEvent.latlng.lat,
            upEvent.latlng.lng,
            positionsRef.current!,
          );
          callbackRef.current!(segIdx, upEvent.latlng.lat, upEvent.latlng.lng);
        }
        // Quick click — don't suppress, let map click fire for stop creation
      };

      activeCleanup = () => {
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        map.dragging.enable();
        if (tempMarker) {
          map.removeLayer(tempMarker);
          tempMarker = null;
        }
      };

      map.on('mousemove', onMouseMove);
      map.on('mouseup', onMouseUp);
    };

    hitLayer.on('mousedown', onMouseDown);
    hitLayer.addTo(map);
    hitLayerRef.current = hitLayer;

    return () => {
      activeCleanup?.();
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      if (hitLayerRef.current) {
        map.removeLayer(hitLayerRef.current);
        hitLayerRef.current = null;
      }
    };
  }, [map, geometry, color, weight]);

  return null;
}
