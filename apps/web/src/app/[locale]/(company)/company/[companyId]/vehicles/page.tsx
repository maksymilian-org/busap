'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Truck, Plus, Users, X, Edit, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: string;
  registrationNumber: string;
  brand: string | null;
  model: string | null;
  capacity: number;
  status: string;
  photoUrl: string | null;
}

export default function CompanyVehiclesPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const { isManagerOf } = useAuth();
  const t = useTranslations('company');
  const tCommon = useTranslations('common');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await api.get(`/vehicles?companyId=${companyId}`);
      setVehicles(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const handleDelete = async (vehicleId: string) => {
    if (!confirm(t('vehicles.confirmDelete'))) return;
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      toast({ variant: 'success', title: t('vehicles.deleted') });
      fetchVehicles();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  useEffect(() => {
    if (!isManagerOf(companyId)) {
      router.push('/company');
      return;
    }
    fetchVehicles();
  }, [companyId, isManagerOf, router, fetchVehicles]);

  if (!isManagerOf(companyId)) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'out_of_service':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('vehicles.title')}</h1>
          <p className="text-muted-foreground">{t('vehicles.description')}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('vehicles.addVehicle')}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t('vehicles.noVehicles')}</p>
          <Button className="mt-4" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('vehicles.addVehicle')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {vehicle.photoUrl ? (
                    <img
                      src={vehicle.photoUrl}
                      alt={vehicle.registrationNumber}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <Link href={`/company/${companyId}/vehicles/${vehicle.id}`} className="font-semibold hover:text-primary hover:underline">
                      {vehicle.registrationNumber}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.brand} {vehicle.model}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    getStatusColor(vehicle.status)
                  )}
                >
                  {tCommon(`status.${vehicle.status}`)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {t('vehicles.capacity')}: {vehicle.capacity}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingVehicle(vehicle)}
                    title={tCommon('actions.edit')}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(vehicle.id)}
                    title={tCommon('actions.delete')}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAddModal || editingVehicle) && (
        <VehicleFormModal
          companyId={companyId}
          vehicle={editingVehicle || undefined}
          t={t}
          tCommon={tCommon}
          onClose={() => {
            setShowAddModal(false);
            setEditingVehicle(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setEditingVehicle(null);
            fetchVehicles();
          }}
        />
      )}
    </div>
  );
}

function VehicleFormModal({
  companyId,
  vehicle,
  t,
  tCommon,
  onClose,
  onSaved,
}: {
  companyId: string;
  vehicle?: Vehicle;
  t: any;
  tCommon: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    registrationNumber: vehicle?.registrationNumber || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    capacity: vehicle?.capacity || 50,
    photoUrl: vehicle?.photoUrl || '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!vehicle;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await api.uploadFile('/storage/upload/vehicle-photo', file);
      setForm({ ...form, photoUrl: url });
      toast({ variant: 'success', title: t('vehicles.editModal.uploadSuccess') });
    } catch (err: any) {
      setError(err.message || t('vehicles.editModal.uploadError'));
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEdit) {
        await api.put(`/vehicles/${vehicle.id}`, {
          ...form,
          companyId,
        });
        toast({ variant: 'success', title: t('vehicles.editModal.success') });
      } else {
        await api.post('/vehicles', {
          ...form,
          companyId,
          status: 'active',
        });
        toast({ variant: 'success', title: t('vehicles.createModal.success') });
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
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? t('vehicles.editModal.title') : t('vehicles.createModal.title')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('vehicles.createModal.registration')}</label>
            <input
              type="text"
              required
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ABC 12345"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('vehicles.createModal.brand')}</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Mercedes"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('vehicles.createModal.model')}</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Sprinter"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">{t('vehicles.createModal.capacity')}</label>
            <input
              type="number"
              required
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('vehicles.createModal.photo')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <div className="mt-1 flex items-center gap-3">
              {form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt="Vehicle"
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted">
                  <Truck className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                {uploading ? t('vehicles.createModal.uploading') : t('vehicles.createModal.selectPhoto')}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? (isEdit ? t('vehicles.editModal.submitting') : t('vehicles.createModal.submitting'))
                : (isEdit ? t('vehicles.editModal.submit') : t('vehicles.createModal.submit'))
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
