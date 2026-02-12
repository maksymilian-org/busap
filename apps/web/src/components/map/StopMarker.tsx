'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface StopMarkerProps {
  position: [number, number];
  name: string;
  code?: string;
  city?: string;
  isActive?: boolean;
}

const stopIcon = new L.DivIcon({
  className: 'custom-stop-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #3b82f6;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="width: 6px; height: 6px; border-radius: 50%; background: white;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

export default function StopMarker({
  position,
  name,
  code,
  city,
  isActive = true,
}: StopMarkerProps) {
  return (
    <Marker position={position} icon={stopIcon}>
      <Popup>
        <div className="text-sm">
          <p className="font-semibold">{name}</p>
          {code && <p className="text-xs text-gray-500">Kod: {code}</p>}
          {city && <p className="text-xs text-gray-500">{city}</p>}
          <p className="text-xs mt-1">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </p>
          {!isActive && (
            <p className="text-xs text-red-500 font-medium mt-1">Nieaktywny</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
