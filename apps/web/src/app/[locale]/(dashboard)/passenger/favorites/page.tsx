'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Heart,
  Building2,
  Route as RouteIcon,
  MapPin,
  Loader2,
  Trash2,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { toast } from '@/hooks/use-toast';
import { fuzzyFilter } from '@/lib/fuzzy-search';

type Tab = 'companies' | 'routes' | 'stops';

export default function FavoritesPage() {
  const t = useTranslations('dashboard.favorites');
  const [activeTab, setActiveTab] = useState<Tab>('companies');
  const [companies, setCompanies] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [c, r, s] = await Promise.all([
          api.fetch<any[]>('/favorites/companies'),
          api.fetch<any[]>('/favorites/routes'),
          api.fetch<any[]>('/favorites/stops'),
        ]);
        setCompanies(c);
        setRoutes(r);
        setStops(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const removeFavorite = async (type: Tab, id: string) => {
    try {
      const endpoint =
        type === 'companies'
          ? `/favorites/companies/${id}`
          : type === 'routes'
            ? `/favorites/routes/${id}`
            : `/favorites/stops/${id}`;
      await api.fetch(endpoint, { method: 'DELETE' });
      toast({ title: t('removed') });

      if (type === 'companies') setCompanies((prev) => prev.filter((f) => f.companyId !== id));
      if (type === 'routes') setRoutes((prev) => prev.filter((f) => f.routeId !== id));
      if (type === 'stops') setStops((prev) => prev.filter((f) => f.stopId !== id));
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'companies', label: t('companies'), icon: Building2, count: companies.length },
    { key: 'routes', label: t('routes'), icon: RouteIcon, count: routes.length },
    { key: 'stops', label: t('stops'), icon: MapPin, count: stops.length },
  ];

  const filteredCompanies = fuzzyFilter(companies, search, [(f) => f.company?.name]);
  const filteredRoutes = fuzzyFilter(routes, search, [(f) => f.route?.name, (f) => f.route?.company?.name]);
  const filteredStops = fuzzyFilter(stops, search, [(f) => f.stop?.name, (f) => f.stop?.city]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-lg border bg-background pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Content */}
      {activeTab === 'companies' && (
        filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noCompanies')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('noCompaniesHint')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredCompanies.map((fav) => (
              <Card key={fav.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fav.company.name}</p>
                    <Link
                      href={`/c/${fav.company.slug}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {t('viewCompany')}
                    </Link>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeFavorite('companies', fav.companyId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('remove')}</TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {activeTab === 'routes' && (
        filteredRoutes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RouteIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noRoutes')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('noRoutesHint')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredRoutes.map((fav) => (
              <Card key={fav.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <RouteIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fav.route.name}</p>
                    <p className="text-xs text-muted-foreground">{fav.route.company?.name}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeFavorite('routes', fav.routeId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('remove')}</TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {activeTab === 'stops' && (
        filteredStops.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noStops')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('noStopsHint')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredStops.map((fav) => (
              <Card key={fav.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fav.stop.name}</p>
                    {fav.stop.city && (
                      <p className="text-xs text-muted-foreground">{fav.stop.city}</p>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeFavorite('stops', fav.stopId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('remove')}</TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
