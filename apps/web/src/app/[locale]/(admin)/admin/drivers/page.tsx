'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Building2, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export default function AdminDriversPage() {
  const t = useTranslations('admin.drivers');
  const tAdmin = useTranslations('admin');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await api.fetch<any>('/companies?limit=200');
        const list = Array.isArray(data) ? data : data.data || [];
        setCompanies(list);
        if (list.length > 0) setSelectedCompanyId(list[0].id);
      } catch (err: any) {
        toast({ variant: 'destructive', title: err.message });
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) return;
    const fetchDrivers = async () => {
      setLoading(true);
      try {
        const data = await api.fetch<Driver[]>(`/users/drivers/company/${selectedCompanyId}`);
        setDrivers(data);
      } catch (err: any) {
        toast({ variant: 'destructive', title: err.message });
        setDrivers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [selectedCompanyId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCheck className="h-6 w-6" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Company selector */}
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <label className="text-sm font-medium">{tAdmin('nav.companies')}:</label>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {!selectedCompanyId ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          {t('noCompany')}
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {drivers.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t('noDrivers')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">{t('table.name')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.email')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.phone')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((driver) => (
                      <tr key={driver.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/drivers/${driver.id}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                              {driver.firstName[0]}{driver.lastName[0]}
                            </div>
                            <span className="font-medium group-hover:text-primary group-hover:underline">
                              {driver.firstName} {driver.lastName}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{driver.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{driver.phone ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
