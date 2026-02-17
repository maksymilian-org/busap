'use client';

import {
  MapContainer,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for webpack/next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapInnerProps {
  center: [number, number];
  zoom: number;
  children?: React.ReactNode;
  onClick?: (lat: number, lng: number) => void;
}

/**
 * Flag to suppress the next map click (set by GeoJsonRouteLayer click handler).
 * This prevents the map click from firing when user clicks on the route line.
 */
let suppressNextMapClick = false;

export function suppressMapClick() {
  suppressNextMapClick = true;
  // Auto-reset after a delay in case the map click never fires
  setTimeout(() => { suppressNextMapClick = false; }, 300);
}

function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (suppressNextMapClick) {
        suppressNextMapClick = false;
        return;
      }
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapInner({ center, zoom, children, onClick }: MapInnerProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-lg z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onClick} />
      {children}
    </MapContainer>
  );
}
