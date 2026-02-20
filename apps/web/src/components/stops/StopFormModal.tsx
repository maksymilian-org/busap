'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { BusapMap, StopMarker } from '@/components/map';

interface StopData {
  id: string;
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  county?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  formattedAddress?: string;
  isActive: boolean;
}

interface StopFormModalProps {
  stop?: StopData;
  companyId?: string;
  initialCoords?: { lat: number; lng: number } | null;
  onClose: () => void;
  onSaved: () => void;
  t: any;
  tCommon: any;
}

export function StopFormModal({
  stop,
  companyId,
  initialCoords,
  onClose,
  onSaved,
  t,
  tCommon,
}: StopFormModalProps) {
  const [form, setForm] = useState({
    name: stop?.name || '',
    code: stop?.code || '',
    latitude: stop?.latitude || initialCoords?.lat || 52.2297,
    longitude: stop?.longitude || initialCoords?.lng || 21.0122,
    address: stop?.address || '',
    city: stop?.city || '',
    country: stop?.country || 'PL',
    county: stop?.county || '',
    region: stop?.region || '',
    postalCode: stop?.postalCode || '',
    countryCode: stop?.countryCode || '',
    formattedAddress: stop?.formattedAddress || '',
    isActive: stop?.isActive ?? true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const isEdit = !!stop;

  const handleGeocode = useCallback(
    async (lat?: number, lng?: number) => {
      const targetLat = lat ?? form.latitude;
      const targetLng = lng ?? form.longitude;
      if (!targetLat || !targetLng) return;

      setGeocoding(true);
      try {
        const result = await api.fetch<any>(
          `/stops/geocode/reverse?latitude=${targetLat}&longitude=${targetLng}`
        );
        if (result) {
          setForm((prev) => ({
            ...prev,
            city: prev.city || result.city || '',
            country: prev.country || result.country || '',
            county: result.county || '',
            region: result.region || '',
            postalCode: result.postalCode || '',
            countryCode: result.countryCode || '',
            address: prev.address || result.address || '',
            formattedAddress: result.formattedAddress || '',
          }));
        }
      } catch {
        // Geocoding failure is not critical
      } finally {
        setGeocoding(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.latitude, form.longitude]
  );

  // Auto-geocode when opened with initialCoords (map click)
  useEffect(() => {
    if (initialCoords && !isEdit) {
      handleGeocode(initialCoords.lat, initialCoords.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    handleGeocode(lat, lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const body = { ...form, ...(companyId ? { companyId } : {}) };
      if (isEdit) {
        await api.put(`/stops/${stop.id}`, body);
        toast({ variant: 'success', title: t('editModal.success') });
      } else {
        await api.post('/stops', body);
        toast({ variant: 'success', title: t('createModal.success') });
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? t('editModal.title') : t('createModal.title')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('createModal.name')}</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('createModal.code')}</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('createModal.city')}</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('createModal.latitude')}</label>
              <input
                type="number"
                step="any"
                required
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('createModal.longitude')}</label>
              <input
                type="number"
                step="any"
                required
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Geocode button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={geocoding}
            onClick={() => handleGeocode()}
            className="w-full"
          >
            {geocoding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('createModal.geocoding')}
              </>
            ) : (
              <>{t('createModal.geocodeButton')}</>
            )}
          </Button>

          {form.formattedAddress && (
            <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-lg">
              {form.formattedAddress}
            </p>
          )}

          <div>
            <label className="text-sm font-medium">{t('createModal.address')}</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('createModal.county')}</label>
              <input
                type="text"
                value={form.county}
                onChange={(e) => setForm({ ...form, county: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('createModal.region')}</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('createModal.postalCode')}</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('createModal.countryCode')}</label>
              <input
                type="text"
                value={form.countryCode}
                onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                maxLength={2}
                placeholder="PL"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Mini map */}
          <div>
            <p className="text-sm font-medium mb-1">{t('createModal.mapTitle')}</p>
            <p className="text-xs text-muted-foreground mb-2">{t('createModal.mapHint')}</p>
            <BusapMap
              className="h-[200px] rounded-lg"
              center={[form.latitude || 52.2297, form.longitude || 21.0122]}
              zoom={form.latitude ? 14 : 6}
              onClick={handleMapClick}
            >
              {form.latitude && form.longitude && (
                <StopMarker
                  position={[form.latitude, form.longitude]}
                  name={form.name || '?'}
                  isActive={form.isActive}
                />
              )}
            </BusapMap>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? isEdit
                  ? t('editModal.submitting')
                  : t('createModal.submitting')
                : isEdit
                ? t('editModal.submit')
                : t('createModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
