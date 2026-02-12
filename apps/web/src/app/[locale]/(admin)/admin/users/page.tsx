'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  systemRole: string;
  isActive: boolean;
  createdAt: string;
  companyUsers?: Array<{
    id: string;
    role: string;
    company: { id: string; name: string; slug: string };
  }>;
}

interface UsersResponse {
  data: UserData[];
  total: number;
  limit: number;
  offset: number;
}

const roleBadgeStyles: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  passenger: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const limit = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));

      const data = await api.fetch<UsersResponse>(`/admin/users?${params}`);
      setUsers(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (userId: string) => {
    if (!confirm(t('confirmDeactivate'))) return;
    try {
      await api.fetch(`/admin/users/${userId}`, { method: 'DELETE' });
      toast({ variant: 'success', title: t('deactivated') });
      loadUsers();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('general.title'), description: err.message });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle', { count: total })}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addUser')}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{t('table.user')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.email')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.systemRole')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.companyRoles')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.status')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.registrationDate')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {t('loading')}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {t('noUsers')}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {u.firstName} {u.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            roleBadgeStyles[u.systemRole] || roleBadgeStyles.passenger
                          )}
                        >
                          {t(`roles.${u.systemRole}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.companyUsers?.map((cu) => (
                            <span
                              key={cu.id}
                              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
                              title={cu.company.name}
                            >
                              {t(`roles.${cu.role}`)} @ {cu.company.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <UserCheck className="h-3.5 w-3.5" />
                            {t('status.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <UserX className="h-3.5 w-3.5" />
                            {t('status.inactive')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Admin cannot edit superadmin users */}
                          {(u.systemRole !== 'superadmin' || currentUser?.systemRole === 'superadmin') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingUser(u)}
                              title={tCommon('actions.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {u.systemRole !== 'superadmin' && u.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(u.id)}
                              title={tCommon('actions.delete')}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {tCommon('pagination.showing', {
                  from: page * limit + 1,
                  to: Math.min((page + 1) * limit, total),
                  total,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  {tCommon('pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  {tCommon('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          t={t}
          tCommon={tCommon}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          t={t}
          tCommon={tCommon}
          user={editingUser}
          isSuperadmin={currentUser?.systemRole === 'superadmin'}
          onClose={() => setEditingUser(null)}
          onUpdated={() => {
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

function CreateUserModal({
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
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    systemRole: 'passenger',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.fetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast({ variant: 'success', title: t('createModal.success') });
      onCreated();
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: tCommon('general.title'), description: err.message });
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('createModal.firstName')}</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('createModal.lastName')}</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

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
            <label className="text-sm font-medium">{t('createModal.password')}</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.phone')}</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.systemRole')}</label>
            <select
              value={form.systemRole}
              onChange={(e) => setForm({ ...form, systemRole: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="passenger">{t('roles.passenger')}</option>
              <option value="admin">{t('roles.admin')}</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

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

function EditUserModal({
  t,
  tCommon,
  user,
  isSuperadmin,
  onClose,
  onUpdated,
}: {
  t: any;
  tCommon: any;
  user: UserData;
  isSuperadmin: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    systemRole: user.systemRole,
    isActive: user.isActive,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.fetch(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      toast({ variant: 'success', title: t('editModal.success') });
      onUpdated();
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: tCommon('general.title'), description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const canEditRole = user.systemRole !== 'superadmin' || isSuperadmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('editModal.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('createModal.firstName')}</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('createModal.lastName')}</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.email')}</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 w-full rounded-lg border bg-muted px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.phone')}</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {canEditRole && (
            <div>
              <label className="text-sm font-medium">{t('createModal.systemRole')}</label>
              <select
                value={form.systemRole}
                onChange={(e) => setForm({ ...form, systemRole: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="passenger">{t('roles.passenger')}</option>
                <option value="admin">{t('roles.admin')}</option>
                {isSuperadmin && <option value="superadmin">{t('roles.superadmin')}</option>}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              disabled={user.systemRole === 'superadmin' && !isSuperadmin}
              className="rounded border"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              {t('editModal.accountActive')}
            </label>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('editModal.submitting') : t('editModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
