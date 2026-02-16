'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import RouteBuilder from '@/components/routes/RouteBuilder';

export default function NewRoutePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { user, isManagerOf } = useAuth();
  const canEditName = user?.systemRole === 'admin' || user?.systemRole === 'superadmin';
  const router = useRouter();

  useEffect(() => {
    if (!isManagerOf(companyId)) {
      router.push('/company');
    }
  }, [companyId, isManagerOf, router]);

  if (!isManagerOf(companyId)) {
    return null;
  }

  return <RouteBuilder companyId={companyId} mode="create" canEditName={canEditName} />;
}
