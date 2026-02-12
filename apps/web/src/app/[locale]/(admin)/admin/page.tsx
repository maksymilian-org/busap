'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import {
  Users,
  Building2,
  Route,
  Truck,
  Clock,
  Mail,
  Activity,
} from 'lucide-react';

interface DashboardStats {
  users: { total: number; active: number };
  companies: { total: number; active: number };
  routes: { total: number };
  vehicles: { total: number };
  trips: { total: number; active: number };
  invitations: { pending: number };
}

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.fetch<DashboardStats>('/admin/dashboard');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          title: t('stats.users'),
          value: stats.users.total,
          subtitle: t('stats.active', { count: stats.users.active }),
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
          title: t('stats.companies'),
          value: stats.companies.total,
          subtitle: t('stats.active', { count: stats.companies.active }),
          icon: Building2,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
        },
        {
          title: t('stats.routes'),
          value: stats.routes.total,
          subtitle: t('stats.defined'),
          icon: Route,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
        {
          title: t('stats.vehicles'),
          value: stats.vehicles.total,
          subtitle: t('stats.registered'),
          icon: Truck,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        },
        {
          title: t('stats.trips'),
          value: stats.trips.total,
          subtitle: t('stats.inProgress', { count: stats.trips.active }),
          icon: Clock,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        },
        {
          title: t('stats.invitations'),
          value: stats.invitations.pending,
          subtitle: t('stats.pending'),
          icon: Mail,
          color: 'text-pink-600',
          bgColor: 'bg-pink-100 dark:bg-pink-900/30',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                </div>
                <div className={`rounded-lg p-3 ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">{t('manageUsers')}</p>
                <p className="text-sm text-muted-foreground">{t('manageUsersDesc')}</p>
              </div>
            </Link>
            <Link
              href="/admin/invitations"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted transition-colors"
            >
              <Mail className="h-5 w-5 text-pink-600" />
              <div>
                <p className="font-medium">{t('sendInvitation')}</p>
                <p className="text-sm text-muted-foreground">{t('sendInvitationDesc')}</p>
              </div>
            </Link>
            <Link
              href="/admin/companies"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted transition-colors"
            >
              <Building2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">{t('manageCompanies')}</p>
                <p className="text-sm text-muted-foreground">{t('manageCompaniesDesc')}</p>
              </div>
            </Link>
            <Link
              href="/admin/stops"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted transition-colors"
            >
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">{t('stopsOnMap')}</p>
                <p className="text-sm text-muted-foreground">{t('stopsOnMapDesc')}</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
