'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useRouter } from '@/i18n/navigation';
import RouteBuilder from '@/components/routes/RouteBuilder';

export default function AdminEditRoutePage() {
  const params = useParams();
  const routeId = params.routeId as string;
  const router = useRouter();
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get(`/routes/${routeId}`);
        setRoute(data);
      } catch {
        router.push('/admin/routes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [routeId, router]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!route) return null;

  return (
    <RouteBuilder
      companyId={route.companyId}
      existingRoute={route}
      mode="edit"
      canEditName={true}
      backHref="/admin/routes"
    />
  );
}
