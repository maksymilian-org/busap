'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Trash2, RefreshCw, X } from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  companyRole?: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy?: { firstName: string; lastName: string };
  company?: { name: string };
}

interface InvitationsResponse {
  data: InvitationData[];
  total: number;
}

export default function AdminInvitationsPage() {
  const t = useTranslations('admin.invitations');
  const tCommon = useTranslations('common');
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const data = await api.fetch<InvitationsResponse>(`/admin/invitations?${params}`);
      setInvitations(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.fetch(`/admin/invitations/${id}`, { method: 'DELETE' });
      toast({ variant: 'success', title: t('deleted') });
      loadInvitations();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleResend = async (id: string) => {
    try {
      await api.fetch(`/admin/invitations/${id}/resend`, { method: 'POST' });
      toast({ variant: 'success', title: t('resent') });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle', { count: total })}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('sendInvitation')}
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
                  <th className="px-4 py-3 text-left font-medium">{t('table.email')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.role')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.invitedBy')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.expiresAt')}</th>
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
                ) : invitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {t('noInvitations')}
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{inv.email}</td>
                      <td className="px-4 py-3">{inv.role}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.invitedBy ? `${inv.invitedBy.firstName} ${inv.invitedBy.lastName}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(inv.expiresAt).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          inv.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t(`status.${inv.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'pending' && (
                            <Button variant="ghost" size="icon" onClick={() => handleResend(inv.id)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(inv.id)}
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

      {showCreateModal && (
        <CreateInvitationModal
          t={t}
          tCommon={tCommon}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadInvitations();
          }}
        />
      )}
    </div>
  );
}

function CreateInvitationModal({
  t,
  tCommon,
  onClose,
  onCreated,
}: {
  t: any;
  tCommon: any;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ email: '', role: 'passenger' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.fetch('/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast({ variant: 'success', title: t('createModal.success') });
      onCreated();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('createModal.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('createModal.email')}</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('createModal.role')}</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="passenger">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('createModal.submitting') : t('createModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
