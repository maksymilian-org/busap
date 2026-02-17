'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Clock, Truck, Route, Users, Plus, ArrowRight, Building2, Mail, Phone, MapPin, Edit, X, Upload, Globe, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompanyStats {
  totalTrips: number;
  totalVehicles: number;
  totalRoutes: number;
  totalMembers: number;
}

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  contactPhone2?: string;
  contactPhone3?: string;
  address?: string;
  website?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  isActive: boolean;
}

export default function CompanyDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const { isManagerOf, isOwnerOf, user } = useAuth();
  const t = useTranslations('company');
  const tCommon = useTranslations('common');

  const [stats, setStats] = useState<CompanyStats>({
    totalTrips: 0,
    totalVehicles: 0,
    totalRoutes: 0,
    totalMembers: 0,
  });
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const isOwner = isOwnerOf(companyId);

  const loadCompany = useCallback(async () => {
    try {
      const data = await api.fetch<CompanyData>(`/companies/${companyId}`);
      setCompany(data);
    } catch (err) {
      console.error('Failed to load company:', err);
    }
  }, [companyId]);

  useEffect(() => {
    if (!isManagerOf(companyId)) {
      router.push('/company');
      return;
    }

    async function fetchData() {
      try {
        const result = await api.get<{ company: any; stats: { vehicleCount: number; routeCount: number; memberCount: number; activeTrips: number } }>(`/companies/${companyId}/stats`);
        setStats({
          totalTrips: result.stats.activeTrips,
          totalVehicles: result.stats.vehicleCount,
          totalRoutes: result.stats.routeCount,
          totalMembers: result.stats.memberCount,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
    fetchData();
  }, [companyId, isManagerOf, router, loadCompany]);

  if (!isManagerOf(companyId)) {
    return null;
  }

  const statCards = [
    {
      label: t('dashboard.stats.totalTrips'),
      value: stats.totalTrips,
      icon: Clock,
      href: `/company/${companyId}/trips`,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
    },
    {
      label: t('dashboard.stats.totalVehicles'),
      value: stats.totalVehicles,
      icon: Truck,
      href: `/company/${companyId}/vehicles`,
      color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
    },
    {
      label: t('dashboard.stats.totalRoutes'),
      value: stats.totalRoutes,
      icon: Route,
      href: `/company/${companyId}/routes`,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
    },
    {
      label: t('dashboard.stats.totalMembers'),
      value: stats.totalMembers,
      icon: Users,
      href: `/company/${companyId}/members`,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
    },
  ];

  const quickActions = [
    {
      label: t('trips.addTrip'),
      href: `/company/${companyId}/trips?action=add`,
      icon: Clock,
    },
    {
      label: t('vehicles.addVehicle'),
      href: `/company/${companyId}/vehicles?action=add`,
      icon: Truck,
    },
    {
      label: t('routes.addRoute'),
      href: `/company/${companyId}/routes?action=add`,
      icon: Route,
    },
    {
      label: t('members.inviteMember'),
      href: `/company/${companyId}/members?action=invite`,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {company?.name || t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
        </div>
      </div>

      {/* Company Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('dashboard.companyInfo')}
            </CardTitle>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                <Edit className="h-4 w-4 mr-1" />
                {tCommon('actions.edit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {company?.logoUrl ? (
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
              {company?.contactEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{company.contactEmail}</span>
                </div>
              )}
              {company?.contactPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{company.contactPhone}</span>
                </div>
              )}
              {company?.address && (
                <div className="flex items-center gap-2 text-sm md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{company.address}</span>
                </div>
              )}
            </div>
          </div>
          {company?.description && (
            <p className="mt-4 text-sm text-muted-foreground">{company.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Public Page Link */}
      {company?.slug && (
        <PublicPageCard t={t} slug={company.slug} />
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-lg border bg-card p-6 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {loading ? (
                  <span className="inline-block h-8 w-12 animate-pulse rounded bg-muted" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">{t('dashboard.quickActions')}</h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button key={action.label} variant="outline" asChild>
              <Link href={action.href} className="gap-2">
                <Plus className="h-4 w-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Edit Company Modal */}
      {showEditModal && company && (
        <EditCompanyModal
          t={t}
          tCommon={tCommon}
          company={company}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            loadCompany();
          }}
        />
      )}
    </div>
  );
}

function PublicPageCard({ t, slug }: { t: any; slug: string }) {
  const [copied, setCopied] = useState(false);
  const locale = useLocale();
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/c/${slug}`
    : `/${locale}/c/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{t('dashboard.publicPage')}</p>
          <p className="text-xs text-muted-foreground truncate">{publicUrl}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="ml-1">{copied ? t('dashboard.urlCopied') : t('dashboard.copyUrl')}</span>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
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
    slug: company.slug,
    contactEmail: company.contactEmail,
    contactPhone: company.contactPhone || '',
    contactPhone2: company.contactPhone2 || '',
    contactPhone3: company.contactPhone3 || '',
    description: company.description || '',
    address: company.address || '',
    logoUrl: company.logoUrl || '',
    website: company.website || '',
    facebookUrl: company.facebookUrl || '',
    instagramUrl: company.instagramUrl || '',
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
      toast({ variant: 'success', title: t('dashboard.editModal.uploadSuccess') });
    } catch (err: any) {
      setError(err.message || t('dashboard.editModal.uploadError'));
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
      await api.fetch(`/companies/${company.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      toast({ variant: 'success', title: t('dashboard.editModal.success') });
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
          <h2 className="text-lg font-semibold">{t('dashboard.editModal.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.logo')}</label>
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
                {uploading ? t('dashboard.editModal.uploading') : t('dashboard.editModal.selectLogo')}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.name')}</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.contactEmail')}</label>
            <input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.contactPhone')}</label>
            <input
              type="text"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.address')}</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.slug')}</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.editModal.slugHint')}</p>
          </div>

          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.contactPhone2')}</label>
            <input
              type="text"
              value={form.contactPhone2}
              onChange={(e) => setForm({ ...form, contactPhone2: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.contactPhone3')}</label>
            <input
              type="text"
              value={form.contactPhone3}
              onChange={(e) => setForm({ ...form, contactPhone3: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t('dashboard.editModal.website')}</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Facebook</label>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
              placeholder="https://facebook.com/..."
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Instagram</label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/..."
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('dashboard.editModal.submitting') : t('dashboard.editModal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
