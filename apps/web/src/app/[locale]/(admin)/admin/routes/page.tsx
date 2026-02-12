'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Route, Search, Plus, Edit, Trash2, X } from 'lucide-react';

interface RouteData {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type: string;
  isActive: boolean;
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
}

interface CompanyOption {
  id: string;
  name: string;
}

export default function AdminRoutesPage() {
  const t = useTranslations('admin.routes');
  const tCommon = useTranslations('common');
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetch<any>('/routes?include=company');
      setRoutes(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleDelete = async (routeId: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.fetch(`/routes/${routeId}`, { method: 'DELETE' });
      toast({ variant: 'success', title: t('deleted') });
      loadRoutes();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const filtered = routes.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.code && r.code.toLowerCase().includes(search.toLowerCase())) ||
      (r.company?.name && r.company.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle', { count: routes.length })}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addRoute')}
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
                  <th className="px-4 py-3 text-left font-medium">{t('table.name')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.code')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.company')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.type')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.status')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {tCommon('actions.loading')}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {t('noRoutes')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((route) => (
                    <tr key={route.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-primary" />
                          <span className="font-medium">{route.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{route.code || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {route.company?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {route.type === 'linear' ? t('type.linear') : t('type.loop')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            route.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {route.isActive ? t('status.active') : t('status.inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRoute(route)}
                            title={tCommon('actions.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(route.id)}
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

      {(showCreateModal || editingRoute) && (
        <RouteFormModal
          t={t}
          tCommon={tCommon}
          route={editingRoute || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRoute(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditingRoute(null);
            loadRoutes();
          }}
        />
      )}
    </div>
  );
}

function RouteFormModal({
  t,
  tCommon,
  route,
  onClose,
  onSaved,
}: {
  t: any;
  tCommon: any;
  route?: RouteData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [form, setForm] = useState({
    name: route?.name || '',
    code: route?.code || '',
    description: route?.description || '',
    type: route?.type || 'linear',
    companyId: route?.companyId || '',
    isActive: route?.isActive ?? true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!route;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEdit) {
        await api.fetch(`/routes/${route.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast({ variant: 'success', title: t('editModal.success') });
      } else {
        await api.fetch('/routes', {
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
            <label className="text-sm font-medium">{t('createModal.name')}</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.code')}</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="L1, A2..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.type')}</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="linear">{t('type.linear')}</option>
              <option value="loop">{t('type.loop')}</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="routeActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border"
              />
              <label htmlFor="routeActive" className="text-sm font-medium">
                {t('createModal.isActive')}
              </label>
            </div>
          )}

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
