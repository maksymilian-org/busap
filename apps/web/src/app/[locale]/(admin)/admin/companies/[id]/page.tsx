'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  X,
  Check,
  Crown,
  Briefcase,
  Car,
  Users,
  Upload,
  Truck,
  Route,
  Bus,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

interface MemberData {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    isActive: boolean;
  };
}

interface VehicleData {
  id: string;
  registrationNumber: string;
  brand?: string;
  model?: string;
  capacity: number;
  status: string;
  photoUrl?: string;
}

interface RouteData {
  id: string;
  name: string;
  code?: string;
  type: string;
  isActive: boolean;
}

interface TripData {
  id: string;
  status: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime?: string;
  route?: { id: string; name: string };
  vehicle?: { id: string; registrationNumber: string };
  driver?: { id: string; firstName: string; lastName: string };
}

interface StopData {
  id: string;
  name: string;
  code?: string;
  city?: string;
  isActive: boolean;
}

interface AvailableUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-4 w-4" />,
  manager: <Briefcase className="h-4 w-4" />,
  driver: <Car className="h-4 w-4" />,
  passenger: <User className="h-4 w-4" />,
};

const roleBadgeStyles: Record<string, string> = {
  owner: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  driver: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  passenger: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export default function CompanyDetailsPage() {
  const params = useParams();
  const companyId = params.id as string;
  const t = useTranslations('admin.companies');
  const tCommon = useTranslations('common');

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [stops, setStops] = useState<StopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberData | null>(null);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);

  const loadCompany = useCallback(async () => {
    try {
      const data = await api.fetch<CompanyData>(`/companies/${companyId}`);
      setCompany(data);
    } catch (err) {
      console.error('Failed to load company:', err);
    }
  }, [companyId]);

  const loadMembers = useCallback(async () => {
    try {
      const data = await api.fetch<MemberData[]>(`/companies/${companyId}/members`);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, [companyId]);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await api.fetch<any>(`/vehicles?companyId=${companyId}`);
      setVehicles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  }, [companyId]);

  const loadRoutes = useCallback(async () => {
    try {
      const data = await api.fetch<any>(`/routes?companyId=${companyId}`);
      setRoutes(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    }
  }, [companyId]);

  const loadTrips = useCallback(async () => {
    try {
      const data = await api.fetch<any>(`/trips?companyId=${companyId}&include=route,vehicle,driver`);
      setTrips(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  }, [companyId]);

  const loadStops = useCallback(async () => {
    try {
      const data = await api.fetch<any>(`/stops?companyId=${companyId}`);
      setStops(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load stops:', err);
    }
  }, [companyId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadCompany(), loadMembers(), loadVehicles(), loadRoutes(), loadTrips(), loadStops()]);
      setLoading(false);
    };
    load();
  }, [loadCompany, loadMembers, loadVehicles, loadRoutes, loadTrips, loadStops]);

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t('details.confirmRemove'))) return;
    try {
      await api.fetch(`/companies/${companyId}/members/${userId}`, { method: 'DELETE' });
      toast({ variant: 'success', title: t('details.memberRemoved') });
      loadMembers();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Company not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/companies">{t('details.backToList')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/companies">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">{t('details.title')}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
            company.isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          )}
        >
          {company.isActive ? t('status.active') : t('status.inactive')}
        </span>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('details.info')}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowEditCompanyModal(true)}>
              <Edit className="h-4 w-4 mr-1" />
              {tCommon('actions.edit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-20 w-20 rounded-lg object-cover border"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted">
                <Building2 className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{company.contactEmail}</span>
              </div>
              {company.contactPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{company.contactPhone}</span>
                </div>
              )}
              {company.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{company.address}</span>
                </div>
              )}
            </div>
          </div>
          {company.description && (
            <p className="mt-4 text-sm text-muted-foreground">{company.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('details.members', { count: members.length })}
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddMemberModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('details.addMember')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('details.noMembers')}</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {member.user.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {member.user.firstName} {member.user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {member.user.email}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                      roleBadgeStyles[member.role] || roleBadgeStyles.passenger
                    )}
                  >
                    {roleIcons[member.role]}
                    {t(`details.roles.${member.role}`)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingMember(member)}
                      title={t('details.changeRole')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.userId)}
                      title={t('details.removeMember')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {t('details.vehicles', { count: vehicles.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">{t('details.noVehicles')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">{t('details.vehicleTable.registration')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.vehicleTable.brandModel')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.vehicleTable.capacity')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.vehicleTable.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{v.registrationNumber}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {[v.brand, v.model].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{v.capacity}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            v.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : v.status === 'maintenance'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          )}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            {t('details.routes', { count: routes.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">{t('details.noRoutes')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">{t('details.routeTable.name')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.routeTable.code')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.routeTable.type')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.routeTable.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.code || '-'}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {r.type === 'linear' ? t('details.routeType.linear') : t('details.routeType.loop')}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            r.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          )}
                        >
                          {r.isActive ? t('details.statusActive') : t('details.statusInactive')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            {t('details.trips', { count: trips.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">{t('details.noTrips')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">{t('details.tripTable.route')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.tripTable.vehicle')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.tripTable.driver')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.tripTable.departure')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.tripTable.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.slice(0, 10).map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{trip.route?.name || '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{trip.vehicle?.registrationNumber || '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(trip.scheduledDepartureTime).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            trip.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : trip.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : trip.status === 'cancelled'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          )}
                        >
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {trips.length > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  {t('details.showingTrips', { shown: 10, total: trips.length })}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stops */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('details.stops', { count: stops.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stops.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">{t('details.noStops')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">{t('details.stopTable.name')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.stopTable.code')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.stopTable.city')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('details.stopTable.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stops.map((stop) => (
                    <tr key={stop.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{stop.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{stop.code || '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{stop.city || '-'}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            stop.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          )}
                        >
                          {stop.isActive ? t('details.statusActive') : t('details.statusInactive')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          t={t}
          tCommon={tCommon}
          companyId={companyId}
          onClose={() => setShowAddMemberModal(false)}
          onAdded={() => {
            setShowAddMemberModal(false);
            loadMembers();
          }}
        />
      )}

      {/* Change Role Modal */}
      {editingMember && (
        <ChangeRoleModal
          t={t}
          tCommon={tCommon}
          companyId={companyId}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onUpdated={() => {
            setEditingMember(null);
            loadMembers();
          }}
        />
      )}

      {/* Edit Company Modal */}
      {showEditCompanyModal && company && (
        <EditCompanyModal
          t={t}
          tCommon={tCommon}
          company={company}
          onClose={() => setShowEditCompanyModal(false)}
          onSaved={() => {
            setShowEditCompanyModal(false);
            loadCompany();
          }}
        />
      )}
    </div>
  );
}

function AddMemberModal({
  t,
  tCommon,
  companyId,
  onClose,
  onAdded,
}: {
  t: any;
  tCommon: any;
  companyId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AvailableUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AvailableUser | null>(null);
  const [role, setRole] = useState('driver');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.fetch<AvailableUser[]>(
        `/companies/${companyId}/available-users?search=${encodeURIComponent(query)}`
      );
      setUsers(data);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearching(false);
    }
  }, [companyId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchUsers(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, searchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      await api.fetch(`/companies/${companyId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser.id, role }),
      });
      toast({ variant: 'success', title: t('details.memberAdded') });
      onAdded();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('details.addMemberModal.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User search */}
          {!selectedUser ? (
            <div>
              <label className="text-sm font-medium">{t('details.addMemberModal.selectUser')}</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('details.addMemberModal.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {searching && (
                <p className="mt-2 text-sm text-muted-foreground">{tCommon('actions.loading')}</p>
              )}
              {!searching && users.length === 0 && search.length >= 2 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('details.addMemberModal.noUsersFound')}
                </p>
              )}
              {users.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-muted/50 text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">{t('details.addMemberModal.selectedUser')}</label>
              <div className="mt-1 flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{selectedUser.email}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Role selection */}
          <div>
            <label className="text-sm font-medium">{t('details.addMemberModal.role')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="owner">{t('details.roles.owner')}</option>
              <option value="manager">{t('details.roles.manager')}</option>
              <option value="driver">{t('details.roles.driver')}</option>
              <option value="passenger">{t('details.roles.passenger')}</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={!selectedUser || submitting}>
              {submitting ? t('details.addMemberModal.submitting') : t('details.addMemberModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeRoleModal({
  t,
  tCommon,
  companyId,
  member,
  onClose,
  onUpdated,
}: {
  t: any;
  tCommon: any;
  companyId: string;
  member: MemberData;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [role, setRole] = useState(member.role);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === member.role) {
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      await api.fetch(`/companies/${companyId}/members/${member.userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      toast({ variant: 'success', title: t('details.memberUpdated') });
      onUpdated();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('details.changeRoleModal.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              {member.user.avatarUrl ? (
                <img
                  src={member.user.avatarUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {member.user.firstName} {member.user.lastName}
              </div>
              <div className="text-sm text-muted-foreground truncate">{member.user.email}</div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">{t('details.changeRoleModal.newRole')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="owner">{t('details.roles.owner')}</option>
              <option value="manager">{t('details.roles.manager')}</option>
              <option value="driver">{t('details.roles.driver')}</option>
              <option value="passenger">{t('details.roles.passenger')}</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('details.changeRoleModal.submitting') : t('details.changeRoleModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCompanyModal({
  t,
  tCommon,
  company,
  onClose,
  onSaved,
}: {
  t: any;
  tCommon: any;
  company: CompanyData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: company.name,
    contactEmail: company.contactEmail,
    contactPhone: company.contactPhone || '',
    description: company.description || '',
    address: company.address || '',
    isActive: company.isActive,
    logoUrl: company.logoUrl || '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await api.uploadFile('/storage/upload/company-logo', file);
      setForm({ ...form, logoUrl: url });
    } catch (err: any) {
      setError(err.message || t('createModal.uploadError'));
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
      await api.fetch(`/companies/${company.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      toast({ variant: 'success', title: t('editModal.success') });
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
          <h2 className="text-lg font-semibold">{t('editModal.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('createModal.logo')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <div className="mt-1 flex items-center gap-3">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="h-14 w-14 rounded-lg object-cover border"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
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
                {uploading ? t('createModal.uploading') : t('createModal.selectLogo')}
              </Button>
            </div>
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
            <label className="text-sm font-medium">{t('createModal.contactEmail')}</label>
            <input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.contactPhone')}</label>
            <input
              type="text"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('createModal.address')}</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="companyActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border"
            />
            <label htmlFor="companyActive" className="text-sm font-medium">
              {t('createModal.isActive')}
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

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
