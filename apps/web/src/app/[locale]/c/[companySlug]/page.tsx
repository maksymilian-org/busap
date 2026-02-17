'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Route as RouteIcon,
  Newspaper,
  Loader2,
  AlertCircle,
  Heart,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { DeparturesCountdown } from '@/components/departures-countdown';
import { FavoriteButton } from '@/components/favorite-button';
import { useAuth } from '@/contexts/auth-context';

interface CompanyInfo {
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
}

interface RouteData {
  id: string;
  name: string;
  code?: string;
  currentVersion?: {
    stops: Array<{
      stop: { id: string; name: string; city?: string };
      sequenceNumber: number;
    }>;
  };
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt: string;
  createdAt: string;
}

interface Departure {
  date: string;
  departureTime: string;
  arrivalTime: string;
  departureAt: string;
  route: { id: string; name: string; code?: string };
  stops: Array<{ id: string; name: string; city?: string; sequenceNumber: number }>;
  stopTimes: Array<{ stopName: string; arrivalTime: string; departureTime: string }>;
  scheduleName: string;
}

export default function PublicCompanyPage() {
  const t = useTranslations('public.company');
  const params = useParams();
  const companySlug = params.companySlug as string;
  const { user } = useAuth();

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const companyData = await api.fetchPublic<CompanyInfo>(
          `/companies/slug/${companySlug}`
        );
        setCompany(companyData);

        // Fetch routes, departures, and news in parallel
        const [routesData, departuresData, newsData] = await Promise.all([
          api.fetchPublic<RouteData[]>(`/companies/slug/${companySlug}/routes`),
          api.fetchPublic<Departure[]>(`/companies/slug/${companySlug}/departures?hours=12`),
          api.fetchPublic<NewsItem[]>(`/companies/slug/${companySlug}/news`),
        ]);

        setRoutes(routesData);
        setDepartures(departuresData);
        setNews(newsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load company data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Company not found</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company header */}
      <div className="flex items-start gap-4">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="h-16 w-16 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            {user && (
              <FavoriteButton type="company" id={company.id} />
            )}
          </div>
          {company.description && (
            <p className="mt-1 text-muted-foreground">{company.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {company.contactEmail && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {company.contactEmail}
              </span>
            )}
            {company.contactPhone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {company.contactPhone}
              </span>
            )}
            {company.contactPhone2 && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {company.contactPhone2}
              </span>
            )}
            {company.contactPhone3 && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {company.contactPhone3}
              </span>
            )}
            {company.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {company.address}
              </span>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                <Globe className="h-4 w-4" />
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {company.facebookUrl && (
              <a href={company.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                <ExternalLink className="h-4 w-4" />
                Facebook
              </a>
            )}
            {company.instagramUrl && (
              <a href={company.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                <ExternalLink className="h-4 w-4" />
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Departures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('departures')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {departures.length > 0 ? (
            <DeparturesCountdown departures={departures} />
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {t('noDepartures')}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              {t('routes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {routes.length > 0 ? (
              <div className="space-y-3">
                {routes.map((route) => (
                  <div
                    key={route.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{route.name}</p>
                        {route.code && (
                          <span className="text-xs text-muted-foreground">
                            {route.code}
                          </span>
                        )}
                      </div>
                      {user && (
                        <FavoriteButton type="route" id={route.id} size="sm" />
                      )}
                    </div>
                    {route.currentVersion?.stops && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {route.currentVersion.stops.map((rs, idx) => (
                          <span key={rs.stop.id} className="text-xs text-muted-foreground">
                            {rs.stop.name}
                            {idx < route.currentVersion!.stops.length - 1 && ' → '}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {t('noRoutes')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* News */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                {t('news')}
              </span>
              {news.length > 3 && (
                <Link
                  href={`/c/${companySlug}/news`}
                  className="text-sm font-normal text-primary hover:underline"
                >
                  {t('showAll')}
                </Link>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {news.length > 0 ? (
              <div className="space-y-4">
                {news.slice(0, 3).map((item) => (
                  <article key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {item.excerpt || item.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('publishedAt', {
                        date: new Date(item.publishedAt).toLocaleDateString(),
                      })}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {t('noNews')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
