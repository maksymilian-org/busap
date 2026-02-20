'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Building2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { fuzzyFilter } from '@/lib/fuzzy-search';
import { Link } from '@/i18n/navigation';

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  email?: string;
  isActive: boolean;
}

export default function PassengerCompaniesPage() {
  const t = useTranslations('dashboard.companies');
  const { user } = useAuth();

  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [favoriteCompanyIds, setFavoriteCompanyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [companiesData, favData] = await Promise.all([
        api.fetch<CompanyData[]>('/companies'),
        user ? api.fetch<any[]>('/favorites/companies').catch(() => []) : Promise.resolve([]),
      ]);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setFavoriteCompanyIds(new Set((favData as any[]).map((f: any) => f.id || f.companyId || f.company?.id)));
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleFavorite = async (companyId: string) => {
    if (!user) return;
    const isFav = favoriteCompanyIds.has(companyId);
    try {
      if (isFav) {
        await api.fetch(`/favorites/companies/${companyId}`, { method: 'DELETE' });
        setFavoriteCompanyIds((prev) => { const s = new Set(prev); s.delete(companyId); return s; });
      } else {
        await api.fetch(`/favorites/companies/${companyId}`, { method: 'POST' });
        setFavoriteCompanyIds((prev) => new Set([...prev, companyId]));
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  const filtered = search
    ? fuzzyFilter(companies, search, [(c) => c.name, (c) => c.slug])
    : companies;

  const favoriteCompanies = filtered.filter((c) => favoriteCompanyIds.has(c.id));
  const allCompanies = filtered;

  const CompanyCard = ({ company }: { company: CompanyData }) => (
    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="" className="h-12 w-12 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10 flex-shrink-0">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <Link href={`/passenger/companies/${company.id}`} className="font-medium hover:underline block truncate">
            {company.name}
          </Link>
          <div className="text-xs text-muted-foreground">{company.slug}</div>
          {company.description && (
            <div className="text-xs text-muted-foreground truncate max-w-xs">{company.description}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          company.isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }`}>
          {company.isActive ? 'Aktywna' : 'Nieaktywna'}
        </span>
        {user && (
          <Button variant="ghost" size="sm" onClick={() => toggleFavorite(company.id)}>
            <Star className={`h-4 w-4 ${favoriteCompanyIds.has(company.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle', { count: companies.length })}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Favorites */}
          {user && favoriteCompanies.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{t('favorites')}</h2>
              <div className="space-y-2">
                {favoriteCompanies.map((c) => <CompanyCard key={c.id} company={c} />)}
              </div>
            </div>
          )}

          {/* All companies */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{t('title')} ({allCompanies.length})</h2>
            {allCompanies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">{t('noCompanies')}</CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {allCompanies.map((c) => <CompanyCard key={c.id} company={c} />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
