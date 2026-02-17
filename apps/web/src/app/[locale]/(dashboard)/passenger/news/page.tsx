'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Newspaper, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Link } from '@/i18n/navigation';

interface DashboardData {
  news: Array<{
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    imageUrl?: string;
    publishedAt: string;
    company: { id: string; name: string; slug: string; logoUrl?: string };
  }>;
  favoriteCompanies: any[];
}

export default function PassengerNewsPage() {
  const t = useTranslations('dashboard.news');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.fetch<DashboardData>('/favorites/dashboard');
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const news = data?.news || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Newspaper className="h-6 w-6" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {news.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('noNews')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('noNewsHint')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  {item.company.logoUrl ? (
                    <img
                      src={item.company.logoUrl}
                      alt=""
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                      <Building2 className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <Link
                    href={`/c/${item.company.slug}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {item.company.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="mb-3 h-40 w-full rounded-lg object-cover"
                  />
                )}
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {item.excerpt || item.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
