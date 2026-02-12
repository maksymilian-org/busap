'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Users, Mail, User, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  role: string;
  isActive: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface UserOption {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export default function CompanyMembersPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const { isManagerOf, isOwnerOf } = useAuth();
  const t = useTranslations('company');
  const tCommon = useTranslations('common');

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const isOwner = isOwnerOf(companyId);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await api.get(`/companies/${companyId}/members`);
      setMembers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!isManagerOf(companyId)) {
      router.push('/company');
      return;
    }
    fetchMembers();
  }, [companyId, isManagerOf, router, fetchMembers]);

  if (!isManagerOf(companyId)) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'driver':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('members.title')}</h1>
          <p className="text-muted-foreground">{t('members.description')}</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowInviteModal(true)}>
            <Mail className="mr-2 h-4 w-4" />
            {t('members.inviteMember')}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t('members.noMembers')}</p>
          {isOwner && (
            <Button className="mt-4" onClick={() => setShowInviteModal(true)}>
              <Mail className="mr-2 h-4 w-4" />
              {t('members.inviteMember')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {member.user.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={`${member.user.firstName} ${member.user.lastName}`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      getRoleColor(member.role)
                    )}
                  >
                    {t(`roles.${member.role}`)}
                  </span>
                  {!member.isActive && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {tCommon('status.inactive')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInviteModal && (
        <InviteMemberModal
          companyId={companyId}
          existingMemberIds={members.map((m) => m.user.id)}
          t={t}
          tCommon={tCommon}
          onClose={() => setShowInviteModal(false)}
          onSaved={() => {
            setShowInviteModal(false);
            fetchMembers();
          }}
        />
      )}
    </div>
  );
}

function InviteMemberModal({
  companyId,
  existingMemberIds,
  t,
  tCommon,
  onClose,
  onSaved,
}: {
  companyId: string;
  existingMemberIds: string[];
  t: any;
  tCommon: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [role, setRole] = useState('driver');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) {
        setUsers([]);
        return;
      }
      setSearching(true);
      try {
        const response = await api.get(`/users?query=${encodeURIComponent(search)}&limit=10`);
        const allUsers = Array.isArray(response) ? response : [];
        setUsers(allUsers.filter((u: UserOption) => !existingMemberIds.includes(u.id)));
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, existingMemberIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError('');
    setSubmitting(true);

    try {
      await api.post(`/companies/${companyId}/members`, {
        userId: selectedUser.id,
        role,
      });
      toast({ variant: 'success', title: t('members.inviteModal.success') });
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
          <h2 className="text-lg font-semibold">{t('members.inviteModal.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedUser ? (
            <div>
              <label className="text-sm font-medium">{t('members.inviteModal.searchUser')}</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('members.inviteModal.searchPlaceholder')}
                />
              </div>
              {searching && (
                <p className="mt-2 text-sm text-muted-foreground">{tCommon('actions.loading')}</p>
              )}
              {users.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {user.firstName} {user.lastName}{' '}
                        <span className="text-muted-foreground">({user.email})</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {search.length >= 2 && !searching && users.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('members.inviteModal.noUsersFound')}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">{t('members.inviteModal.selectedUser')}</label>
              <div className="mt-1 flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
                <span className="text-sm">
                  {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">{t('members.inviteModal.role')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="driver">{t('roles.driver')}</option>
              <option value="manager">{t('roles.manager')}</option>
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting || !selectedUser}>
              {submitting ? t('members.inviteModal.submitting') : t('members.inviteModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
