'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Truck, Search, Edit, X, Upload, Plus, Trash2 } from 'lucide-react';

interface VehicleData {
  id: string;
  registrationNumber: string;
  brand?: string;
  model?: string;
  capacity: number;
  status: string;
  isActive: boolean;
  companyId: string;
  photoUrl?: string;
  company?: {
    id: string;
    name: string;
  };
}

interface CompanyOption {
  id: string;
  name: string;
}

export default function AdminVehiclesPage() {
  const t = useTranslations('admin.vehicles');
  const tCommon = useTranslations('common');
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleData | null>(null);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetch<any>('/vehicles?include=company');
      setVehicles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleDelete = async (vehicleId: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.fetch(`/vehicles/${vehicleId}`, { method: 'DELETE' });
      toast({ variant: 'success', title: t('deleted') });
      loadVehicles();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const filtered = vehicles.filter(
    (v) =>
      v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (v.brand && v.brand.toLowerCase().includes(search.toLowerCase())) ||
      (v.model && v.model.toLowerCase().includes(search.toLowerCase())) ||
      (v.company?.name && v.company.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle', { count: vehicles.length })}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addVehicle')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{t('table.photo')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.registration')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.brandModel')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.company')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.capacity')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.status')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {tCommon('actions.loading')}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {t('noVehicles')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        {v.photoUrl ? (
                          <img
                            src={v.photoUrl}
                            alt={v.registrationNumber}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{v.registrationNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {[v.brand, v.model].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {v.company?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t('seatsCount', { count: v.capacity })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            v.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : v.status === 'maintenance'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : v.status === 'out_of_service'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}
                        >
                          {t(`status.${v.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingVehicle(v)}
                            title={tCommon('actions.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(v.id)}
                            title={tCommon('actions.delete')}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {(showCreateModal || editingVehicle) && (
        <VehicleFormModal
          t={t}
          tCommon={tCommon}
          vehicle={editingVehicle || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingVehicle(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditingVehicle(null);
            loadVehicles();
          }}
        />
      )}
    </div>
  );
}

function VehicleFormModal({
  t,
  tCommon,
  vehicle,
  onClose,
  onSaved,
}: {
  t: any;
  tCommon: any;
  vehicle?: VehicleData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [form, setForm] = useState({
    registrationNumber: vehicle?.registrationNumber || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    capacity: vehicle?.capacity || 50,
    status: vehicle?.status || 'active',
    photoUrl: vehicle?.photoUrl || '',
    companyId: vehicle?.companyId || '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!vehicle;

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await api.fetch<any>('/companies?limit=100');
        setCompanies(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error('Failed to load companies:', err);
      }
    };
    loadCompanies();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await api.uploadFile('/storage/upload/vehicle-photo', file);
      setForm({ ...form, photoUrl: url });
      toast({ variant: 'success', title: t('editModal.uploadSuccess') });
    } catch (err: any) {
      setError(err.message || t('editModal.uploadError'));
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
        await api.fetch(`/vehicles/${vehicle.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast({ variant: 'success', title: t('editModal.success') });
      } else {
        await api.fetch('/vehicles', {
          method: 'POST',
          body: JSON.stringify(form),
        });
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
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
            <label className="text-sm font-medium">{t('editModal.photo')}</label>
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
                {uploading ? t('editModal.uploading') : t('editModal.selectPhoto')}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.company')}</label>
            <select
              required
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('createModal.selectCompany')}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">{t('table.registration')}</label>
            <input
              type="text"
              required
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ABC 12345"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">{t('table.brand')}</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Mercedes"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('table.model')}</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Sprinter"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">{t('table.capacity')}</label>
              <input
                type="number"
                min={1}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('table.status')}</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">{t('status.active')}</option>
                <option value="inactive">{t('status.inactive')}</option>
                <option value="maintenance">{t('status.maintenance')}</option>
                <option value="out_of_service">{t('status.out_of_service')}</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? isEdit ? t('editModal.submitting') : t('createModal.submitting')
                : isEdit ? t('editModal.submit') : t('createModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
