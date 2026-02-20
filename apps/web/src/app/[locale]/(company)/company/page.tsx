'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { Link, useRouter } from '@/i18n/navigation';
import { Building2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MyCompaniesPage() {
  const t = useTranslations('company');
  const { getMyCompanies, user } = useAuth();
  const router = useRouter();

  const myCompanies = getMyCompanies();

  useEffect(() => {
    if (myCompanies.length === 1) {
      router.replace(`/company/${myCompanies[0].companyId}`);
    }
  }, [myCompanies.length]);

  if (myCompanies.length === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('companies.title')}</h1>
        <p className="text-muted-foreground">{t('companies.description')}</p>
      </div>

      {myCompanies.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t('companies.noCompanies')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myCompanies.map((membership) => {
            const userRole = user?.companyMemberships?.find(
              (m) => m.companyId === membership.companyId
            )?.role;

            return (
              <Link
                key={membership.companyId}
                href={`/company/${membership.companyId}`}
                className="group rounded-lg border bg-card p-6 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {membership.company.logoUrl ? (
                      <img
                        src={membership.company.logoUrl}
                        alt={membership.company.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold group-hover:text-primary">
                        {membership.company.name}
                      </h3>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          userRole === 'owner'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        )}
                      >
                        {t(`roles.${userRole}`)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
