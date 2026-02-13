'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface QuickCreateStopDialogProps {
  companyId: string;
  initialLat?: number;
  initialLng?: number;
  onCreated: (stop: { id: string; name: string; city?: string; code?: string; latitude: number; longitude: number }) => void;
  onClose: () => void;
  labels: {
    title: string;
    stopName: string;
    stopCity: string;
    latitude: string;
    longitude: string;
    save: string;
    saving: string;
    error: string;
  };
}

export default function QuickCreateStopDialog({
  companyId,
  initialLat,
  initialLng,
  onCreated,
  onClose,
  labels,
}: QuickCreateStopDialogProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState(initialLat?.toFixed(6) || '');
  const [lng, setLng] = useState(initialLng?.toFixed(6) || '');
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Auto-geocode when opened with coordinates
  useEffect(() => {
    if (initialLat && initialLng) {
      setGeocoding(true);
      api.fetch<any>(`/stops/geocode/reverse?latitude=${initialLat}&longitude=${initialLng}`)
        .then((result) => {
          if (result) {
            if (!name && result.city) {
              const addrPart = result.address ? `, ${result.address}` : '';
              setName(`${result.city}${addrPart}`);
            }
            if (!city && result.city) {
              setCity(result.city);
            }
          }
        })
        .catch(() => {})
        .finally(() => setGeocoding(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const stop = await api.post('/stops', {
        name,
        city: city || undefined,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        companyId,
      });
      onCreated(stop);
    } catch (err: any) {
      toast({ variant: 'destructive', title: labels.error, description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{labels.title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {geocoding && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Geocoding...</span>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">{labels.stopName}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium">{labels.stopCity}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">{labels.latitude}</label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{labels.longitude}</label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? labels.saving : labels.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
