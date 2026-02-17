'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ArrowLeft, Newspaper, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Link } from '@/i18n/navigation';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt: string;
  createdAt: string;
}

export default function PublicCompanyNewsPage() {
  const t = useTranslations('public.company');
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await api.fetchPublic<NewsItem[]>(
          `/companies/slug/${companySlug}/news`
        );
        setNews(data);
      } catch (err) {
        console.error('Failed to load news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [companySlug]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/c/${companySlug}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            {t('allNews')}
          </h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/c/${companySlug}`} className="hover:underline">
              {t('backToCompany')}
            </Link>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : news.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('noNews')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="mb-4 h-48 w-full rounded-lg object-cover"
                  />
                )}
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('publishedAt', {
                    date: new Date(item.publishedAt).toLocaleDateString(),
                  })}
                </p>
                <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
