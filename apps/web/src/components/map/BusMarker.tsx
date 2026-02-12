'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface BusMarkerProps {
  position: [number, number];
  heading?: number;
  speed?: number;
  vehicleId?: string;
  registrationNumber?: string;
  routeName?: string;
  tripId?: string;
}

const createBusIcon = (heading: number = 0) =>
  new L.DivIcon({
    className: 'custom-bus-marker',
    html: `<div style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ef4444;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(${heading}deg);
      position: relative;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"></path>
        <path d="M15 6v6"></path>
        <path d="M2 12h19.6"></path>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
        <circle cx="7" cy="18" r="2"></circle>
        <path d="M9 18h5"></path>
        <circle cx="16" cy="18" r="2"></circle>
      </svg>
      <div style="
        position: absolute;
        top: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 8px solid #ef4444;
      "></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

export default function BusMarker({
  position,
  heading = 0,
  speed,
  vehicleId,
  registrationNumber,
  routeName,
  tripId,
}: BusMarkerProps) {
  return (
    <Marker position={position} icon={createBusIcon(heading)}>
      <Popup>
        <div className="text-sm">
          {registrationNumber && (
            <p className="font-semibold">{registrationNumber}</p>
          )}
          {routeName && (
            <p className="text-xs text-gray-500">Trasa: {routeName}</p>
          )}
          {speed !== undefined && (
            <p className="text-xs text-gray-500">
              Predkosc: {speed.toFixed(0)} km/h
            </p>
          )}
          <p className="text-xs mt-1">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
