'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, MapPin, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusapMap, PublicStopsLayer } from '@/components/map';
import { StopFormModal } from '@/components/stops/StopFormModal';
import { Link } from '@/i18n/navigation';

interface StopData {
  id: string;
  name: string;
  code?: string;
  city?: string;
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER: [number, number] = [52.0, 19.5];
const DEFAULT_ZOOM = 7;

export default function AdminMapPage() {
  const t = useTranslations('admin.map');
  const tStops = useTranslations('admin.stops');
  const tCommon = useTranslations('common');

  const [selectedStop, setSelectedStop] = useState<StopData | null>(null);
  const [editingStop, setEditingStop] = useState<StopData | null>(null);
  const [initialCoords, setInitialCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStopClick = (stop: StopData) => {
    setSelectedStop(stop);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedStop(null);
    setInitialCoords({ lat, lng });
    setEditingStop(null);
  };

  const handleSaved = () => {
    setEditingStop(null);
    setInitialCoords(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="relative -m-4 lg:-m-6 h-[calc(100vh-4rem)]">
      <BusapMap
        key={refreshKey}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        onClick={handleMapClick}
      >
        <PublicStopsLayer onStopClick={handleStopClick} />
      </BusapMap>

      {/* Zoom hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-card/90 px-4 py-2 text-sm shadow-lg backdrop-blur-sm pointer-events-none">
        {t('zoomToLoad')}
      </div>

      {/* Selected stop panel */}
      {selectedStop && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[340px] max-w-[calc(100vw-2rem)] rounded-xl bg-card shadow-xl border p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{selectedStop.name}</p>
                {selectedStop.city && (
                  <p className="text-sm text-muted-foreground">{selectedStop.city}</p>
                )}
                {selectedStop.code && (
                  <p className="text-xs text-muted-foreground">{selectedStop.code}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedStop(null)}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Link href={`/admin/stops/${selectedStop.id}`} className="flex-1">
              <Button size="sm" className="w-full" variant="outline">
                {t('viewDetails')}
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => { setEditingStop(selectedStop); setSelectedStop(null); }}
            >
              <Edit className="h-4 w-4 mr-1" />
              {t('editStop')}
            </Button>
          </div>
        </div>
      )}

      {/* Stop form modal */}
      {(editingStop || initialCoords) && (
        <StopFormModal
          stop={editingStop || undefined}
          initialCoords={initialCoords}
          onClose={() => { setEditingStop(null); setInitialCoords(null); }}
          onSaved={handleSaved}
          t={tStops}
          tCommon={tCommon}
        />
      )}
    </div>
  );
}
