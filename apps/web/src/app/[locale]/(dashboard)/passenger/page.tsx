'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Map,
  Heart,
  Newspaper,
  Clock,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DeparturesCountdown } from '@/components/departures-countdown';

interface DashboardData {
  news: Array<{
    id: string;
    title: string;
    excerpt?: string;
    publishedAt: string;
    company: { id: string; name: string; slug: string; logoUrl?: string };
  }>;
  companies: Array<{
    id: string;
    companyId: string;
    company: { id: string; name: string; slug: string };
  }>;
}

export default function PassengerDashboardPage() {
  const t = useTranslations('dashboard');
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.fetch<DashboardData>('/favorites/dashboard');
        setDashboardData(data);
      } catch {
        // Not critical
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const quickLinks = [
    { label: t('quickLinks.search'), href: '/passenger/search', icon: Search },
    { label: t('quickLinks.map'), href: '/passenger/map', icon: Map },
    { label: t('quickLinks.favorites'), href: '/passenger/favorites', icon: Heart },
    { label: t('quickLinks.news'), href: '/passenger/news', icon: Newspaper },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t('home.welcome', { name: user?.firstName || '' })}
        </h1>
        <p className="text-muted-foreground">{t('home.subtitle')}</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
              <link.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Latest News */}
          {dashboardData?.news && dashboardData.news.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  {t('home.latestNews')}
                </CardTitle>
                <Link href="/passenger/news" className="text-sm text-primary hover:underline flex items-center gap-1">
                  {t('home.viewAll')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.news.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                    {item.company.logoUrl ? (
                      <img src={item.company.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {item.company.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.company.name} · {new Date(item.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Favorite Companies */}
          {dashboardData?.companies && dashboardData.companies.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {t('home.favoriteCompanies')}
                </CardTitle>
                <Link href="/passenger/favorites" className="text-sm text-primary hover:underline flex items-center gap-1">
                  {t('home.viewAll')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dashboardData.companies.map((fav) => (
                    <Link
                      key={fav.id}
                      href={`/c/${fav.company.slug}`}
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      {fav.company.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {(!dashboardData?.news || dashboardData.news.length === 0) &&
           (!dashboardData?.companies || dashboardData.companies.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('home.emptyState')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('home.emptyStateHint')}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
