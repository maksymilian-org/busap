'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import RouteBuilder from '@/components/routes/RouteBuilder';

export default function EditRoutePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const routeId = params.routeId as string;
  const { user, isManagerOf } = useAuth();
  const canEditName = user?.systemRole === 'admin' || user?.systemRole === 'superadmin';
  const router = useRouter();
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isManagerOf(companyId)) {
      router.push('/company');
      return;
    }

    const load = async () => {
      try {
        const data = await api.get(`/routes/${routeId}`);
        setRoute(data);
      } catch {
        router.push(`/company/${companyId}/routes`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, routeId, isManagerOf, router]);

  if (!isManagerOf(companyId)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!route) {
    return null;
  }

  return <RouteBuilder companyId={companyId} existingRoute={route} mode="edit" canEditName={canEditName} />;
}
