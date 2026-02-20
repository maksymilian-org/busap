'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusapMap, PublicStopsLayer } from '@/components/map';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
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

export default function PassengerMapPage() {
  const t = useTranslations('dashboard.map');
  const { user } = useAuth();

  const [selectedStop, setSelectedStop] = useState<StopData | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleStopClick = async (stop: StopData) => {
    setSelectedStop(stop);
    if (user) {
      try {
        const favStops = await api.fetch<any[]>('/favorites/stops');
        setIsFavorite(favStops.some((f: any) => (f.stop?.id || f.id) === stop.id));
      } catch {
        setIsFavorite(false);
      }
    }
  };

  const toggleFavorite = async () => {
    if (!user || !selectedStop) return;
    try {
      if (isFavorite) {
        await api.fetch(`/favorites/stops/${selectedStop.id}`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        await api.fetch(`/favorites/stops/${selectedStop.id}`, { method: 'POST' });
        setIsFavorite(true);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  return (
    <div className="relative -m-4 lg:-m-6 h-[calc(100vh-4rem)]">
      <BusapMap center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full">
        <PublicStopsLayer onStopClick={handleStopClick} />
      </BusapMap>

      {/* Zoom hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-card/90 px-4 py-2 text-sm shadow-lg backdrop-blur-sm pointer-events-none">
        {t('zoomToLoad')}
      </div>

      {/* Selected stop mini-modal */}
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
            <Link href={`/passenger/stops/${selectedStop.id}`} className="flex-1">
              <Button size="sm" className="w-full">
                {t('viewDetails')}
              </Button>
            </Link>
            {user && (
              <Button variant="outline" size="sm" onClick={toggleFavorite}>
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
