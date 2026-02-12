'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

export interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  onClick?: (lat: number, lng: number) => void;
}

export default function BusapMap({
  center = [52.2297, 21.0122], // Warsaw default
  zoom = 7,
  className = 'h-[500px]',
  children,
  onClick,
}: MapContainerProps) {
  return (
    <div className={className}>
      <MapInner center={center} zoom={zoom} onClick={onClick}>
        {children}
      </MapInner>
    </div>
  );
}
