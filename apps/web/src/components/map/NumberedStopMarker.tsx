'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface NumberedStopMarkerProps {
  position: [number, number];
  number: number;
  name: string;
  code?: string;
  city?: string;
  isMain?: boolean;
}

function createNumberedIcon(num: number, isMain: boolean) {
  const borderColor = isMain ? '#f59e0b' : '#ffffff';
  const borderWidth = isMain ? 4 : 3;

  return new L.DivIcon({
    className: 'custom-numbered-marker',
    html: `<div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #3b82f6;
      border: ${borderWidth}px solid ${borderColor};
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
    ">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export default function NumberedStopMarker({
  position,
  number: num,
  name,
  code,
  city,
  isMain = false,
}: NumberedStopMarkerProps) {
  const icon = createNumberedIcon(num, isMain);

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="text-sm">
          <p className="font-semibold">{name}</p>
          {code && <p className="text-xs text-gray-500">Kod: {code}</p>}
          {city && <p className="text-xs text-gray-500">{city}</p>}
          <p className="text-xs mt-1">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
