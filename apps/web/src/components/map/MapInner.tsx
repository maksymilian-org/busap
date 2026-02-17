'use client';

import {
  MapContainer,
  TileLayer,
  LayersControl,
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

const LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
} as const;

const STORAGE_KEY = 'busap-map-layer';

function getDefaultLayer(): 'street' | 'satellite' {
  if (typeof window === 'undefined') return 'street';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'satellite' ? 'satellite' : 'street';
}

interface MapInnerProps {
  center: [number, number];
  zoom: number;
  children?: React.ReactNode;
  onClick?: (lat: number, lng: number) => void;
}

let suppressNextMapClick = false;

export function suppressMapClick() {
  suppressNextMapClick = true;
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

function LayerPersist() {
  useMapEvents({
    baselayerchange: (e) => {
      const name = e.name === 'Satelita' ? 'satellite' : 'street';
      localStorage.setItem(STORAGE_KEY, name);
    },
  });
  return null;
}

export default function MapInner({ center, zoom, children, onClick }: MapInnerProps) {
  const defaultLayer = getDefaultLayer();

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-lg z-0"
      scrollWheelZoom={true}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Mapa" checked={defaultLayer === 'street'}>
          <TileLayer
            attribution={LAYERS.street.attribution}
            url={LAYERS.street.url}
            maxZoom={LAYERS.street.maxZoom}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satelita" checked={defaultLayer === 'satellite'}>
          <TileLayer
            attribution={LAYERS.satellite.attribution}
            url={LAYERS.satellite.url}
            maxZoom={LAYERS.satellite.maxZoom}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <LayerPersist />
      <ClickHandler onClick={onClick} />
      {children}
    </MapContainer>
  );
}
