'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';

// Schedules page has been moved into the Routes view.
// This redirect ensures existing bookmarks/links still work.
export default function SchedulesRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  useEffect(() => {
    router.replace(`/company/${companyId}/routes`);
  }, [router, companyId]);

  return null;
}
