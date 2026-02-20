'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from '@/i18n/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RouteBuilder from '@/components/routes/RouteBuilder';

interface CompanyOption {
  id: string;
  name: string;
}

export default function AdminNewRoutePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.fetch<any>('/companies?limit=200');
        setCompanies(Array.isArray(data) ? data : data.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!confirmed) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/routes')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Wróć
          </Button>
          <h1 className="text-2xl font-bold">Nowa trasa</h1>
        </div>

        <div className="mx-auto max-w-sm rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-medium">Wybierz firmę</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <select
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
            >
              <option value="">— wybierz firmę —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          <Button
            className="w-full"
            disabled={!selectedCompanyId}
            onClick={() => setConfirmed(true)}
          >
            Dalej
          </Button>
        </div>
      </div>
    );
  }

  return (
    <RouteBuilder
      companyId={selectedCompanyId}
      mode="create"
      canEditName={true}
      backHref="/admin/routes"
    />
  );
}
